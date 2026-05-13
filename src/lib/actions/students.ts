"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudent(data: {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  no_hp?: string;
  billings?: {
    jenis: string;
    nominal: number;
    jatuh_tempo: string;
    status: "LUNAS" | "BELUM_LUNAS";
  }[]
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

    // 2. Handle Initial Billings if provided
    if (data.billings && data.billings.length > 0) {
      const timestamp = Date.now();
      
      for (let i = 0; i < data.billings.length; i++) {
        const billData = data.billings[i];
        if (billData.nominal <= 0) continue;

        const { data: bill, error: billError } = await supabase
          .from("tagihan")
          .insert({
            mahasiswa_id: student.id,
            kode: `INV-${data.nim}-${timestamp}-${i}`,
            jenis: billData.jenis,
            jumlah: billData.nominal,
            sisa_tagihan: billData.status === "LUNAS" ? 0 : billData.nominal,
            status: billData.status,
            jatuh_tempo: billData.jatuh_tempo
          })
          .select()
          .single();

        if (billError) throw billError;

        // 3. Handle Auto-Payment if LUNAS
        if (billData.status === "LUNAS") {
          const { error: paymentError } = await supabase
            .from("pembayaran")
            .insert({
              tagihan_id: bill.id,
              jumlah_bayar: billData.nominal,
              metode: "TUNAI",
              status: "VERIFIED" // Using VERIFIED as per latest system
            });
          
          if (paymentError) throw paymentError;
        }
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
  new_billings?: {
    jenis: string;
    nominal: number;
    jatuh_tempo: string;
    status: "LUNAS" | "BELUM_LUNAS";
  }[]
}) {
  const supabase = createClient();

  try {
    // 1. Update Biodata Mahasiswa
    const { error: studentError } = await supabase
      .from("mahasiswa")
      .update({
        nim: data.nim,
        nama: data.nama,
        prodi: data.prodi,
        angkatan: data.angkatan,
        no_hp: data.no_hp
      })
      .eq("id", id);

    if (studentError) throw studentError;

    // 2. Handle New Billings if provided
    if (data.new_billings && data.new_billings.length > 0) {
      const timestamp = Date.now();
      
      for (let i = 0; i < data.new_billings.length; i++) {
        const billData = data.new_billings[i];
        if (billData.nominal <= 0) continue;

        const { data: bill, error: billError } = await supabase
          .from("tagihan")
          .insert({
            mahasiswa_id: id,
            kode: `INV-${data.nim}-${timestamp}-${i}`,
            jenis: billData.jenis,
            jumlah: billData.nominal,
            sisa_tagihan: billData.status === "LUNAS" ? 0 : billData.nominal,
            status: billData.status,
            jatuh_tempo: billData.jatuh_tempo
          })
          .select()
          .single();

        if (billError) throw billError;

        // 3. Handle Auto-Payment if LUNAS
        if (billData.status === "LUNAS") {
          const { error: paymentError } = await supabase
            .from("pembayaran")
            .insert({
              tagihan_id: bill.id,
              jumlah_bayar: billData.nominal,
              metode: "TUNAI",
              status: "VERIFIED"
            });
          
          if (paymentError) throw paymentError;
        }
      }
    }

    revalidatePath("/mahasiswa");
    revalidatePath("/tagihan");
    revalidatePath("/");
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
        sisa_tagihan: row.status === "LUNAS" ? 0 : (Number(row.nominal) || 0),
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
