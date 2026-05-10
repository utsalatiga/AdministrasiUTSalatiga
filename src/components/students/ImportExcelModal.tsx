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

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
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

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setStatus(null);
    setProgress(0);
    setProcessedCount(0);

    const BATCH_SIZE = 500;

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

          // Initial mapping
          const allMappedData = jsonData.map((row: any) => {
            const getVal = (keys: string[]) => {
              const key = Object.keys(row).find(k => keys.includes(k.toUpperCase()));
              return key ? String(row[key]) : "";
            };

            const getNum = (keys: string[]) => {
              const key = Object.keys(row).find(k => keys.includes(k.toUpperCase()));
              return key ? Number(row[key]) : 0;
            };

            return {
              nim: getVal(["NIM"]),
              nama: getVal(["NAMA", "NAMA MAHASISWA"]),
              prodi: getVal(["PRODI", "PROGRAM STUDI"]),
              angkatan: getVal(["ANGKATAN"]),
              jenis_tagihan: getVal(["JENIS TAGIHAN", "JENIS", "KETERANGAN"]),
              nominal: getNum(["NOMINAL", "JUMLAH", "TOTAL"]),
              status: getVal(["STATUS", "KETERANGAN BAYAR"]).toUpperCase().replace(" ", "_"),
              jatuh_tempo: getVal(["JATUH TEMPO", "DUE DATE", "TANGGAL JATUH TEMPO"])
            };

          }).filter(s => s.nim && s.nama);

          const total = allMappedData.length;
          setTotalToProcess(total);

          if (total === 0) {
            throw new Error("Tidak ada data valid ditemukan. Pastikan kolom NIM dan Nama tersedia.");
          }

          // Process in chunks of BATCH_SIZE
          for (let i = 0; i < total; i += BATCH_SIZE) {
            const chunk = allMappedData.slice(i, i + BATCH_SIZE);
            const result = await importBatchStudents(chunk);

            if (!result.success) {
              throw new Error(result.error || "Gagal memproses batch data.");
            }

            const newProcessedCount = Math.min(i + BATCH_SIZE, total);
            setProcessedCount(newProcessedCount);
            setProgress(Math.round((newProcessedCount / total) * 100));
          }

          setStatus({ 
            type: "success", 
            message: `Berhasil mengimpor ${total} data mahasiswa & finansial.` 
          });
          onSuccess();
          setTimeout(() => {
            onClose();
            setFile(null);
            setStatus(null);
            setProgress(0);
          }, 3000);
        } catch (err: any) {
          setStatus({ type: "error", message: err.message || "Gagal memproses file Excel" });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setStatus({ type: "error", message: "Gagal membaca file" });
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
          {!status?.type && !isImporting && (
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

          {status && (
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

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 h-12 sm:h-auto px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 order-2 sm:order-1"
            >
              Tutup
            </button>
            {!status?.type && !isImporting && (
              <button 
                onClick={handleImport}
                disabled={!file}
                className="flex-2 h-12 sm:h-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/10 order-1 sm:order-2"
              >
                Mulai Proses Bulk
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
