"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCashPayment(formData: {
  tagihan_id: string;
  jumlah_bayar: number;
  metode: string;
}) {
  const supabase = createClient();

  // 1. Insert into pembayaran
  const { data: payment, error: paymentError } = await supabase
    .from("pembayaran")
    .insert([
      {
        tagihan_id: formData.tagihan_id,
        jumlah_bayar: formData.jumlah_bayar,
        metode: formData.metode,
        status: "LUNAS", // Using LUNAS as per schema but logically 'VERIFIED'
      },
    ])
    .select()
    .single();

  if (paymentError) {
    return { error: paymentError.message };
  }

  // 2. Update tagihan status to LUNAS
  const { error: billError } = await supabase
    .from("tagihan")
    .update({ status: "LUNAS" })
    .eq("id", formData.tagihan_id);

  if (billError) {
    return { error: billError.message };
  }

  revalidatePath("/pembayaran");
  revalidatePath("/dashboard");
  
  return { success: true, data: payment };
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
