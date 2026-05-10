"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  FileUp, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
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
    setProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setProgress(50);

          if (jsonData.length === 0) {
            throw new Error("File Excel kosong atau tidak valid");
          }

          // Mapping columns including financial data
          const mappedData = jsonData.map((row: any) => {
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
              status: getVal(["STATUS", "KETERANGAN BAYAR"]).toUpperCase().replace(" ", "_")
            };
          }).filter(s => s.nim && s.nama);

          setProgress(70);

          if (mappedData.length === 0) {
            throw new Error("Tidak ada data valid ditemukan. Pastikan kolom NIM dan Nama tersedia.");
          }

          // Use Server Action for batch import with financial sync
          const result = await importBatchStudents(mappedData);

          if (result.success) {
            setProgress(100);
            setStatus({ type: "success", message: result.message });
            onSuccess();
            setTimeout(() => {
              onClose();
              setFile(null);
              setStatus(null);
              setProgress(0);
            }, 2000);
          } else {
            throw new Error(result.message);
          }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileUp className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl text-slate-800">Import Data & Keuangan</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Format Kolom Excel
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Pastikan file memiliki kolom: <span className="font-bold">NIM, NAMA, PRODI, ANGKATAN, JENIS TAGIHAN, NOMINAL, STATUS</span> (LUNAS/BELUM_LUNAS).
            </p>
          </div>

          {!status?.type && !isImporting && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all group",
                file && "border-primary bg-primary/5"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-8 w-8 text-slate-400 group-hover:text-primary" />
              </div>
              <p className="text-slate-600 font-medium mb-1">
                {file ? file.name : "Klik atau seret file Excel ke sini"}
              </p>
              <p className="text-slate-400 text-sm">Format .xlsx atau .xls</p>
            </div>
          )}

          {isImporting && (
            <div className="py-10 flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-slate-600 font-medium mb-2">Sinkronisasi Data Finansial...</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status && (
            <div className={cn(
              "py-10 flex flex-col items-center text-center",
              status.type === "success" ? "text-status-emerald" : "text-status-rose"
            )}>
              {status.type === "success" ? (
                <CheckCircle2 className="h-16 w-16 mb-4" />
              ) : (
                <AlertCircle className="h-16 w-16 mb-4" />
              )}
              <h4 className="font-bold text-lg mb-2">
                {status.type === "success" ? "Proses Selesai" : "Gagal Mengimpor"}
              </h4>
              <p className="text-slate-500 text-sm">{status.message}</p>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 px-4 py-3 bg-sidebar text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/10"
            >
              Mulai Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
