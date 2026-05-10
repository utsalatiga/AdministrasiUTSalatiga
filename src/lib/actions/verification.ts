"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPendingPayments() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("pembayaran")
    .select(`
      *,
      tagihan:tagihan_id (
        id,
        jenis,
        mahasiswa:mahasiswa_id (
          nama,
          nim
        )
      )
    `)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function verifyPayment(paymentId: string, billId: string) {
  const supabase = createClient();

  // 1. Update payment status to VERIFIED (using LUNAS as per schema mapping)
  const { error: paymentError } = await supabase
    .from("pembayaran")
    .update({ status: "LUNAS" })
    .eq("id", paymentId);

  if (paymentError) return { error: paymentError.message };

  // 2. Update bill status to LUNAS
  const { error: billError } = await supabase
    .from("tagihan")
    .update({ status: "LUNAS" })
    .eq("id", billId);

  if (billError) return { error: billError.message };

  revalidatePath("/verifikasi");
  revalidatePath("/dashboard");
  revalidatePath("/pembayaran");
  
  return { success: true };
}

export async function rejectPayment(paymentId: string, reason?: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("pembayaran")
    .update({ 
      status: "GAGAL", // Using GAGAL as per schema mapping for REJECTED
      // If we had a 'reason' column, we'd update it here
    })
    .eq("id", paymentId);

  if (error) return { error: error.message };

  revalidatePath("/verifikasi");
  
  return { success: true };
}
