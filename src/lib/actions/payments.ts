"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCashPayment(formData: {
  tagihan_id: string;
  jumlah_bayar: number;
  metode: string;
  status: "LUNAS" | "PENDING";
  bank_pengirim?: string;
  bank_tujuan?: string;
  bukti_url?: string;
}) {
  const supabase = createClient();

  try {
    if (formData.status === "LUNAS") {
      // Use the robust RPC to ensure atomic balance update and status change
      const { error: rpcError } = await supabase.rpc("process_manual_payment", {
        p_tagihan_id: formData.tagihan_id,
        p_jumlah_bayar: formData.jumlah_bayar,
        p_metode: formData.metode,
        p_bank_pengirim: formData.bank_pengirim || (formData.metode === "TUNAI" ? "Cash" : "Transfer"),
        p_bank_tujuan: formData.bank_tujuan || "Admin",
        p_bukti_url: formData.bukti_url || "Pencatatan Manual Admin",
        p_order_id: `MANUAL-${Date.now()}`,
        p_nominal_deposit: 0 // Default to 0 for manual cash payment form
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
            bukti_url: formData.bukti_url || "Menunggu Verifikasi"
          },
        ]);

      if (paymentError) throw new Error(paymentError.message);
    }

    revalidatePath("/pembayaran");
    revalidatePath("/tagihan");
    revalidatePath("/mahasiswa");
    revalidatePath("/dashboard");
    revalidatePath("/verifikasi");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}


export async function getStudentBills(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tagihan")
    .select("*")
    .eq("mahasiswa_id", studentId);
    
  if (error) return { error: error.message };
  return { data };
}

export async function searchStudents(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id, nim, nama")
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
    .select("*")
    .eq("id", studentId)
    .single();

  const { data: bills } = await supabase
    .from("tagihan")
    .select("*")
    .eq("mahasiswa_id", studentId)
    .order("created_at", { ascending: false });

  // Get payments for these bills
  const { data: payments } = await supabase
    .from("pembayaran")
    .select(`
      *,
      tagihan:tagihan_id (
        jenis,
        mahasiswa_id
      )
    `)
    .order("created_at", { ascending: false });

  const studentPayments = payments?.filter(p => p.tagihan.mahasiswa_id === studentId) || [];

  return { student, bills: bills || [], payments: studentPayments };
}
