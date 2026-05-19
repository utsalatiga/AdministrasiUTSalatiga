-- ====================================================================
-- MIGRATION: 20260519_add_new_student_fields.sql
-- DESCRIPTION: Tambah kolom biodata baru di tabel mahasiswa dan billing di tabel tagihan
-- ====================================================================

-- 1. Tambah kolom di tabel mahasiswa
ALTER TABLE public.mahasiswa ADD COLUMN IF NOT EXISTS nik VARCHAR(16);
ALTER TABLE public.mahasiswa ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE public.mahasiswa ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(255);
ALTER TABLE public.mahasiswa ADD COLUMN IF NOT EXISTS lokasi_ujian VARCHAR(255);

-- 2. Tambah kolom di tabel tagihan
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS tipe_billing VARCHAR(50) DEFAULT 'utama';
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS nomor_billing VARCHAR(100);
