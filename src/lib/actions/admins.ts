"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const adminSchema = z.object({
  email: z.string().email("Email tidak valid"),
  nama: z.string().min(1, "Nama wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export async function getAdmins() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      creator:created_by (
        nama
      )
    `)
    .order("created_at", { ascending: false });
  
  if (error) return { error: error.message };
  return { data };
}

export async function getCurrentUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (profile) return profile;

  // Fallback if profile doesn't exist yet (e.g. legacy admin)
  return {
    email: user.email,
    nama: user.email?.split("@")[0] || "Admin",
    role: "admin"
  };
}

export async function createNewAdmin(formData: z.infer<typeof adminSchema>) {
  const supabase = createClient();
  
  // 1. Verify current user is super_admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (profile?.role !== 'super_admin') {
    throw new Error("Akses ditolak: Hanya Super Admin yang dapat menambah admin baru.");
  }

  // 2. Validate input
  const validated = adminSchema.parse(formData);

  try {
    // 3. Create user in auth.users using supabaseAdmin
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 4. Insert into profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email: validated.email,
        nama: validated.nama,
        role: 'admin',
        created_by: currentUser.id
      });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileError;
    }

    revalidatePath("/admins");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
