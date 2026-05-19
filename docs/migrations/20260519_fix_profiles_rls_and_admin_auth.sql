-- ====================================================================
-- MIGRATION: 20260519_fix_profiles_rls_and_admin_auth.sql
-- DESCRIPTION: Perbaikan RLS, Grants, Trigger, dan Akun Super Admin
-- ====================================================================

-- 1. MEMBERIKAN HAK AKSES DASAR SCHEMA DAN TABEL
-- Memastikan schema public dapat diakses oleh role auth
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Memberikan hak akses penuh pada tabel profiles ke role authenticated, service_role, dan postgres
GRANT ALL PRIVILEGES ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO postgres;

-- Memberikan hak akses select untuk anon demi keamanan komunikasi API saat inisiasi handshake
GRANT SELECT ON TABLE public.profiles TO anon;

-- 2. KONFIGURASI ROW LEVEL SECURITY (RLS)
-- Aktifkan RLS pada tabel profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan RLS lama yang berpotensi bentrok
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual select" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin update" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin delete" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for service_role" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.profiles;

-- Buat kebijakan RLS baru yang bersih dan terstruktur
-- SELECT: Mengizinkan semua user terautentikasi membaca data profil (untuk cek role & list admin)
CREATE POLICY "Allow select for authenticated" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- INSERT: Mengizinkan user terautentikasi membuat profil baru (misal saat Super Admin mendaftarkan admin baru)
CREATE POLICY "Allow insert for authenticated" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE: Mengizinkan user terautentikasi memperbarui profil (misal edit nama, role)
CREATE POLICY "Allow update for authenticated" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- DELETE: Mengizinkan user terautentikasi menghapus profil (misal hapus admin)
CREATE POLICY "Allow delete for authenticated" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (true);

-- 3. PERBAIKAN DAN PENYELARASAN TRIGGER AUTOMATIS
-- Mengubah fungsi trigger handle_new_user agar aman dari konflik insert ganda (ON CONFLICT DO NOTHING / UPDATE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin' -- Default role adalah admin
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nama = COALESCE(public.profiles.nama, EXCLUDED.nama);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. PEMBERSIHAN DAN SINKRONISASI AKUN ADMIN BARU
-- Bersihkan data kotor di profiles jika ada email yang terasosiasi dengan ID yang tidak valid (bukan dari auth.users)
DELETE FROM public.profiles 
WHERE email IN ('arientadwi@gmail.com', 'tdelano007@gmail.com')
  AND id NOT IN (SELECT id FROM auth.users WHERE email IN ('arientadwi@gmail.com', 'tdelano007@gmail.com'));

-- Sinkronisasi/Masukkan user baru dari auth.users ke public.profiles dengan role 'super_admin'
INSERT INTO public.profiles (id, email, nama, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'nama', raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as nama, 
  'super_admin' as role
FROM auth.users
WHERE email IN ('arientadwi@gmail.com', 'tdelano007@gmail.com')
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  nama = COALESCE(public.profiles.nama, EXCLUDED.nama),
  role = 'super_admin';
