"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetTransactions() {
  const supabase = createClient();

  try {
    // Aggressive Delete for Payments
    await supabase
      .from("pembayaran")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Reset Bill Statuses
    await supabase
      .from("tagihan")
      .update({ status: "BELUM_LUNAS" })
      .neq("id", 0);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetAllData() {
  const supabase = createClient();

  try {
    // 1. Delete all payments first (Foreign Key constraint)
    await supabase
      .from("pembayaran")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    
    // 2. Delete all bills
    await supabase
      .from("tagihan")
      .delete()
      .neq("id", 0);
    
    // 3. Delete all students
    await supabase
      .from("mahasiswa")
      .delete()
      .neq("nim", "0");

    // Aggressive Revalidation
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
