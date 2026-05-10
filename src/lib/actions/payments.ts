"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCashPayment(formData: {
  tagihan_id: string;
  jumlah_bayar: number;
  metode: string;
}) {
  const supabase = createClient();

  // Perform atomic-like operations using Promise.all or sequential checks
  try {
    // 1. Insert into pembayaran
    const { data: payment, error: paymentError } = await supabase
      .from("pembayaran")
      .insert([
        {
          tagihan_id: formData.tagihan_id,
          jumlah_bayar: formData.jumlah_bayar,
          metode: formData.metode,
          status: "LUNAS", 
        },
      ])
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // 2. Update tagihan status to LUNAS
    const { error: billError } = await supabase
      .from("tagihan")
      .update({ status: "LUNAS" })
      .eq("id", formData.tagihan_id);

    if (billError) throw new Error(billError.message);

    revalidatePath("/pembayaran");
    revalidatePath("/tagihan");
    revalidatePath("/mahasiswa");
    revalidatePath("/dashboard");
    
    return { success: true, data: payment };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getStudentBills(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tagihan")
    .select("*")
    .eq("mahasiswa_id", studentId)
    .eq("status", "BELUM LUNAS");
    
  if (error) return { error: error.message };
  return { data };
}

export async function searchStudents(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mahasiswa")
    .select("id, nim, nama")
    .or(`nama.ilike.%${query}%,nim.ilike.%${query}%`)
    .limit(5);

  if (error) return { error: error.message };
  return { data };
}

export async function getStudentFinancialSummary(studentId: string) {
  const supabase = createClient();
  
  const { data: bills, error: billsError } = await supabase
    .from("tagihan")
    .select("jumlah, status")
    .eq("mahasiswa_id", studentId);

  if (billsError) return { error: billsError.message };

  const totalTagihan = bills.reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const totalPaid = bills.filter(b => b.status === "LUNAS").reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const totalArrears = totalTagihan - totalPaid;
  
  const isLunas = bills.length > 0 && bills.every(b => b.status === "LUNAS");
  const hasUnpaid = bills.some(b => b.status === "BELUM LUNAS");

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
