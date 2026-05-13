"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Receipt, 
  CreditCard, 
  User, 
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Banknote
} from "lucide-react";
import { getStudentDetails } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
}

export default function StudentDetailModal({ isOpen, onClose, studentId }: StudentDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      const fetchData = async () => {
        setIsLoading(true);
        const result = await getStudentDetails(studentId);
        setData(result);
        setIsLoading(false);
      };
      fetchData();
    } else {
      setData(null);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:justify-end p-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-2xl h-full sm:h-full shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right-full duration-500 rounded-t-[2rem] sm:rounded-none overflow-hidden">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2 sm:p-3 bg-primary text-white rounded-xl sm:rounded-2xl">
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-slate-800">Detail Mahasiswa</h3>
              <p className="hidden sm:block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informasi Akademik & Keuangan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 sm:space-y-10">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-slate-400 text-sm italic font-medium">Menyusun data mahasiswa...</p>
            </div>
          ) : data ? (
            <>
              {/* Profile Header */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="p-4 bg-slate-50 rounded-2xl sm:bg-transparent sm:p-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">NIM</label>
                    <p className="font-serif text-2xl text-slate-900 font-tabular tracking-tight">{data.student.nim}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl sm:bg-transparent sm:p-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                    <p className="text-lg font-bold text-slate-800">{data.student.nama}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl sm:bg-transparent sm:p-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Program Studi</label>
                    <p className="text-sm font-semibold text-slate-600">{data.student.prodi}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl sm:bg-transparent sm:p-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Angkatan</label>
                    <p className="text-sm font-semibold text-slate-600">{data.student.angkatan}</p>
                  </div>
                </div>
              </div>

              {/* Bills Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Daftar Tagihan
                </h4>
                <div className="space-y-3">
                  {data.bills.map((bill: any) => (
                    <div key={bill.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          bill.status === "LUNAS" ? "bg-emerald-100 text-status-emerald" : 
                          bill.status === "MENCICIL" ? "bg-amber-100 text-status-amber" :
                          "bg-rose-100 text-rose-600"
                        )}>
                          {bill.status === "LUNAS" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{bill.jenis}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{bill.kode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-xs text-slate-400 line-through mb-1">{formatRupiah(bill.jumlah)}</p>
                        <p className="font-serif text-base text-slate-900 font-bold">{formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase mt-1",
                          bill.status === "LUNAS" ? "text-status-emerald" : 
                          bill.status === "MENCICIL" ? "text-status-amber" :
                          "text-rose-600"
                        )}>{bill.status?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                  {data.bills.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">Belum ada tagihan terdaftar.</p>
                  )}
                </div>
              </div>

              {/* Payments Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Riwayat Pembayaran
                </h4>
                <div className="space-y-3">
                  {data.payments.map((p: any) => (
                    <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          p.metode === "TUNAI" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {p.metode === "TUNAI" ? <Coins className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.tagihan?.jenis}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {new Date(p.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} • {p.metode}
                          </p>
                          {p.metode === "TUNAI" && p.bukti_url && (
                            <p className="text-[10px] text-slate-500 italic mt-1 font-medium bg-slate-50 p-1.5 rounded-lg inline-block">
                              "{p.bukti_url}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-base text-slate-900 font-bold">+{formatRupiah(p.jumlah_bayar)}</p>
                        <span className="text-[10px] font-bold uppercase text-status-emerald bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
                      </div>
                    </div>
                  ))}
                  {data.payments.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">Belum ada transaksi pembayaran.</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
        
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 sticky bottom-0">
          <button onClick={onClose} className="w-full h-12 sm:h-auto py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm">
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
