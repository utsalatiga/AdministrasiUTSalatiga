"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Wallet, 
  History, 
  ArrowUpRight, 
  Search,
  CheckCircle2,
  Printer,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OfficialReceipt from "@/components/payments/OfficialReceipt";

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  const supabase = createClient();

  const fetchPayments = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("pembayaran")
      .select(`
        *,
        tagihan:tagihan_id (
          jenis,
          mahasiswa:mahasiswa_id (
            nama,
            nim
          )
        )
      `)
      .order("created_at", { ascending: false });
    
    if (data) setPayments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePrint = (p: any) => {
    setSelectedReceipt({
      no_kwitansi: `KW-${Date.now().toString().slice(-6)}`,
      tanggal: new Date(p.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
      nama: p.tagihan.mahasiswa.nama,
      nim: p.tagihan.mahasiswa.nim,
      untuk_pembayaran: p.tagihan.jenis,
      jumlah: p.jumlah_bayar,
      admin: "Admin Keuangan",
    });
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Summary logic
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.created_at.startsWith(today));
  const totalToday = todayPayments.reduce((acc, curr) => acc + Number(curr.jumlah_bayar), 0);
  const countToday = todayPayments.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Riwayat Pembayaran</h1>
          <p className="text-slate-500 text-sm">Pemantauan transaksi uang masuk dan buku kas.</p>
        </div>

        <Link
          href="/pembayaran/baru"
          className="flex items-center gap-2 px-6 py-3 bg-sidebar text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-indigo-950/20"
        >
          <Plus className="h-5 w-5" />
          <span>Input Pembayaran Baru</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-status-emerald"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-status-emerald">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Kas Hari Ini</p>
              <h3 className="font-serif text-3xl text-slate-900 font-tabular mt-1">{formatRupiah(totalToday)}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-status-emerald font-bold bg-emerald-50 w-fit px-3 py-1 rounded-full">
            <ArrowUpRight className="h-3 w-3" />
            <span>PENERIMAAN AKTIF</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-primary">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Transaksi Hari Ini</p>
              <h3 className="font-serif text-3xl text-slate-900 font-tabular mt-1">{countToday} Transaksi</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-primary font-bold bg-blue-50 w-fit px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            <span>TERVERIFIKASI</span>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            Riwayat Terkini
          </h3>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                    Belum ada riwayat pembayaran yang tercatat.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {p.tagihan?.mahasiswa?.nama?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.tagihan?.mahasiswa?.nama}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{p.tagihan?.mahasiswa?.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-slate-600 font-medium">{p.tagihan?.jenis}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {p.metode}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-status-emerald bg-emerald-50 w-fit px-3 py-1 rounded-full mx-auto">
                        <div className="w-1.5 h-1.5 bg-status-emerald rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">LUNAS</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-slate-900 font-tabular">{formatRupiah(p.jumlah_bayar)}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handlePrint(p)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Cetak Kwitansi"
                      >
                        <Printer className="h-5 w-5" />
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
                <div className="h-3 bg-slate-50 rounded w-1/3"></div>
              </div>
            ))
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic text-sm">
              Belum ada riwayat pembayaran yang tercatat.
            </div>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="p-6 space-y-4 active:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                      {p.tagihan?.mahasiswa?.nama?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.tagihan?.mahasiswa?.nama}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{p.tagihan?.mahasiswa?.nim}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-status-emerald">
                    <span className="text-[9px] font-bold uppercase tracking-wider">LUNAS</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</p>
                    <p className="text-xs font-semibold text-slate-600">{p.tagihan?.jenis}</p>
                    <p className="text-[9px] text-slate-400">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</p>
                    <p className="text-sm font-serif font-bold text-slate-900">{formatRupiah(p.jumlah_bayar)}</p>
                    <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase mt-1">
                      {p.metode}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePrint(p)}
                  className="w-full py-3 bg-slate-50 text-primary rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Kwitansi
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedReceipt && (
        <OfficialReceipt 
          data={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}
    </div>
  );
}
