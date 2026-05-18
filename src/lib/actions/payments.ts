"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateNoKwitansi(tagihanId: string) {
  const supabase = createClient();
  
  // 1. Ambil data tagihan dan mahasiswa
  const { data: billData, error: billErr } = await supabase
    .from("tagihan")
    .select(`
      id,
      semester,
      mahasiswa:mahasiswa_id (
        id,
        nim,
        nama
      )
    `)
    .eq("id", tagihanId)
    .single();

  if (billErr) throw new Error("Gagal mengambil data tagihan: " + billErr.message);

  // Periksa apakah mahasiswa berupa array atau objek tunggal
  const mhs = Array.isArray(billData?.mahasiswa) ? billData?.mahasiswa[0] : billData?.mahasiswa;
  const nim = mhs?.nim || "000000000";

  // 2. Waktu server saat ini (menjaga dari masalah zona waktu)
  const now = new Date();
  const year = now.getFullYear();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ddmm = `${day}${month}`;

  // 3. Penentuan semester (hanya dari tagihan, dengan fallback otomatis jika kosong/null)
  let semester = billData?.semester;
  if (!semester) {
    semester = now.getMonth() < 6 ? `${year}.1` : `${year}.2`;
  }

  // 4. Nomor urut transaksi hari ini (3 digit)
  const todayStr = now.toISOString().split('T')[0];
  const { count, error: countErr } = await supabase
    .from("pembayaran")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${todayStr}T00:00:00.000Z`)
    .lte("created_at", `${todayStr}T23:59:59.999Z`);

  const nextUrut = (count || 0) + 1;
  const noUrut = String(nextUrut).padStart(3, '0');

  // 5. Rakit menjadi satu string terstruktur
  return `${year}/${ddmm}/${semester}/${nim}/${noUrut}`;
}

export async function createCashPayment(formData: {
  tagihan_id: string;
  jumlah_bayar: number;
  metode: string;
  status: "LUNAS" | "PENDING";
  bank_pengirim?: string;
  bank_tujuan?: string;
  bukti_url?: string;
  nominal_deposit?: number;
}) {
  const supabase = createClient();

  try {
    const jumlahBayar = formData.jumlah_bayar || 0;
    const nominalDeposit = formData.nominal_deposit || 0;
    const isFullDeposit = jumlahBayar === 0 && nominalDeposit > 0;

    // Generate nomor kwitansi otomatis dengan format terstruktur
    const noKwitansi = await generateNoKwitansi(formData.tagihan_id);

    if (formData.status === "LUNAS" || isFullDeposit) {
      // Use the robust RPC to ensure atomic balance update and status change
      const { error: rpcError } = await supabase.rpc("process_manual_payment", {
        p_tagihan_id: formData.tagihan_id,
        p_jumlah_bayar: jumlahBayar,
        p_metode: isFullDeposit ? "TUNAI" : formData.metode,
        p_bank_pengirim: formData.bank_pengirim || (formData.metode === "TUNAI" || isFullDeposit ? "Cash" : "Transfer"),
        p_bank_tujuan: formData.bank_tujuan || "Admin",
        p_bukti_url: formData.bukti_url || (isFullDeposit ? "Pembayaran Penuh via Deposit" : "Pencatatan Manual Admin"),
        p_order_id: `MANUAL-${Date.now()}`,
        p_nominal_deposit: nominalDeposit,
        p_no_kwitansi: noKwitansi
      });

      if (rpcError) throw new Error(rpcError.message);
    } else {
      // If PENDING, just insert the payment record without updating the bill balance yet
      // Verification will happen later via the Verification module
      const { error: paymentError } = await supabase
        .from("pembayaran")
        .insert([
          {
            tagihan_id: formData.tagihan_id,
            jumlah_bayar: formData.jumlah_bayar,
            metode: formData.metode,
            status: "PENDING",
            bukti_url: formData.bukti_url || "Menunggu Verifikasi",
            bank_pengirim: formData.bank_pengirim,
            bank_tujuan: formData.bank_tujuan,
            no_kwitansi: noKwitansi
          },
        ]);

      if (paymentError) throw new Error(paymentError.message);
    }

    revalidatePath("/pembayaran");
    revalidatePath("/tagihan");
    revalidatePath("/mahasiswa");
    revalidatePath("/dashboard");
    revalidatePath("/verifikasi");
    
    return { success: true, no_kwitansi: noKwitansi };
  } catch (error: any) {
    return { error: error.message };
  }
}


export async function getStudentBills(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tagihan")
    .select("id, kode, jenis, jumlah, sisa_tagihan, status, jatuh_tempo")
    .eq("mahasiswa_id", studentId);
    
  if (error) return { error: error.message };
  return { data };
}

export async function searchStudents(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id, nim, nama, deposit")
    .or(`nama.ilike.%${query}%,nim.ilike.%${query}%`);

  if (error) return { error: error.message };
  return { data };
}

export async function getStudentFinancialSummary(studentId: string) {
  const supabase = createClient();
  
  const { data: bills, error: billsError } = await supabase
    .from("tagihan")
    .select("jumlah, sisa_tagihan, status")
    .eq("mahasiswa_id", studentId);

  if (billsError) return { error: billsError.message };

  const totalTagihan = bills.reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const totalArrears = bills.reduce((acc, curr) => {
    const sisa = curr.sisa_tagihan !== null ? curr.sisa_tagihan : (curr.status === "LUNAS" ? 0 : curr.jumlah);
    return acc + Number(sisa);
  }, 0);
  
  const isLunas = bills.length > 0 && totalArrears === 0;
  const hasUnpaid = bills.some(b => b.status === "BELUM_LUNAS" || b.status === "MENCICIL");

  return { 
    totalTagihan,
    totalArrears,
    status: isLunas ? "LUNAS" : (hasUnpaid ? "MENUNGGAK" : "TIDAK ADA TAGIHAN"),
    billsCount: bills.length
  };
}

export async function getStudentDetails(studentId: string) {
  const supabase = createClient();
  
  const { data: student } = await supabase
    .from("mahasiswa")
    .select("id, nim, nama, prodi, angkatan, deposit, no_hp")
    .eq("id", studentId)
    .single();

  const { data: bills } = await supabase
    .from("tagihan")
    .select("id, kode, jenis, jumlah, sisa_tagihan, status, jatuh_tempo")
    .eq("mahasiswa_id", studentId)
    .order("created_at", { ascending: false });

  // Get payments for these bills
  const billIds = bills?.map(b => b.id) || [];
  const { data: payments } = await supabase
    .from("pembayaran")
    .select(`
      id,
      jumlah_bayar,
      metode,
      bukti_url,
      created_at,
      status,
      tagihan:tagihan_id (
        id,
        jenis
      )
    `)
    .in("tagihan_id", billIds)
    .order("created_at", { ascending: false });

  return { student, bills: bills || [], payments: payments || [] };
}

export async function getRekeningKampus() {
  const supabase = createClient();
  const defaultRekenings = [
    { id: "1", bank_name: "Bank Mandiri - UT Salatiga", account_number: "123-00-0123456-7", account_name: "UT Salatiga Operasional" },
    { id: "2", bank_name: "Bank BRI - UT Salatiga", account_number: "0123-01-000456-50-1", account_name: "UT Salatiga Penerimaan" },
    { id: "3", bank_name: "Bank BNI - UT Salatiga", account_number: "0987654321", account_name: "UT Salatiga BPP" },
  ];

  try {
    const { data, error } = await supabase
      .from("rekening_kampus")
      .select("*")
      .eq("is_active", true);

    if (error || !data || data.length === 0) return defaultRekenings;
    return data;
  } catch (err) {
    return defaultRekenings;
  }
}

export async function updateBillAmount(billId: string, newJumlah: number) {
  const supabase = createClient();

  try {
    // 1. Fetch existing bill
    const { data: bill, error: fetchError } = await supabase
      .from("tagihan")
      .select("jumlah, sisa_tagihan, status, mahasiswa_id")
      .eq("id", billId)
      .single();

    if (fetchError || !bill) throw new Error("Tagihan tidak ditemukan");

    const currentJumlah = Number(bill.jumlah);
    const currentSisa = bill.sisa_tagihan !== null ? Number(bill.sisa_tagihan) : currentJumlah;
    const totalTerbayar = currentJumlah - currentSisa;

    let sisaBaru = newJumlah - totalTerbayar;
    let statusBaru = bill.status;

    if (bill.status === "MENCICIL") {
      sisaBaru = newJumlah - totalTerbayar;
      if (sisaBaru <= 0) {
        sisaBaru = 0;
        statusBaru = "LUNAS";
      }
    } else if (bill.status === "BELUM_LUNAS") {
      sisaBaru = newJumlah;
      statusBaru = "BELUM_LUNAS";
    } else {
      // If LUNAS or other
      sisaBaru = Math.max(0, newJumlah - totalTerbayar);
      if (sisaBaru > 0) statusBaru = "MENCICIL";
      else statusBaru = "LUNAS";
    }

    const { error: updateError } = await supabase
      .from("tagihan")
      .update({
        jumlah: newJumlah,
        sisa_tagihan: sisaBaru,
        status: statusBaru,
        updated_at: new Date().toISOString()
      })
      .eq("id", billId);

    if (updateError) throw updateError;

    revalidatePath("/tagihan");
    revalidatePath("/mahasiswa");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

