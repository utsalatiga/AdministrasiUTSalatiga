"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  Search,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { getPendingPayments } from "@/lib/actions/verification";
import VerificationModal from "@/components/verification/VerificationModal";

import { useQuery } from "@tanstack/react-query";

export default function VerificationPage() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await getPendingPayments();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 30000,
  });

  const handleReview = (payment: any) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Verifikasi Pembayaran</h1>
          <p className="text-slate-500 text-sm">Validasi bukti transfer mahasiswa untuk konfirmasi tagihan.</p>
        </div>
        
        <button 
          onClick={() => refetch()}
          className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <RefreshCw className={isLoading ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-status-amber">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Antrean Pending</p>
            <h3 className="font-serif text-2xl text-slate-900">{payments.length} Transaksi</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-slate-400" />
            Menunggu Verifikasi
          </h3>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Unggah</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6">
                      <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                    Tidak ada antrean verifikasi saat ini.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {p.tagihan?.mahasiswa?.nama?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.tagihan?.mahasiswa?.nama}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{p.tagihan?.mahasiswa?.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-slate-600">{new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-slate-900 font-tabular tracking-tight">{formatRupiah(p.jumlah_bayar)}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleReview(p)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-indigo-900/10"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-10 bg-slate-50 rounded w-full"></div>
              </div>
            ))
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic text-sm">
              Tidak ada antrean verifikasi saat ini.
            </div>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="p-6 space-y-4 active:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                      {p.tagihan?.mahasiswa?.nama?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.tagihan?.mahasiswa?.nama}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{p.tagihan?.mahasiswa?.nim}</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-amber-50 text-status-amber text-[9px] font-bold uppercase tracking-wider">
                    PENDING
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Unggah</p>
                    <p className="text-xs font-semibold text-slate-600">{new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</p>
                    <p className="text-sm font-serif font-bold text-slate-900">{formatRupiah(p.jumlah_bayar)}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleReview(p)}
                  className="w-full py-3 bg-sidebar text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Review Bukti Transfer
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <VerificationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedPayment}
        onSuccess={refetch}
      />
    </div>
  );
}
