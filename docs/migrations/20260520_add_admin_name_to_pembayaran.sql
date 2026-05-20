-- ====================================================================
-- MIGRATION: 20260520_add_admin_name_to_pembayaran.sql
-- DESCRIPTION: Tambah kolom admin_name di tabel pembayaran untuk melacak kasir pemroses
-- ====================================================================

ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255);

-- Force PostgREST reload cache schema
NOTIFY pgrst, 'reload schema';
