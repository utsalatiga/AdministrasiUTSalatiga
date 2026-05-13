"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CreditCard, MessageSquare, Loader2, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PaymentHistoryProps {
  billId: string;
  onClose: () => void;
}

export default function PaymentHistory({ billId, onClose }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("tagihan_id", billId)
        .order("created_at", { ascending: false });

      if (data) setPayments(data);
      setIsLoading(false);
    };

    fetchHistory();
  }, [billId]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-8 pb-4 border-b border-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <History className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-serif text-slate-900">Riwayat Cicilan</h2>
              <p className="text-slate-500 text-sm">Daftar transaksi untuk tagihan ini.</p>
            </div>
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Memuat riwayat...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 italic">Belum ada riwayat pembayaran.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(payment.created_at).toLocaleDateString("id-ID", { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{payment.metode.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-serif font-bold text-indigo-600">{formatRupiah(payment.jumlah_bayar)}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{payment.status}</span>
                      </div>
                    </div>
                  </div>

                  {payment.bukti_url && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3">
                      <MessageSquare className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        {payment.bukti_url.startsWith('http') ? "Pembayaran via Transfer (Bukti tersedia)" : payment.bukti_url}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
