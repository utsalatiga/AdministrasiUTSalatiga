"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/roles";

const defaultDueDate = new Date();
defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);
const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

export async function createStudent(data: {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: string;
  no_hp?: string;
  billings?: {
    id?: string;
    jenis: string;
    nominal: number;
    nomor_billing?: string;
    status: "LUNAS" | "BELUM_LUNAS";
  }[];
  nik?: string;
  tanggalLahir?: string;
  namaIbu?: string;
  noWa?: string;
  lokasiUjian?: string;
  totalDeposit?: number;
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
        no_hp: data.noWa || data.no_hp,
        deposit: data.totalDeposit || 0,
        nik: data.nik || null,
        tanggal_lahir: data.tanggalLahir || null,
        nama_ibu: data.namaIbu || null,
        lokasi_ujian: data.lokasiUjian || null
      })
      .select()
      .single();

    if (studentError) throw studentError;

    let remainingDeposit = data.totalDeposit || 0;
    const timestamp = Date.now();

    // 2. Handle Billings
    if (data.billings && data.billings.length > 0) {
      for (let i = 0; i < data.billings.length; i++) {
        const billData = data.billings[i];
        if (billData.nominal <= 0) continue;

        const isUtama = i === 0;
        const sisa = billData.status === "LUNAS" ? 0 : billData.nominal;

        const { data: bill, error: billError } = await supabase
          .from("tagihan")
          .insert({
            mahasiswa_id: student.id,
            kode: `INV-${data.nim}-${timestamp}-${i}`,
            jenis: billData.jenis,
            jumlah: billData.nominal,
            sisa_tagihan: sisa,
            status: billData.status,
            jatuh_tempo: defaultDueDateStr,
            tipe_billing: isUtama ? "utama" : "tambahan",
            nomor_billing: billData.nomor_billing || null
          })
          .select()
          .single();

        if (billError) throw billError;

        // 3. Handle Pembayaran
        if (billData.status === "LUNAS") {
          const useDeposit = Math.min(remainingDeposit, billData.nominal);
          const metode = useDeposit > 0 ? "DEPOSIT_AWAL" : "TUNAI";
          if (useDeposit > 0) remainingDeposit -= useDeposit;

          const { error: paymentError } = await supabase
            .from("pembayaran")
            .insert({
              tagihan_id: bill.id,
              jumlah_bayar: billData.nominal,
              metode,
              status: "VERIFIED"
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
  billings?: {
    id?: string;
    jenis: string;
    nominal: number;
    nomor_billing?: string;
    status: "LUNAS" | "BELUM_LUNAS";
  }[];
  nik?: string;
  tanggalLahir?: string;
  namaIbu?: string;
  noWa?: string;
  lokasiUjian?: string;
  totalDeposit?: number;
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
        no_hp: data.noWa || data.no_hp,
        deposit: data.totalDeposit || 0,
        nik: data.nik || null,
        tanggal_lahir: data.tanggalLahir || null,
        nama_ibu: data.namaIbu || null,
        lokasi_ujian: data.lokasiUjian || null
      })
      .eq("id", id);

    if (studentError) throw studentError;

    // 2. Sync Billings
    if (data.billings) {
      // Get existing billings from database
      const { data: dbBills, error: fetchError } = await supabase
        .from("tagihan")
        .select("id")
        .eq("mahasiswa_id", id);
      
      if (fetchError) throw fetchError;
      
      const dbBillIds = dbBills?.map((b: any) => b.id) || [];
      const incomingBillIds = data.billings.map((b: any) => b.id).filter(Boolean) as string[];

      // Delete bills that are not in incoming list
      const billsToDelete = dbBillIds.filter(bid => !incomingBillIds.includes(bid));
      if (billsToDelete.length > 0) {
        // Delete payments associated with these bills first
        await supabase.from("pembayaran").delete().in("tagihan_id", billsToDelete);
        // Delete the bills
        const { error: deleteError } = await supabase.from("tagihan").delete().in("id", billsToDelete);
        if (deleteError) throw deleteError;
      }

      let remainingDeposit = data.totalDeposit || 0;
      const timestamp = Date.now();

      // Process incoming bills
      for (let i = 0; i < data.billings.length; i++) {
        const billData = data.billings[i];
        if (billData.nominal <= 0) continue;

        const isUtama = i === 0;
        const sisa = billData.status === "LUNAS" ? 0 : billData.nominal;

        if (billData.id) {
          // Update existing bill
          const { error: updateError } = await supabase
            .from("tagihan")
            .update({
              jenis: billData.jenis,
              jumlah: billData.nominal,
              sisa_tagihan: sisa,
              status: billData.status,
              nomor_billing: billData.nomor_billing || null,
              tipe_billing: isUtama ? "utama" : "tambahan"
            })
            .eq("id", billData.id);

          if (updateError) throw updateError;

          // If LUNAS, check if payment exists
          if (billData.status === "LUNAS") {
            const { data: payments } = await supabase
              .from("pembayaran")
              .select("id")
              .eq("tagihan_id", billData.id)
              .limit(1);

            if (!payments || payments.length === 0) {
              const useDeposit = Math.min(remainingDeposit, billData.nominal);
              const metode = useDeposit > 0 ? "DEPOSIT_AWAL" : "TUNAI";
              if (useDeposit > 0) remainingDeposit -= useDeposit;

              const { error: paymentError } = await supabase
                .from("pembayaran")
                .insert({
                  tagihan_id: billData.id,
                  jumlah_bayar: billData.nominal,
                  metode,
                  status: "VERIFIED"
                });

              if (paymentError) throw paymentError;
            }
          } else {
            // If status is changed back to BELUM_LUNAS, delete any existing payments
            await supabase.from("pembayaran").delete().eq("tagihan_id", billData.id);
          }
        } else {
          // Insert new bill
          const { data: newBill, error: insertError } = await supabase
            .from("tagihan")
            .insert({
              mahasiswa_id: id,
              kode: `INV-${data.nim}-${timestamp}-${i}`,
              jenis: billData.jenis,
              jumlah: billData.nominal,
              sisa_tagihan: sisa,
              status: billData.status,
              jatuh_tempo: defaultDueDateStr,
              tipe_billing: isUtama ? "utama" : "tambahan",
              nomor_billing: billData.nomor_billing || null
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (billData.status === "LUNAS") {
            const useDeposit = Math.min(remainingDeposit, billData.nominal);
            const metode = useDeposit > 0 ? "DEPOSIT_AWAL" : "TUNAI";
            if (useDeposit > 0) remainingDeposit -= useDeposit;

            const { error: paymentError } = await supabase
              .from("pembayaran")
              .insert({
                tagihan_id: newBill.id,
                jumlah_bayar: billData.nominal,
                metode,
                status: "VERIFIED"
              });

            if (paymentError) throw paymentError;
          }
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

export async function deleteMahasiswa(id: string) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!isSuperAdmin(profile?.role)) throw new Error("Akses Ditolak: Hanya Super Admin yang dapat menghapus data mahasiswa.");

    // Cascade delete is handled by database if RLS and FK are set, 
    // but we'll do it explicitly if needed.
    const { error } = await supabase.from("mahasiswa").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/mahasiswa");
    revalidatePath("/tagihan");
    revalidatePath("/pembayaran");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
