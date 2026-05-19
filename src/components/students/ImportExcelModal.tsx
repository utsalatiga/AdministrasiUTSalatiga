"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  FileUp, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Zap
} from "lucide-react";
import { importBatchStudents } from "@/lib/actions/students";
import { cn } from "@/lib/utils";
import { PRODI_UT } from "@/lib/constants";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [defaultProdi, setDefaultProdi] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    studentsCreated: number;
    billsMain: number;
    billsAdditional: number;
    paymentsVerified: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile);
        setStatus(null);
      } else {
        setStatus({ type: "error", message: "Hanya file .xlsx atau .xls yang didukung" });
      }
    }
  };

  const handleProcessPreview = async () => {
    if (!file) return;

    setStatus(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error("File Excel kosong atau tidak valid");
          }

          // Grouping Logic (Accumulator Map)
          const groupedDataMap = new Map();
          const timestampStr = Date.now().toString();

          for (let rowIdx = 0; rowIdx < jsonData.length; rowIdx++) {
            const row = jsonData[rowIdx] as any;
            const getVal = (keys: string[]) => {
              const key = Object.keys(row).find(k => keys.includes(k.toUpperCase()));
              return key ? String(row[key]).trim() : "";
            };

            const getNum = (keys: string[]) => {
              const key = Object.keys(row).find(k => keys.includes(k.toUpperCase()));
              return key ? Number(row[key]) : 0;
            };

            const nim = getVal(["NIM"]);
            const nama = getVal(["NAMA", "NAMA MAHASISWA"]);
            
            // Wajib ada NIM dan Nama
            if (!nim || !nama) continue;

            const prodi = getVal(["PRODI", "PROGRAM STUDI"]) || defaultProdi;
            const angkatan = getVal(["ANGKATAN"]);
            const nik = getVal(["NIK", "NO KTP"]);
            const tanggalLahir = getVal(["TANGGAL LAHIR", "TGL LAHIR"]);
            const namaIbu = getVal(["NAMA IBU", "IBU KANDUNG"]);
            const noWa = getVal(["NO WA", "WHATSAPP", "NO HP"]);
            const lokasiUjian = getVal(["LOKASI UJIAN", "TEMPAT UJIAN"]);

            let statusStr = getVal(["STATUS", "KETERANGAN BAYAR"]).toUpperCase().replace(" ", "_");
            if (!["LUNAS", "DICICIL", "BELUM_LUNAS"].includes(statusStr)) {
              statusStr = "BELUM_LUNAS";
            }

            const tagihan = {
              jenis: getVal(["JENIS TAGIHAN", "JENIS", "KETERANGAN"]) || "Uang Semester",
              nominal: getNum(["NOMINAL", "JUMLAH", "TOTAL"]),
              status: statusStr as "LUNAS" | "BELUM_LUNAS" | "DICICIL",
              nomor_billing: getVal(["NOMOR BILLING", "NO BILLING", "BILLING"]) || `AUTO-IMP-${nim}-${timestampStr}-${rowIdx}`,
              jatuh_tempo: getVal(["JATUH TEMPO", "DUE DATE", "TANGGAL JATUH TEMPO"])
            };

            if (groupedDataMap.has(nim)) {
              groupedDataMap.get(nim).billings.push(tagihan);
            } else {
              groupedDataMap.set(nim, {
                nim,
                nama,
                prodi,
                angkatan,
                nik: nik || null,
                tanggal_lahir: tanggalLahir || null,
                nama_ibu: namaIbu || null,
                no_hp: noWa || null,
                lokasi_ujian: lokasiUjian || null,
                billings: [tagihan]
              });
            }
          }

          const allMappedData = Array.from(groupedDataMap.values());

          const total = allMappedData.length;
          setTotalToProcess(total);

          if (total === 0) {
            throw new Error("Tidak ada data valid ditemukan. Pastikan kolom NIM dan Nama tersedia.");
          }

          setPreviewData(allMappedData);
        } catch (err: any) {
          setStatus({ type: "error", message: err.message || "Gagal memproses file Excel" });
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setStatus({ type: "error", message: "Gagal membaca file" });
    }
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    setIsImporting(true);
    setStatus(null);
    setProgress(0);
    setProcessedCount(0);

    const BATCH_SIZE = 500;
    const total = previewData.length;
    let aggMetrics = { totalRows: total, studentsCreated: 0, billsMain: 0, billsAdditional: 0, paymentsVerified: 0 };

    try {
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = previewData.slice(i, i + BATCH_SIZE);
        const result = await importBatchStudents(chunk);

        if (!result.success) {
          throw new Error(result.error || "Gagal memproses batch data.");
        }

        if (result.metrics) {
           aggMetrics.studentsCreated += result.metrics.studentsCreated;
           aggMetrics.billsMain += result.metrics.billsMain;
           aggMetrics.billsAdditional += result.metrics.billsAdditional;
           aggMetrics.paymentsVerified += result.metrics.paymentsVerified;
        }

        const newProcessedCount = Math.min(i + BATCH_SIZE, total);
        setProcessedCount(newProcessedCount);
        setProgress(Math.round((newProcessedCount / total) * 100));
      }

      setStatus({ 
        type: "success", 
        message: `Berhasil mengimpor ${total} data mahasiswa & finansial.` 
      });
      setImportResult(aggMetrics);
      onSuccess();
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Gagal memproses import data" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setPreviewData([]);
    setStatus(null);
    setProgress(0);
    setProcessedCount(0);
    setTotalToProcess(0);
    setIsConfirmed(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-slate-800">Optimized Batch Import</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {!status?.type && !isImporting && !importResult && previewData.length === 0 && (
            <>
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Mode Performa Tinggi
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sistem menggunakan <span className="font-bold">Batch Processing (500 data/batch)</span>. 
                  Sanggup memproses ribuan data mahasiswa, tagihan, dan pembayaran dalam waktu singkat.
                </p>
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1">Program Studi Default (Opsional)</label>
                <select
                  value={defaultProdi}
                  onChange={(e) => setDefaultProdi(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs appearance-none cursor-pointer font-semibold"
                >
                  <option value="">Pilih Prodi Default (Jika di Excel kosong)</option>
                  {PRODI_UT.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 ml-1">Digunakan jika kolom prodi pada baris Excel kosong atau tidak ditemukan.</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50 transition-all group",
                  file && "border-emerald-500 bg-emerald-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 group-hover:text-emerald-50" />
                </div>
                <p className="text-slate-600 font-medium mb-1 text-center text-sm sm:text-base">
                  {file ? file.name : "Klik atau seret file Excel ke sini"}
                </p>
                <p className="text-slate-400 text-xs sm:text-sm">Mendukung ribuan baris data</p>
              </div>
            </>
          )}

          {!status?.type && !isImporting && !importResult && previewData.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-700 text-sm">Pratinjau Data (10 Baris Pertama)</h4>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleResetFile}
                    className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Ganti File
                  </button>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                    Total: {totalToProcess} Mahasiswa
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">NIM & Nama</th>
                      <th className="px-4 py-3 font-semibold">Prodi</th>
                      <th className="px-4 py-3 font-semibold">Biodata</th>
                      <th className="px-4 py-3 font-semibold">No. Billing</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 10).map((mhs, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{mhs.nim}</div>
                          <div className="text-slate-500">{mhs.nama}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{mhs.prodi}</td>
                        <td className="px-4 py-3">
                          {(!mhs.nik || !mhs.nama_ibu) ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-medium border border-slate-200">Kosong</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium border border-blue-100">Lengkap</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {mhs.billings[0]?.nomor_billing?.startsWith("AUTO-IMP") ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-medium border border-amber-200">Otomatis</span>
                          ) : (
                            <span className="text-slate-600 font-mono text-[10px]">{mhs.billings[0]?.nomor_billing}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                           {(() => {
                             const st = mhs.billings[0]?.status;
                             if (st === "LUNAS") return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-200">LUNAS</span>;
                             if (st === "DICICIL") return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold border border-amber-200">DICICIL</span>;
                             return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200">BELUM LUNAS</span>;
                           })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5">Saya telah memeriksa pratinjau data</span>
                  Data yang diunggah sudah benar. Lanjutkan proses import batch sebanyak {totalToProcess} mahasiswa ke database.
                </div>
              </label>
            </div>
          )}

          {isImporting && (
            <div className="py-6 sm:py-10 flex flex-col items-center">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500 animate-spin mb-4" />
              <div className="text-center space-y-1 mb-6">
                <p className="text-slate-600 font-bold">Sedang Memproses Data...</p>
                <p className="text-xs text-slate-400 font-medium">
                  {processedCount} dari {totalToProcess} data selesai
                </p>
              </div>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {status && !importResult && (
            <div className={cn(
              "py-6 sm:py-10 flex flex-col items-center text-center",
              status.type === "success" ? "text-emerald-600" : "text-rose-600"
            )}>
              {status.type === "success" ? (
                <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 mb-4 animate-in zoom-in duration-300" />
              ) : (
                <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 mb-4 animate-shake" />
              )}
              <h4 className="font-bold text-lg sm:text-xl mb-2">
                {status.type === "success" ? "Import Selesai!" : "Gagal Mengimpor"}
              </h4>
              <p className="text-slate-500 text-xs sm:text-sm max-w-[300px]">{status.message}</p>
            </div>
          )}

          {importResult && status?.type === "success" && (
            <div className="py-4 animate-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center mb-6">
                <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-emerald-500 mb-4" />
                <h4 className="font-bold text-xl sm:text-2xl text-slate-800 mb-2">Import Berhasil!</h4>
                <p className="text-slate-500 text-xs sm:text-sm max-w-sm">
                  {importResult.totalRows} baris data Excel telah diproses dan masuk ke database.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-bold text-slate-700 mb-1">{importResult.studentsCreated}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Mahasiswa</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-bold text-blue-700 mb-1">{importResult.paymentsVerified}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-400 uppercase tracking-wider">Lunas Otomatis</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-bold text-emerald-700 mb-1">{importResult.billsMain}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-500 uppercase tracking-wider">Tagihan Utama</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-2xl font-bold text-amber-700 mb-1">{importResult.billsAdditional}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-500 uppercase tracking-wider">Tagihan Tambahan</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    onClose();
                    setFile(null);
                    setStatus(null);
                    setProgress(0);
                    setPreviewData([]);
                    setIsConfirmed(false);
                    setImportResult(null);
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/10"
                >
                  Tutup Laporan & Selesai
                </button>
              </div>
            </div>
          )}

          {!importResult && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={previewData.length > 0 && !status?.type ? handleResetFile : onClose}
                disabled={isImporting}
                className="flex-1 h-12 sm:h-auto px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 order-2 sm:order-1"
              >
                {previewData.length > 0 && !status?.type ? "Batal" : "Tutup"}
              </button>
              {!status?.type && !isImporting && previewData.length === 0 && (
                <button 
                  onClick={handleProcessPreview}
                  disabled={!file}
                  className="flex-2 h-12 sm:h-auto px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 order-1 sm:order-2"
                >
                  Proses Pratinjau Data
                </button>
              )}
              {!status?.type && !isImporting && previewData.length > 0 && (
                <button 
                  onClick={handleImport}
                  disabled={!isConfirmed}
                  className="flex-2 h-12 sm:h-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/10 order-1 sm:order-2"
                >
                  Konfirmasi & Proses Import Data
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
