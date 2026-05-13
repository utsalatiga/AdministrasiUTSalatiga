-- RPC untuk memverifikasi pembayaran dan mengupdate sisa tagihan secara atomik
CREATE OR REPLACE FUNCTION verify_pembayaran(
  p_pembayaran_id UUID,
  p_tagihan_id UUID
) RETURNS VOID AS $$
DECLARE
  v_jumlah_bayar BIGINT;
  v_sisa_tagihan BIGINT;
  v_mahasiswa_id UUID;
BEGIN
  -- 1. Ambil jumlah bayar dari record pembayaran
  SELECT jumlah_bayar INTO v_jumlah_bayar 
  FROM pembayaran 
  WHERE id = p_pembayaran_id;

  -- 2. Ambil data tagihan
  SELECT COALESCE(sisa_tagihan, jumlah), mahasiswa_id INTO v_sisa_tagihan, v_mahasiswa_id
  FROM tagihan 
  WHERE id = p_tagihan_id;

  -- 3. Update status pembayaran menjadi LUNAS (Verified)
  UPDATE pembayaran 
  SET status = 'LUNAS',
      updated_at = NOW()
  WHERE id = p_pembayaran_id;

  -- 4. Update sisa tagihan dan status tagihan
  -- Logikanya sama dengan process_manual_payment
  IF v_jumlah_bayar > v_sisa_tagihan THEN
    -- Kelebihan bayar masuk ke deposit
    UPDATE tagihan 
    SET sisa_tagihan = 0, 
        status = 'LUNAS',
        updated_at = NOW()
    WHERE id = p_tagihan_id;

    UPDATE mahasiswa 
    SET deposit = deposit + (v_jumlah_bayar - v_sisa_tagihan)
    WHERE id = v_mahasiswa_id;
  ELSE
    UPDATE tagihan 
    SET sisa_tagihan = v_sisa_tagihan - v_jumlah_bayar,
        status = CASE 
          WHEN v_sisa_tagihan - v_jumlah_bayar <= 0 THEN 'LUNAS' 
          ELSE 'MENCICIL' 
        END,
        updated_at = NOW()
    WHERE id = p_tagihan_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
