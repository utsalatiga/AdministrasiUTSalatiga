"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  QrCode, 
  Banknote, 
  Upload, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface PaymentModalProps {
  bill: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ bill, onClose, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"QRIS" | "MANUAL">("QRIS");
  const [jumlahBayar, setJumlahBayar] = useState<number>(bill.sisa_tagihan || bill.jumlah);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manual Transfer State
  const [bankPengirim, setBankPengirim] = useState("");
  const [bankTujuan, setBankTujuan] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClient();

  const handleQrisPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagihan_id: bill.id,
          jumlah_bayar: jumlahBayar,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Gagal membuat transaksi");

      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: function(result: any) {
          console.log("Success:", result);
          onSuccess();
          onClose();
        },
        onPending: function(result: any) {
          console.log("Pending:", result);
          onClose();
        },
        onError: function(result: any) {
          console.log("Error:", result);
          setError("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: function() {
          console.log("Customer closed the popup without finishing the payment");
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buktiFile || !bankPengirim || !bankTujuan) {
      setError("Harap isi semua kolom dan unggah bukti transfer.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Upload Bukti Transfer to Supabase Storage
      const fileExt = buktiFile.name.split('.').pop();
      const fileName = `${bill.mahasiswa.nim}-${Date.now()}.${fileExt}`;
      const filePath = `bukti-transfer/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("payments")
        .upload(filePath, buktiFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payments")
        .getPublicUrl(filePath);

      // 2. Call RPC to process payment
      const { error: rpcError } = await supabase.rpc("process_manual_payment", {
        p_tagihan_id: bill.id,
        p_jumlah_bayar: jumlahBayar,
        p_metode: "TRANSFER_MANUAL",
        p_bank_pengirim: bankPengirim,
        p_bank_tujuan: bankTujuan,
        p_bukti_url: publicUrl,
        p_order_id: `MANUAL-${bill.kode}-${Date.now()}`
      });

      if (rpcError) throw rpcError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const rekenings = [
    { id: "1", name: "Bank Mandiri - UT Salatiga", account: "123-00-0123456-7" },
    { id: "2", name: "Bank BRI - UT Salatiga", account: "0123-01-000456-50-1" },
    { id: "3", name: "Bank BNI - UT Salatiga", account: "0987654321" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-8 pb-4 border-b border-slate-50">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-serif text-slate-900">Pilih Metode Pembayaran</h2>
            <p className="text-slate-500 text-sm">
              Tagihan: <span className="font-bold text-slate-700">{bill.jenis}</span> • {bill.mahasiswa.nama}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tagihan</p>
              <p className="text-xl font-serif font-bold text-slate-900">{formatRupiah(bill.sisa_tagihan || bill.jumlah)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jumlah Bayar</p>
              <input 
                type="number"
                value={jumlahBayar}
                max={bill.sisa_tagihan || bill.jumlah}
                onChange={(e) => setJumlahBayar(Math.min(parseInt(e.target.value) || 0, bill.sisa_tagihan || bill.jumlah))}
                className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-right"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab("QRIS")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                activeTab === "QRIS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <QrCode className="h-4 w-4" />
              QRIS / Auto
            </button>
            <button 
              onClick={() => setActiveTab("MANUAL")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                activeTab === "MANUAL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Banknote className="h-4 w-4" />
              Transfer Manual
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "QRIS" ? (
            <div className="space-y-6">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    Pembayaran otomatis diverifikasi dalam hitungan detik.
                  </li>
                  <li className="flex items-start gap-3 text-xs text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    Mendukung GoPay, OVO, Dana, LinkAja, dan semua Bank (QRIS).
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleQrisPayment}
                disabled={isLoading || jumlahBayar <= 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                Bayar Sekarang
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bank Pengirim</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: BCA, Mandiri"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    value={bankPengirim}
                    onChange={(e) => setBankPengirim(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Rekening Tujuan</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    value={bankTujuan}
                    onChange={(e) => setBankTujuan(e.target.value)}
                  >
                    <option value="">Pilih Rekening</option>
                    {rekenings.map(rek => (
                      <option key={rek.id} value={rek.name}>{rek.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bukti Transfer</label>
                <div className="relative group">
                  <input 
                    type="file"
                    accept="image/*"
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                  />
                  <div className={cn(
                    "w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                    buktiFile ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/30"
                  )}>
                    {buktiFile ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <p className="text-xs font-bold text-emerald-600">{buktiFile.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <p className="text-xs font-medium text-slate-500">Klik atau drop gambar bukti transfer</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || jumlahBayar <= 0}
                className="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Verifikasi & Lunasi
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
