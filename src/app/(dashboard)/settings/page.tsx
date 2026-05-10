"use client";

import { useState } from "react";
import { 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Database, 
  RotateCcw,
  CheckCircle2,
  X
} from "lucide-react";
import { resetTransactions, resetAllData } from "@/lib/actions/system";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"transactions" | "all" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleOpenConfirm = (type: "transactions" | "all") => {
    setConfirmType(type);
    setIsConfirmOpen(true);
    setConfirmText("");
  };

  const handleReset = async () => {
    if (confirmText !== "KONFIRMASI") return;

    setIsProcessing(true);
    let res;
    if (confirmType === "transactions") {
      res = await resetTransactions();
    } else {
      res = await resetAllData();
    }

    if (res.success) {
      setResult({ type: "success", message: "Deep clean reset berhasil. Mengarahkan ulang..." });
      setTimeout(() => {
        setIsConfirmOpen(false);
        setResult(null);
        window.location.href = '/?reset=true'; // Force hard redirect to clear all state
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
        <p className="text-slate-500 text-sm">Manajemen infrastruktur data dan kontrol keamanan super admin.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Reset Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-slate-800">Zona Bahaya</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Hapus & Reset Data Sistem</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                  Reset Seluruh Transaksi
                </h4>
                <p className="text-sm text-slate-500">Menghapus seluruh riwayat pembayaran dan mengembalikan status semua tagihan menjadi BELUM_LUNAS.</p>
              </div>
              <button 
                onClick={() => handleOpenConfirm("transactions")}
                className="px-6 py-3 bg-white border border-rose-100 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all text-sm whitespace-nowrap"
              >
                Reset Transaksi
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-rose-50/30 rounded-2xl border border-rose-100 gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-rose-800 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  Reset Seluruh Data Mahasiswa
                </h4>
                <p className="text-sm text-rose-700/60">PERINGATAN: Tindakan ini akan menghapus permanen data mahasiswa, tagihan, dan pembayaran.</p>
              </div>
              <button 
                onClick={() => handleOpenConfirm("all")}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all text-sm shadow-lg shadow-rose-900/20 whitespace-nowrap"
              >
                Hapus Semua Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <AlertTriangle className="h-10 w-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-2xl text-slate-900">Konfirmasi Penghapusan</h3>
                <p className="text-sm text-slate-500">
                  {confirmType === "transactions" 
                    ? "Apakah Anda yakin ingin menghapus seluruh riwayat transaksi pembayaran?" 
                    : "Seluruh data mahasiswa, tagihan, dan transaksi akan dihapus secara PERMANEN."}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ketik 'KONFIRMASI' untuk melanjutkan</p>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Ketik di sini..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>

              {result && (
                <div className={cn(
                  "p-4 rounded-xl text-sm font-bold",
                  result.type === "success" ? "bg-emerald-50 text-status-emerald" : "bg-rose-50 text-status-rose"
                )}>
                  {result.message}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Batalkan
                </button>
                <button 
                  onClick={handleReset}
                  disabled={confirmText !== "KONFIRMASI" || isProcessing}
                  className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <RotateCcw className="h-5 w-5 animate-spin" /> : "Ya, Hapus Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
