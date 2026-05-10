import * as XLSX from "xlsx";

export function exportToExcel(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item, index) => ({
      "No": index + 1,
      "NIM": item.tagihan?.mahasiswa?.nim || "-",
      "Nama": item.tagihan?.mahasiswa?.nama || "-",
      "Tanggal": new Date(item.created_at).toLocaleDateString("id-ID"),
      "Nominal": item.jumlah_bayar,
      "Metode": item.metode,
      "Status": item.status,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Pembayaran");

  // Generate buffer and trigger download
  XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
}
