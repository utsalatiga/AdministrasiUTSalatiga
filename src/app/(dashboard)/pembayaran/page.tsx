import { createClient } from "@/lib/supabase/server";
import { 
  Plus, 
  Wallet, 
  History, 
  ArrowUpRight, 
  Search,
  FileText
} from "lucide-react";
import Link from "next/link";

export default async function PaymentsHistoryPage() {
  const supabase = createClient();

  // Fetch payments with joined student and bill info
  const { data: payments } = await supabase
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

  // Summary logic
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments?.filter(p => p.created_at.startsWith(today)) || [];
  const totalToday = todayPayments.reduce((acc, curr) => acc + Number(curr.jumlah_bayar), 0);
  const countToday = todayPayments.length;

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(!payments || payments.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-sm">
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
                      <div className="flex items-center gap-2 text-status-emerald bg-emerald-50 w-fit px-3 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-status-emerald rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">LUNAS</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-slate-900 font-tabular">{formatRupiah(p.jumlah_bayar)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
