"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPendingPayments() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("pembayaran")
    .select(`
      id,
      created_at,
      jumlah_bayar,
      bukti_url,
      status,
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

  // Normalize data (ensure relations are objects, not arrays)
  const normalizedData = (data as any[])?.map(item => ({
    ...item,
    tagihan: Array.isArray(item.tagihan) ? item.tagihan[0] : item.tagihan,
    mahasiswa: item.tagihan ? (Array.isArray(item.tagihan.mahasiswa) ? item.tagihan.mahasiswa[0] : item.tagihan.mahasiswa) : null
  })).map(item => {
    if (item.tagihan && item.mahasiswa) {
      item.tagihan.mahasiswa = item.mahasiswa;
    }
    return item;
  });

  return { data: normalizedData };
}

export async function verifyPayment(paymentId: string, billId: string, formData?: FormData) {
  const supabase = createClient();
  let proofUrl = null;

  try {
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

    // 2. If we have a new proofUrl, update it first
    if (proofUrl) {
      await supabase
        .from("pembayaran")
        .update({ bukti_url: proofUrl })
        .eq("id", paymentId);
    }

    // 3. Call the robust RPC to verify and update bill balance atomically
    const { error: rpcError } = await supabase.rpc("verify_pembayaran", {
      p_pembayaran_id: paymentId,
      p_tagihan_id: billId
    });

    if (rpcError) throw new Error(rpcError.message);

    revalidatePath("/verifikasi");
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    revalidatePath("/tagihan");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
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
