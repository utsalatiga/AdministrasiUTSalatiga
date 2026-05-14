-- Update RPC process_manual_payment untuk menangani nominal deposit kustom
-- Jalankan ini di SQL Editor Supabase

CREATE OR REPLACE FUNCTION process_manual_payment(
  p_tagihan_id UUID,
  p_jumlah_bayar BIGINT,
  p_metode TEXT,
  p_bank_pengirim TEXT,
  p_bank_tujuan TEXT,
  p_bukti_url TEXT,
  p_order_id TEXT,
  p_nominal_deposit BIGINT DEFAULT 0  -- Mengganti BOOLEAN dengan BIGINT nominal kustom
) RETURNS VOID AS $$
DECLARE
  v_mahasiswa_id UUID;
  v_sisa_tagihan BIGINT;
  v_jumlah_tagihan BIGINT;
  v_deposit_saat_ini BIGINT;
  v_bayar_dari_deposit BIGINT;
  v_total_pembayaran BIGINT;
  v_kelebihan BIGINT := 0;
BEGIN
  -- Ambil data tagihan dan mahasiswa
  SELECT mahasiswa_id, COALESCE(sisa_tagihan, jumlah), jumlah 
  INTO v_mahasiswa_id, v_sisa_tagihan, v_jumlah_tagihan
  FROM tagihan 
  WHERE id = p_tagihan_id;

  SELECT deposit INTO v_deposit_saat_ini 
  FROM mahasiswa 
  WHERE id = v_mahasiswa_id;

  -- Gunakan nominal deposit yang dikirim (validasi agar tidak melebihi saldo atau sisa tagihan)
  v_bayar_dari_deposit := LEAST(v_deposit_saat_ini, p_nominal_deposit, v_sisa_tagihan);
  
  -- Total pembayaran adalah uang cash + deposit yang digunakan
  v_total_pembayaran := p_jumlah_bayar + v_bayar_dari_deposit;

  -- 1. Kurangi deposit mahasiswa jika digunakan
  IF v_bayar_dari_deposit > 0 THEN
    UPDATE mahasiswa 
    SET deposit = deposit - v_bayar_dari_deposit 
    WHERE id = v_mahasiswa_id;
  END IF;

  -- 2. Cek kelebihan bayar (uang cash berlebih)
  IF v_total_pembayaran > v_sisa_tagihan THEN
    v_kelebihan := v_total_pembayaran - v_sisa_tagihan;
    
    -- Update sisa tagihan menjadi 0 (LUNAS)
    UPDATE tagihan 
    SET sisa_tagihan = 0, 
        status = 'LUNAS',
        updated_at = NOW()
    WHERE id = p_tagihan_id;

    -- Tambahkan kelebihan ke deposit mahasiswa
    UPDATE mahasiswa 
    SET deposit = deposit + v_kelebihan 
    WHERE id = v_mahasiswa_id;
  ELSE
    -- Pembayaran biasa atau cicilan
    UPDATE tagihan 
    SET sisa_tagihan = v_sisa_tagihan - v_total_pembayaran,
        status = CASE 
          WHEN v_sisa_tagihan - v_total_pembayaran <= 0 THEN 'LUNAS' 
          ELSE 'MENCICIL' 
        END,
        updated_at = NOW()
    WHERE id = p_tagihan_id;
  END IF;

  -- 3. Catat transaksi pembayaran
  INSERT INTO pembayaran (
    tagihan_id,
    jumlah_bayar,
    metode,
    bank_pengirim,
    bank_tujuan,
    bukti_url,
    order_id,
    status,
    created_at
  ) VALUES (
    p_tagihan_id,
    v_total_pembayaran,
    p_metode,
    p_bank_pengirim,
    p_bank_tujuan,
    CASE 
      WHEN v_bayar_dari_deposit > 0 THEN 
        p_bukti_url || ' (Deposit: ' || v_bayar_dari_deposit || ' + Cash: ' || p_jumlah_bayar || ')'
      ELSE p_bukti_url 
    END,
    p_order_id,
    'VERIFIED',
    NOW()
  );

END;
$$ LANGUAGE plpgsql;
