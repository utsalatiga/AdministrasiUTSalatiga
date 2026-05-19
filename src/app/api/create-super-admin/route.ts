import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const targetUsers = [
    { email: "arientadwi@gmail.com", password: "123456789", nama: "Arienta Dwi" },
    { email: "tdelano007@gmail.com", password: "123456789", nama: "T Delano" },
  ];

  const results: any[] = [];

  try {
    // 1. Dapatkan daftar user terdaftar di auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ success: false, message: "Gagal membaca daftar user", error: listError.message }, { status: 500 });
    }

    for (const target of targetUsers) {
      const existingUser = users.find((u: any) => u.email?.toLowerCase() === target.email.toLowerCase());
      
      if (existingUser) {
        // Hapus user lama untuk memastikan clean install
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          results.push({ email: target.email, action: "delete_failed", error: deleteError.message });
          continue;
        }
        results.push({ email: target.email, action: "deleted_existing" });
      }

      // Bersihkan data profil terkait email tersebut di database
      await supabaseAdmin.from("profiles").delete().eq("email", target.email);

      // 2. Buat user baru dengan password yang bersih melalui Admin SDK
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: target.email,
        password: target.password,
        email_confirm: true, // Akun langsung terverifikasi secara legal
        user_metadata: { nama: target.nama }
      });

      if (createError) {
        results.push({ email: target.email, action: "create_failed", error: createError.message });
        continue;
      }

      if (newUser) {
        // 3. Upsert data profile ke tabel profiles dengan role super_admin
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: newUser.id,
            email: target.email,
            nama: target.nama,
            role: "super_admin"
          });

        if (profileError) {
          results.push({ email: target.email, action: "profile_upsert_failed", error: profileError.message });
        } else {
          results.push({ email: target.email, action: "created_successfully", userId: newUser.id });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
