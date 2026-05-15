"use client";

import { useState } from "react";
import { 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw,
  Zap
} from "lucide-react";
import { nuclearReset, resetTransactions } from "@/lib/actions/system";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"transactions" | "nuclear" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleOpenConfirm = (type: "transactions" | "nuclear") => {
    setConfirmType(type);
    setIsConfirmOpen(true);
    setConfirmText("");
  };

  const handleReset = async () => {
    if (confirmText !== "RESET") return;

    setIsProcessing(true);
    let res;
    if (confirmType === "transactions") {
      res = await resetTransactions();
    } else {
      res = await nuclearReset();
    }

    if (res.success) {
      setResult({ type: "success", message: "Reset Berhasil. Membersihkan cache browser..." });
      setTimeout(() => {
        setIsConfirmOpen(false);
        setResult(null);
        // NUCLEAR REFRESH: Replace location and force fresh download
        window.location.replace('/?purged=true');
      }, 1500);
    } else {
      setResult({ type: "error", message: res.error || "Terjadi kesalahan saat reset data." });
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm">Kontrol infrastruktur data tingkat tinggi dan pembersihan total.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Reset Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-slate-800">Zona Bahaya (Danger Zone)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Hanya untuk Super Admin</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl gap-4 hover:border-slate-200 transition-all">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  Reset Riwayat Pembayaran
                </h4>
                <p className="text-sm text-slate-500">Hapus semua transaksi tapi biarkan data mahasiswa tetap ada.</p>
              </div>
              <button 
                onClick={() => handleOpenConfirm("transactions")}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs"
              >
                Reset Transaksi
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-rose-50/20 border border-rose-100 rounded-3xl gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-rose-900 flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-rose-600" />
                  NUCLEAR RESET (Pembersihan Total)
                </h4>
                <p className="text-sm text-rose-700/70 max-w-md">
                  Mengosongkan seluruh database (TRUNCATE CASCADE) dan mereset hitungan ID. Data tidak dapat dikembalikan.
                </p>
              </div>
              <button 
                onClick={() => handleOpenConfirm("nuclear")}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all text-sm shadow-xl shadow-rose-900/20 whitespace-nowrap"
              >
                EKSEKUSI NUCLEAR RESET
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-10 space-y-8 text-center">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <AlertTriangle className="h-12 w-12" />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-serif text-3xl text-slate-900">Konfirmasi Akhir</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Tindakan ini akan menghapus permanen data menggunakan sistem <span className="font-bold text-rose-600">TRUNCATE CASCADE</span>.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ketik 'RESET' untuk konfirmasi penghapusan</p>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="KETIK RESET..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-bold tracking-[0.3em] text-xl focus:outline-none focus:border-rose-500/30 focus:bg-white transition-all uppercase"
                />
              </div>

              {result && (
                <div className={cn(
                  "p-4 rounded-2xl text-sm font-bold animate-in slide-in-from-bottom-2",
                  result.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {result.message}
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleReset}
                  disabled={confirmText !== "RESET" || isProcessing}
                  className="flex-2 py-4 px-6 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:opacity-30 shadow-lg shadow-rose-900/20"
                >
                  {isProcessing ? "Memproses..." : "Ya, Hancurkan Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
