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

export async function verifyPayment(paymentId: string, billId: string, formData?: FormData) {
  const supabase = createClient();
  let proofUrl = null;

  // 1. Handle File Upload if provided during verification
  if (formData) {
    const file = formData.get("file") as File;
    if (file && file.size > 0) {
      const fileName = `${paymentId}-${Date.now()}.${file.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file);

      if (uploadError) return { error: "Gagal mengunggah bukti: " + uploadError.message };

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);
      
      proofUrl = publicUrl;
    }
  }

  // 2. Update payment status to VERIFIED (LUNAS)
  const updatePayload: any = { status: "LUNAS" };
  if (proofUrl) updatePayload.bukti_url = proofUrl;

  const { error: paymentError } = await supabase
    .from("pembayaran")
    .update(updatePayload)
    .eq("id", paymentId);

  if (paymentError) return { error: paymentError.message };

  // 3. Update bill status to LUNAS
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
      status: "GAGAL",
    })
    .eq("id", paymentId);

  if (error) return { error: error.message };

  revalidatePath("/verifikasi");
  
  return { success: true };
}
