-- Migrasi untuk menambahkan kolom semester pada tabel tagihan jika dibutuhkan di masa mendatang
-- Jalankan di SQL Editor Supabase Anda

ALTER TABLE tagihan ADD COLUMN IF NOT EXISTS semester TEXT;
