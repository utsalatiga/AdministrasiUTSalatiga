"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/roles";
import { studentImportRowSchema } from "@/lib/validations/student";

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
    status: "LUNAS" | "BELUM_LUNAS" | "DICICIL";
  }[];
  nik?: string;
  tanggalLahir?: string;
  namaIbu?: string;
  noWa?: string;
  lokasiUjian?: string;
  totalDeposit?: number;
  nomorBillingUtama?: string;
  totalBillingUtama?: number;
  nomorBillingTambahan?: string;
  totalBillingTambahan?: number;
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

        const isUtama = i === 0 || billData.jenis === "Uang Semester";
        const nomorBilling = isUtama ? data.nomorBillingUtama : data.nomorBillingTambahan;
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
            nomor_billing: nomorBilling || null
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
    status: "LUNAS" | "BELUM_LUNAS" | "DICICIL";
  }[];
  nik?: string;
  tanggalLahir?: string;
  namaIbu?: string;
  noWa?: string;
  lokasiUjian?: string;
  totalDeposit?: number;
  nomorBillingUtama?: string;
  totalBillingUtama?: number;
  nomorBillingTambahan?: string;
  totalBillingTambahan?: number;
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

        const isUtama = i === 0 || billData.jenis === "Uang Semester";
        const nomorBilling = isUtama ? data.nomorBillingUtama : data.nomorBillingTambahan;
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
              nomor_billing: nomorBilling || null,
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
              nomor_billing: nomorBilling || null
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
  
  let studentsCreated = 0;
  let billsMain = 0;
  let billsAdditional = 0;
  let paymentsVerified = 0;

  const validStudents: any[] = [];
  const validRows: any[] = [];

  try {
    // 1. Loop only to validate and collect clean rows in memory
    for (const rawRow of data) {
      try {
        const validated = studentImportRowSchema.parse(rawRow);
        validStudents.push({
          nim: validated.nim,
          nama: validated.nama,
          prodi: validated.prodi || null,
          angkatan: validated.angkatan || null,
          nik: validated.nik || null,
          tanggal_lahir: validated.tanggal_lahir || null,
          nama_ibu: validated.nama_ibu || null,
          no_hp: validated.no_hp || null,
          lokasi_ujian: validated.lokasi_ujian || null,
          deposit: 0
        });
        validRows.push(validated);
      } catch (rowError) {
        console.error("Skipping corrupted import row validation:", rowError, rawRow);
      }
    }

    if (validStudents.length === 0) {
      return {
        success: true,
        metrics: {
          studentsCreated: 0,
          billsMain: 0,
          billsAdditional: 0,
          paymentsVerified: 0
        }
      };
    }

    // 2. Perform exactly ONE bulk upsert for all validated students
    const { error: studentError } = await supabase
      .from("mahasiswa")
      .upsert(validStudents, { onConflict: "nim" });

    if (studentError) {
      throw new Error(`Failed to bulk upsert students: ${studentError.message}`);
    }

    studentsCreated = validStudents.length;

    // 3. Fetch all generated student IDs in bulk
    const allNims = validStudents.map(s => s.nim);
    const { data: students, error: fetchError } = await supabase
      .from("mahasiswa")
      .select("id, nim")
      .in("nim", allNims);

    if (fetchError || !students) {
      throw new Error(`Failed to fetch student IDs: ${fetchError?.message}`);
    }

    const studentMap = new Map(students.map(s => [s.nim, s.id]));

    // 4. Construct billings list for bulk insert
    const timestamp = Date.now();
    const defaultDueDate = new Date();
    defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);
    const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

    const billsToInsert: any[] = [];

    validRows.forEach(validatedRow => {
      const studentId = studentMap.get(validatedRow.nim);
      if (!studentId || !validatedRow.billings) return;

      validatedRow.billings.forEach((bill: any, idx: number) => {
        const isUtama = idx === 0 || bill.jenis === "Uang Semester";
        const tipeBilling = isUtama ? "utama" : "tambahan";

        if (tipeBilling === "utama") {
          billsMain++;
        } else {
          billsAdditional++;
        }

        billsToInsert.push({
          mahasiswa_id: studentId,
          jenis: bill.jenis || "Uang Semester",
          jumlah: bill.nominal,
          status: bill.status || "BELUM_LUNAS",
          nomor_billing: bill.nomor_billing || null,
          jatuh_tempo: bill.jatuh_tempo || defaultDueDateStr,
          sisa_tagihan: bill.status === "LUNAS" ? 0 : bill.nominal,
          tipe_billing: tipeBilling,
          kode: `INV-${validatedRow.nim}-${timestamp}-${idx}-${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString()
        });
      });
    });

    // 5. Bulk insert billings
    if (billsToInsert.length > 0) {
      const { error: billError } = await supabase
        .from("tagihan")
        .insert(billsToInsert);

      if (billError) {
        throw new Error(`Failed to bulk insert bills: ${billError.message}`);
      }
    }

    // 6. Handle payments for LUNAS bills
    const lunasBills = billsToInsert.filter(b => b.status === "LUNAS");
    
    if (lunasBills.length > 0) {
      // Query generated bill IDs by their unique codes
      const { data: createdBills, error: billFetchError } = await supabase
        .from("tagihan")
        .select("id, kode")
        .in("kode", lunasBills.map(b => b.kode));

      if (billFetchError || !createdBills) {
        throw new Error(`Failed to fetch created bill IDs: ${billFetchError?.message}`);
      }

      const billMap = new Map(createdBills.map(b => [b.kode, b.id]));
      const paymentsToInsert = lunasBills
        .map(b => {
          const billId = billMap.get(b.kode);
          if (!billId) return null;
          return {
            tagihan_id: billId,
            jumlah_bayar: b.jumlah,
            metode: "IMPORT_EXCEL",
            status: "VERIFIED",
            created_at: new Date().toISOString()
          };
        })
        .filter(Boolean) as any[];

      if (paymentsToInsert.length > 0) {
        const { error: paymentError } = await supabase
          .from("pembayaran")
          .insert(paymentsToInsert);

        if (paymentError) {
          throw new Error(`Failed to bulk insert payments: ${paymentError.message}`);
        }
        paymentsVerified = paymentsToInsert.length;
      }
    }

    revalidatePath("/mahasiswa");
    revalidatePath("/tagihan");
    revalidatePath("/");
    
    return { 
      success: true,
      metrics: {
        studentsCreated,
        billsMain,
        billsAdditional,
        paymentsVerified
      }
    };
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
