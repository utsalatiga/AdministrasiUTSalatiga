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
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard UUID placeholder for "all"

    if (paymentError) throw paymentError;

    // 2. Reset all bill statuses to BELUM_LUNAS
    const { error: billError } = await supabase
      .from("tagihan")
      .update({ status: "BELUM_LUNAS" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (billError) throw billError;

    // Invalidate all paths in the layout to ensure cache is cleared
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetAllData() {
  const supabase = createClient();

  try {
    // Referential Integrity Order: pembayaran -> tagihan -> mahasiswa
    
    // 1. Hard Delete payments
    const { error: pError } = await supabase
      .from("pembayaran")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (pError) throw pError;
    
    // 2. Hard Delete bills
    const { error: bError } = await supabase
      .from("tagihan")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (bError) throw bError;
    
    // 3. Hard Delete students
    const { error: mError } = await supabase
      .from("mahasiswa")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (mError) throw mError;

    // Invalidate all paths in the layout to ensure total cache invalidation
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
