"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  CreditCard, 
  User, 
  Receipt, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Calendar,
  Wallet,
  Send,
  Upload
} from "lucide-react";
import { searchStudents, getStudentBills, createCashPayment, getStudentFinancialSummary } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import ReceiptTemplate from "@/components/payments/ReceiptTemplate";

export default function NewPaymentPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  // New State for Payment Method
  const [method, setMethod] = useState<"TUNAI" | "TRANSFER">("TUNAI");
  const [isAutoVerify, setIsAutoVerify] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length > 2) {
        const { data } = await searchStudents(search);
        if (data) setStudents(data);
      } else {
        setStudents([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setSearch("");
    setStudents([]);
    setIsLoading(true);
    
    const [billsRes, summaryRes] = await Promise.all([
      getStudentBills(student.id),
      getStudentFinancialSummary(student.id)
    ]);

    if (billsRes.data) setBills(billsRes.data);
    if (summaryRes) setFinancialSummary(summaryRes);
    
    setIsLoading(false);
  };

  const handlePayment = async () => {
    if (!selectedBill) return;
    setIsSubmitting(true);
    
    // Status is LUNAS if Tunai or if Transfer with AutoVerify checked
    const status = (method === "TUNAI" || isAutoVerify) ? "LUNAS" : "PENDING";
    
    const result = await createCashPayment({
      tagihan_id: selectedBill.id,
      jumlah_bayar: selectedBill.jumlah,
      metode: method,
      status: status
    });

    if (result.success) {
      if (status === "LUNAS") {
        setPaymentResult({
          no_kwitansi: `KW-${Date.now().toString().slice(-6)}`,
          tanggal: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
          nama: selectedStudent.nama,
          nim: selectedStudent.nim,
          untuk_pembayaran: selectedBill.jenis,
          jumlah: selectedBill.jumlah,
          admin: "Admin Keuangan",
        });
        setShowReceipt(true);
      } else {
        alert("Pembayaran berhasil dicatat sebagai PENDING. Silakan verifikasi di menu Verifikasi.");
        setSelectedStudent(null);
        setSelectedBill(null);
      }
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-slate-900">Input Pembayaran Baru</h1>
        <p className="text-slate-500 text-sm">Pencatatan pembayaran mahasiswa oleh Admin (Tunai/Transfer).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Cari Mahasiswa */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <User className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-800">Cari Mahasiswa</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Masukkan Nama atau NIM..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              
              {students.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in slide-in-from-top-2 duration-200">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex flex-col"
                    >
                      <span className="text-sm font-semibold text-slate-800">{s.nama}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{s.nim}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-status-emerald" />
                  <div>
                    <p className="text-xs font-bold text-status-emerald uppercase tracking-wider">Terpilih</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedStudent.nama}</p>
                  </div>
                </div>

                {financialSummary && (
                  <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Tunggakan</p>
                      <p className="font-serif text-2xl text-white font-tabular">{formatRupiah(financialSummary.totalArrears)}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{financialSummary.billsCount} Tagihan</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                        financialSummary.status === "LUNAS" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}>{financialSummary.status}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Pilih Tagihan & Metode */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
            {!selectedStudent ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                <Receipt className="h-16 w-16 text-slate-300" />
                <p className="text-slate-500 font-medium italic">Silakan cari dan pilih mahasiswa terlebih dahulu.</p>
              </div>
            ) : isLoading ? (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-400 text-sm mt-4">Memuat tagihan aktif...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-status-emerald" />
                <p className="text-slate-500 font-medium">Mahasiswa ini tidak memiliki tagihan aktif.</p>
                <button onClick={() => setSelectedStudent(null)} className="text-primary text-sm font-semibold">Cari mahasiswa lain</button>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-serif text-xl text-slate-800">Pilih Tagihan & Metode</h3>
                  
                  {/* Method Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    <button 
                      onClick={() => setMethod("TUNAI")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        method === "TUNAI" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      TUNAI
                    </button>
                    <button 
                      onClick={() => setMethod("TRANSFER")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        method === "TRANSFER" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      TRANSFER
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {bills.map((bill) => (
                    <button
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className={cn(
                        "w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group",
                        selectedBill?.id === bill.id 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-all",
                          selectedBill?.id === bill.id ? "bg-primary text-white" : "bg-white text-slate-400 group-hover:text-slate-600"
                        )}>
                          <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{bill.jenis}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {bill.jatuh_tempo}</span>
                            <span>•</span>
                            <span>{bill.kode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-serif text-lg",
                          selectedBill?.id === bill.id ? "text-primary" : "text-slate-900"
                        )}>
                          {formatRupiah(bill.jumlah)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedBill && (
                  <div className="pt-6 border-t border-slate-100 mt-8 space-y-6">
                    {method === "TRANSFER" && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-status-amber uppercase tracking-wider flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Konfirmasi Transfer
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Verifikasi Langsung?</span>
                            <input 
                              type="checkbox" 
                              checked={isAutoVerify}
                              onChange={(e) => setIsAutoVerify(e.target.checked)}
                              className="h-4 w-4 accent-primary"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                          {isAutoVerify 
                            ? "Admin telah memvalidasi bukti transfer secara manual. Status akan langsung LUNAS." 
                            : "Pembayaran akan dicatat sebagai PENDING untuk diverifikasi kemudian."}
                        </p>
                      </div>
                    )}

                    <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-xl shadow-slate-900/10">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Total yang Dibayar</p>
                        <p className="font-serif text-3xl font-tabular">{formatRupiah(selectedBill.jumlah)}</p>
                      </div>
                      <button
                        onClick={handlePayment}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            {method === "TUNAI" ? "Konfirmasi Tunai" : "Simpan Transfer"}
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReceipt && paymentResult && (
        <ReceiptTemplate 
          data={paymentResult} 
          onClose={() => {
            setShowReceipt(false);
            setSelectedStudent(null);
            setSelectedBill(null);
            setBills([]);
          }} 
        />
      )}
    </div>
  );
}
