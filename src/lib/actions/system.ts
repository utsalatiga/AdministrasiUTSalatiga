"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetTransactions() {
  const supabase = createClient();

  try {
    // 1. Delete all payments
    const { error: paymentError } = await supabase
      .from("pembayaran")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (paymentError) throw paymentError;

    // 2. Reset all bill statuses to BELUM_LUNAS
    const { error: billError } = await supabase
      .from("tagihan")
      .update({ status: "BELUM_LUNAS" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

    if (billError) throw billError;

    revalidatePath("/");
    revalidatePath("/pembayaran");
    revalidatePath("/tagihan");
    revalidatePath("/laporan");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetAllData() {
  const supabase = createClient();

  try {
    // Due to FK constraints, we must delete in order: pembayaran -> tagihan -> mahasiswa
    
    // 1. Delete payments
    await supabase.from("pembayaran").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    // 2. Delete bills
    await supabase.from("tagihan").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    // 3. Delete students
    const { error } = await supabase
      .from("mahasiswa")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/mahasiswa");
    revalidatePath("/tagihan");
    revalidatePath("/pembayaran");
    revalidatePath("/laporan");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
