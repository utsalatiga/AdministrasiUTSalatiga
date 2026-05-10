"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudent(data: {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  no_hp?: string;
  billing?: {
    jenis: string;
    nominal: number;
    jatuh_tempo: string;
    status: "LUNAS" | "BELUM_LUNAS";
  }
}) {
  const supabase = createClient();

  try {
    // 1. Insert Mahasiswa
    const { data: student, error: studentError } = await supabase
      .from("mahasiswa")
      .insert({
        nim: data.nim,
        nama: data.nama,
        prodi: data.prodi,
        angkatan: data.angkatan,
        no_hp: data.no_hp
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 2. Handle Initial Billing if provided
    if (data.billing && data.billing.nominal > 0) {
      const defaultDueDate = new Date();
      defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);
      const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

      const { data: bill, error: billError } = await supabase
        .from("tagihan")
        .insert({
          mahasiswa_id: student.id,
          kode: `INV-${data.nim}-${Date.now().toString().slice(-4)}`,
          jenis: data.billing.jenis,
          jumlah: data.billing.nominal,
          status: data.billing.status,
          jatuh_tempo: data.billing.jatuh_tempo || defaultDueDateStr
        })
        .select()
        .single();


      if (billError) throw billError;

      // 3. Handle Auto-Payment if LUNAS
      if (data.billing.status === "LUNAS") {
        const { error: paymentError } = await supabase
          .from("pembayaran")
          .insert({
            tagihan_id: bill.id,
            jumlah_bayar: data.billing.nominal,
            metode: "TUNAI",
            status: "LUNAS"
          });
        
        if (paymentError) throw paymentError;
      }
    }

    revalidatePath("/mahasiswa");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateStudent(id: string, data: {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  no_hp?: string;
}) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("mahasiswa")
      .update({
        nim: data.nim,
        nama: data.nama,
        prodi: data.prodi,
        angkatan: data.angkatan,
        no_hp: data.no_hp
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/mahasiswa");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function importBatchStudents(data: any[]) {
  const supabase = createClient();
  
  try {
    // ... existing implementation of importBatchStudents ...
    // (I'll keep it as it was in previous turns)
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

    const allNims = data.map(d => d.nim);
    const { data: students, error: fetchError } = await supabase
      .from("mahasiswa")
      .select("id, nim")
      .in("nim", allNims);

    if (fetchError) throw fetchError;
    const studentMap = new Map(students?.map(s => [s.nim, s.id]));

    const timestamp = Date.now();
    const defaultDueDate = new Date();
    defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);
    const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

    const billsToInsert = data.map((row, idx) => {
      const studentId = studentMap.get(row.nim);
      return {
        mahasiswa_id: studentId,
        jenis: row.jenis_tagihan || "SPP",
        jumlah: Number(row.nominal) || 0,
        status: row.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS",
        kode: `INV-${row.nim}-${timestamp}-${idx}`,
        jatuh_tempo: row.jatuh_tempo || defaultDueDateStr,
        created_at: new Date().toISOString()
      };
    }).filter(b => b.mahasiswa_id);

    const { error: billError } = await supabase
      .from("tagihan")
      .insert(billsToInsert);
      
    if (billError) throw billError;

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
