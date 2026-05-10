"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function importBatchStudents(data: any[]) {
  const supabase = createClient();
  let successCount = 0;
  let errorCount = 0;

  for (const row of data) {
    try {
      // 1. Upsert Mahasiswa
      const { data: student, error: studentError } = await supabase
        .from("mahasiswa")
        .upsert({
          nim: row.nim,
          nama: row.nama,
          prodi: row.prodi,
          angkatan: row.angkatan
        }, { onConflict: "nim" })
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Create Tagihan
      const { data: bill, error: billError } = await supabase
        .from("tagihan")
        .insert({
          mahasiswa_id: student.id,
          jenis: row.jenis_tagihan || "SPP",
          jumlah: Number(row.nominal) || 0,
          status: row.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS",
          kode: `INV-${Date.now().toString().slice(-4)}-${row.nim.slice(-3)}`
        })
        .select()
        .single();

      if (billError) throw billError;

      // 3. Handle Auto-Lunas
      if (row.status === "LUNAS") {
        const { error: paymentError } = await supabase
          .from("pembayaran")
          .insert({
            tagihan_id: bill.id,
            jumlah_bayar: Number(row.nominal) || 0,
            metode: "TUNAI",
            status: "LUNAS"
          });

        if (paymentError) throw paymentError;
      }

      successCount++;
    } catch (err) {
      console.error(`Error importing row for NIM ${row.nim}:`, err);
      errorCount++;
    }
  }

  revalidatePath("/mahasiswa");
  revalidatePath("/tagihan");
  revalidatePath("/");
  
  return { 
    success: true, 
    message: `Selesai: ${successCount} berhasil, ${errorCount} gagal.` 
  };
}
