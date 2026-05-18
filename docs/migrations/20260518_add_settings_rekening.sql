-- ====================================================================
-- MIGRATION: 20260518_add_settings_rekening.sql
-- DESCRIPTION: Membuat tabel app_settings dan rekening_kampus
-- ====================================================================

-- 1. TABEL APP_SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Kwitansi Prefix
INSERT INTO public.app_settings (key, value)
VALUES ('kwitansi_prefix', 'KW')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();


-- 2. TABEL REKENING_KAMPUS
CREATE TABLE IF NOT EXISTS public.rekening_kampus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Rekening Kampus
INSERT INTO public.rekening_kampus (bank_name, account_number, account_name)
VALUES 
    ('Bank Mandiri - UT Salatiga', '123-00-0123456-7', 'UT Salatiga Operasional'),
    ('Bank BRI - UT Salatiga', '0123-01-000456-50-1', 'UT Salatiga Penerimaan'),
    ('Bank BNI - UT Salatiga', '0987654321', 'UT Salatiga BPP')
ON CONFLICT DO NOTHING;
