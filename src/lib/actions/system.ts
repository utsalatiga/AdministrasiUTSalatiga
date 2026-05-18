"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/roles";

/**
 * NUCLEAR RESET: Aggressively purges all data and resets identities.
 * IMPORTANT: This requires a 'nuclear_reset' RPC function to be created in Supabase:
 * 
 * CREATE OR REPLACE FUNCTION nuclear_reset()
 * RETURNS void AS $$
 * BEGIN
 *   TRUNCATE TABLE pembayaran, tagihan, mahasiswa RESTART IDENTITY CASCADE;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
export async function nuclearReset() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!isSuperAdmin(profile?.role)) throw new Error("Akses Ditolak: Hanya Super Admin yang dapat melakukan Reset Total.");

    // 1. Attempt to call the SQL TRUNCATE function
    const { error: rpcError } = await supabase.rpc("nuclear_reset");

    // 2. Fallback to aggressive DELETE if RPC is not available
    if (rpcError) {
      console.warn("RPC nuclear_reset not found, falling back to aggressive DELETE.");
      await supabase.from("pembayaran").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("tagihan").delete().neq("id", 0);
      await supabase.from("mahasiswa").delete().neq("nim", "0");
    }

    // 3. Destroy Server-side Cache
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetTransactions() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!isSuperAdmin(profile?.role)) throw new Error("Akses Ditolak: Hanya Super Admin yang dapat melakukan Reset Transaksi.");

    await supabase.from("pembayaran").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tagihan").update({ status: "BELUM_LUNAS" }).neq("id", 0);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAppSetting(key: string, defaultValue: string = "") {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return defaultValue;
    return data.value;
  } catch (err) {
    return defaultValue;
  }
}

export async function updateAppSetting(key: string, value: string) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!isSuperAdmin(profile?.role)) throw new Error("Akses Ditolak: Hanya Super Admin yang dapat mengubah pengaturan sistem.");

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

