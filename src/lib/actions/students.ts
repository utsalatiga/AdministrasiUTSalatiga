"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function importBatchStudents(data: any[]) {
  const supabase = createClient();
  
  try {
    // 1. Bulk Upsert Mahasiswa
    const studentData = data.map(row => ({
      nim: row.nim,
      nama: row.nama,
      prodi: row.prodi,
      angkatan: row.angkatan
    }));

    const { error: studentError } = await supabase
      .from("mahasiswa")
      .upsert(studentData, { onConflict: "nim" });
      
    if (studentError) throw studentError;

    // 2. Fetch IDs to link
    const allNims = data.map(d => d.nim);
    const { data: students, error: fetchError } = await supabase
      .from("mahasiswa")
      .select("id, nim")
      .in("nim", allNims);

    if (fetchError) throw fetchError;
    const studentMap = new Map(students?.map(s => [s.nim, s.id]));

    // 3. Prepare and Bulk Insert Tagihan
    const timestamp = Date.now();
    const billsToInsert = data.map((row, idx) => {
      const studentId = studentMap.get(row.nim);
      return {
        mahasiswa_id: studentId,
        jenis: row.jenis_tagihan || "SPP",
        jumlah: Number(row.nominal) || 0,
        status: row.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS",
        kode: `INV-${row.nim}-${timestamp}-${idx}`,
        created_at: new Date().toISOString()
      };
    }).filter(b => b.mahasiswa_id);

    const { error: billError } = await supabase
      .from("tagihan")
      .insert(billsToInsert);
      
    if (billError) throw billError;

    // 4. Handle Payments
    const lunasBills = billsToInsert.filter(b => b.status === "LUNAS");
    if (lunasBills.length > 0) {
      const { data: createdBills, error: billFetchError } = await supabase
        .from("tagihan")
        .select("id, kode")
        .in("kode", lunasBills.map(b => b.kode));

      if (billFetchError) throw billFetchError;

      const billMap = new Map(createdBills?.map(b => [b.kode, b.id]));
      const paymentsToInsert = lunasBills.map(b => ({
        tagihan_id: billMap.get(b.kode),
        jumlah_bayar: b.jumlah,
        metode: "TUNAI",
        status: "LUNAS",
        created_at: new Date().toISOString()
      })).filter(p => p.tagihan_id);

      if (paymentsToInsert.length > 0) {
        const { error: paymentError } = await supabase
          .from("pembayaran")
          .insert(paymentsToInsert);
        if (paymentError) throw paymentError;
      }
    }

    revalidatePath("/mahasiswa");
    revalidatePath("/tagihan");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Import Error:", error);
    return { error: error.message };
  }
}
