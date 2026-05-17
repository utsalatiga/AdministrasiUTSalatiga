"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Banknote, 
  Upload, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Coins,
  MessageSquare,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import OfficialReceipt from "./OfficialReceipt";

interface PaymentModalProps {
  bill: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ bill, onClose, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"TRANSFER" | "CASH">("TRANSFER");
  const [jumlahBayar, setJumlahBayar] = useState<number>(Number(bill.sisa_tagihan || bill.jumlah || 0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const router = useRouter();
  
  // Transfer State
  const [bankPengirim, setBankPengirim] = useState("");
  const [bankTujuan, setBankTujuan] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  // Cash State
  const [catatan, setCatatan] = useState("Diterima langsung oleh Admin");
  const [studentDeposit, setStudentDeposit] = useState(bill.mahasiswa?.deposit || 0);
  const [useDeposit, setUseDeposit] = useState((bill.mahasiswa?.deposit || 0) > 0);
  const [nominalDeposit, setNominalDeposit] = useState<number>(0);

  // Update initial nominalDeposit and jumlahBayar
  useEffect(() => {
    const sisa = Number(bill.sisa_tagihan || bill.jumlah || 0);
    if ((bill.mahasiswa?.deposit || 0) > 0) {
      const defaultDeposit = Math.min(bill.mahasiswa.deposit, sisa);
      setNominalDeposit(defaultDeposit);
      setJumlahBayar(sisa - defaultDeposit);
    } else {
      setJumlahBayar(sisa);
    }
  }, [bill]);

  const supabase = createClient();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "TRANSFER" && jumlahBayar > 0 && (!buktiFile || !bankPengirim || !bankTujuan)) {
      setError("Harap isi semua kolom dan unggah bukti transfer.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let publicUrl = "";

      if (activeTab === "TRANSFER" && buktiFile) {
        // 1. Upload Bukti Transfer to Supabase Storage
        const fileExt = buktiFile.name.split('.').pop();
        const fileName = `${bill.mahasiswa.nim}-${Date.now()}.${fileExt}`;
        const filePath = `bukti-transfer/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("payments")
          .upload(filePath, buktiFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from("payments")
          .getPublicUrl(filePath);
        
        publicUrl = url;
      }

      const sisaSetelahBayar = (bill.sisa_tagihan ?? bill.jumlah) - (jumlahBayar + (useDeposit ? Math.min(studentDeposit, (bill.sisa_tagihan ?? bill.jumlah)) : 0));
      const autoCatatan = (jumlahBayar + (useDeposit ? Math.min(studentDeposit, (bill.sisa_tagihan ?? bill.jumlah)) : 0)) < (bill.sisa_tagihan ?? bill.jumlah) 
        ? `Cicilan - Sisa ${formatRupiah(Math.max(0, sisaSetelahBayar))}` 
        : activeTab === "CASH" ? catatan : "Lunas";

      const finalJumlahBayar = Number(jumlahBayar) || 0;
      const finalNominalDeposit = useDeposit ? (Number(nominalDeposit) || 0) : 0;
      
      // 2. Call RPC to process payment
      const { error: rpcError } = await supabase.rpc("process_manual_payment", {
        p_tagihan_id: bill.id,
        p_jumlah_bayar: finalJumlahBayar,
        p_metode: activeTab === "TRANSFER" ? "TRANSFER_MANUAL" : "TUNAI",
        p_bank_pengirim: activeTab === "TRANSFER" ? bankPengirim : "Cash",
        p_bank_tujuan: activeTab === "TRANSFER" ? bankTujuan : "Admin",
        p_bukti_url: activeTab === "TRANSFER" ? publicUrl : autoCatatan,
        p_order_id: `${activeTab}-${bill.kode}-${Date.now()}`,
        p_nominal_deposit: finalNominalDeposit
      });

      if (rpcError) throw rpcError;

      setPaymentResult({
        no_kwitansi: `KW-${bill.kode}-${Date.now().toString().slice(-4)}`,
        tanggal: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
        nama: bill.mahasiswa.nama,
        nim: bill.mahasiswa.nim,
        untuk_pembayaran: bill.jenis,
        jumlah: finalJumlahBayar,
        nominal_deposit: finalNominalDeposit,
        total_gabungan: finalJumlahBayar + finalNominalDeposit,
        admin: "Admin Keuangan",
      });
      setShowReceipt(true);
      
      onSuccess();
      router.refresh();
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
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-serif text-slate-900">Input Pembayaran</h2>
            <p className="text-slate-500 text-sm">
              Tagihan: <span className="font-bold text-slate-700">{bill.jenis}</span> • {bill.mahasiswa.nama}
            </p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="p-8 space-y-6">
          {/* Student Deposit Info at Top */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Saldo Deposit Mahasiswa</p>
                <p className="text-lg font-serif font-bold text-indigo-900">{formatRupiah(studentDeposit)}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {useDeposit && (
                <div className="flex-1 space-y-1.5 animate-in slide-in-from-right-2">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">Nominal Deposit</p>
                  <input 
                    type="number"
                    value={nominalDeposit}
                    max={Math.min(studentDeposit, (bill.sisa_tagihan ?? bill.jumlah))}
                    onChange={(e) => {
                      const val = Math.min(
                        parseInt(e.target.value) || 0, 
                        studentDeposit, 
                        (bill.sisa_tagihan ?? bill.jumlah)
                      );
                      setNominalDeposit(val);
                      setJumlahBayar((bill.sisa_tagihan ?? bill.jumlah) - val);
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
              <label className={cn(
                "relative inline-flex items-center cursor-pointer",
                studentDeposit <= 0 && "opacity-50 cursor-not-allowed"
              )}>
                <input 
                  type="checkbox" 
                  checked={useDeposit}
                  disabled={studentDeposit <= 0}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setUseDeposit(isChecked);
                    
                    const sisa = (bill.sisa_tagihan ?? bill.jumlah);
                    if (isChecked) {
                      const defaultDep = Math.min(studentDeposit, sisa);
                      setNominalDeposit(defaultDep);
                      setJumlahBayar(sisa - defaultDep);
                    } else {
                      setNominalDeposit(0);
                      setJumlahBayar(sisa);
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Gunakan</span>
              </label>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tagihan</p>
              <p className="text-xl font-serif font-bold text-slate-900">{formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jumlah Bayar</p>
              <input 
                type="number"
                value={jumlahBayar}
                min={0}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setJumlahBayar(val);
                }}
                className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-right"
              />
            </div>
          </div>

          {/* Real-time Feedback Logic */}
          <div className="space-y-3">
            {useDeposit && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in zoom-in-95">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ringkasan Pembayaran</p>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                    Tagihan <span className="font-bold">{formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</span> akan dibayar dengan 
                    <span className="font-bold"> Deposit ({formatRupiah(nominalDeposit)})</span> dan 
                    <span className="font-bold"> {activeTab === "TRANSFER" ? "Transfer" : "Cash"} ({formatRupiah(jumlahBayar)})</span>.
                  </p>
                </div>
              </div>
            )}
            
            {jumlahBayar > (bill.sisa_tagihan ?? bill.jumlah) && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in zoom-in-95">
                <Coins className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Kelebihan Bayar</p>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                    Kelebihan <span className="font-bold">{formatRupiah(jumlahBayar - (bill.sisa_tagihan ?? bill.jumlah))}</span> akan otomatis masuk ke <span className="font-bold text-emerald-800">Saldo Deposit</span> mahasiswa.
                  </p>
                </div>
              </div>
            )}

            {/* Cicilan Info */}
            {jumlahBayar > 0 && (jumlahBayar + (useDeposit ? Math.min(studentDeposit, (bill.sisa_tagihan ?? bill.jumlah)) : 0)) < (bill.sisa_tagihan ?? bill.jumlah) && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pembayaran Cicilan</p>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Pembayaran ini akan tercatat sebagai cicilan. Sisa tagihan akan menjadi 
                    <span className="font-bold ml-1">{formatRupiah((bill.sisa_tagihan ?? bill.jumlah) - (jumlahBayar + (useDeposit ? Math.min(studentDeposit, (bill.sisa_tagihan ?? bill.jumlah)) : 0)))}</span>.
                    Status tagihan akan diperbarui menjadi <span className="font-bold text-amber-800 uppercase">Mencicil</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button 
              type="button"
              onClick={() => setActiveTab("TRANSFER")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                activeTab === "TRANSFER" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Banknote className="h-4 w-4" />
              Transfer Bank
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("CASH")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                activeTab === "CASH" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Coins className="h-4 w-4" />
              Tunai / Cash
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "TRANSFER" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bank Pengirim</label>
                  <input 
                    type="text"
                    placeholder="Contoh: BCA, Mandiri"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    value={bankPengirim}
                    onChange={(e) => setBankPengirim(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Rekening Tujuan</label>
                  <select 
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-4">
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Gunakan opsi ini jika mahasiswa melakukan pembayaran secara tunai langsung di loket administrasi.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  Catatan Pembayaran
                </label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 min-h-[100px]"
                  placeholder="Misal: Diterima oleh Admin A"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || (jumlahBayar + (useDeposit ? nominalDeposit : 0)) <= 0}
            className="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Konfirmasi Pembayaran
          </button>
        </form>
      </div>

      {showReceipt && paymentResult && (
        <OfficialReceipt 
          data={paymentResult} 
          onClose={() => {
            setShowReceipt(false);
            onClose();
          }} 
        />
      )}
    </div>
  );
}
