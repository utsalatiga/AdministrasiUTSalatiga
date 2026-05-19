"use client";

import { useState, useEffect } from "react";
import { 
  Receipt, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Printer,
  XCircle,
  Loader2,
  Wallet,
  Info
} from "lucide-react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const OfficialReceipt = dynamic(() => import("@/components/payments/OfficialReceipt"), { ssr: false });
const PaymentModal = dynamic(() => import("@/components/payments/PaymentModal"), { ssr: false });
const PaymentHistory = dynamic(() => import("@/components/payments/PaymentHistory"), { ssr: false });

import { History } from "lucide-react";

export default function TagihanPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [historyBillId, setHistoryBillId] = useState<string | null>(null);

  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: bills = [], isLoading, refetch } = useQuery({
    queryKey: ["bills", search, filterStatus, page],
    queryFn: async () => {
      let query = supabase
        .from("tagihan")
        .select(`
          id,
          kode,
          jenis,
          jumlah,
          sisa_tagihan,
          status,
          created_at,
          mahasiswa!inner (
            id,
            nama,
            nim,
            prodi,
            deposit
          )
        `);

      if (search) {
        query = query.or(`mahasiswa.nama.ilike.%${search}%,mahasiswa.nim.ilike.%${search}%`);
      }

      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      // Normalize data (ensure mahasiswa is an object, not an array)
      const normalizedData = (data as any[])?.map(bill => ({
        ...bill,
        mahasiswa: Array.isArray(bill.mahasiswa) ? bill.mahasiswa[0] : bill.mahasiswa
      }));

      return normalizedData || [];
    },
    staleTime: 30000,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  const getClientNoKwitansi = (student: any, bill?: any, realNo?: string) => {
    if (realNo) return realNo;
    const now = new Date();
    const year = now.getFullYear();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ddmm = `${day}${month}`;
    let semester = bill?.semester || student?.semester;
    if (!semester) {
      semester = now.getMonth() < 6 ? `${year}.1` : `${year}.2`;
    }
    const nim = student?.nim || "000000000";
    return `${nim}/${semester}/UT/001`;
  };

  const handlePrint = (bill: any) => {
    setSelectedReceipt({
      no_kwitansi: getClientNoKwitansi(bill.mahasiswa, bill),
      tanggal: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
      nama: bill.mahasiswa.nama,
      nim: bill.mahasiswa.nim,
      untuk_pembayaran: bill.jenis,
      jumlah: bill.jumlah,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Tagihan & Deposit</h1>
          <p className="text-slate-500 text-sm">Monitoring status pembayaran dan saldo deposit mahasiswa.</p>
        </div>

        <Link
          href="/deposit"
          className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm"
        >
          <Wallet className="h-5 w-5" />
          <span>Lihat Ikhtisar Deposit</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="LUNAS">Lunas</option>
            <option value="MENCICIL">Dicicil</option>
            <option value="BELUM_LUNAS">Belum Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {/* Table Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tagihan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Terbayar</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Sisa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-8 py-6"><div className="h-8 bg-slate-50 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 italic">Data tagihan tidak ditemukan.</td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {bill.mahasiswa?.nama?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{bill.mahasiswa?.nama}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{bill.mahasiswa?.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                      {bill.isPlaceholder ? (
                        <span className="italic text-slate-400">Belum Ada Tagihan</span>
                      ) : (
                        <>
                          {bill.jenis}
                          <p className="text-[10px] text-slate-400 mt-1">{bill.kode}</p>
                        </>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-slate-900 font-tabular">
                      <p className="text-sm font-bold">{bill.isPlaceholder ? "-" : formatRupiah(bill.jumlah)}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-emerald-600 font-tabular">
                      <p className="text-sm font-bold">{bill.isPlaceholder ? "-" : formatRupiah(bill.jumlah - (bill.sisa_tagihan ?? bill.jumlah))}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-slate-900 font-tabular">
                      <p className="text-sm font-bold text-indigo-600">{bill.isPlaceholder ? "-" : formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "flex items-center gap-2 w-fit px-3 py-1 rounded-full mx-auto",
                        bill.status === "LUNAS" ? "bg-emerald-50 text-status-emerald" : 
                        bill.status === "MENCICIL" ? "bg-amber-50 text-status-amber" :
                        bill.status === "BELUM_ADA" ? "bg-slate-50 text-slate-400" :
                        "bg-rose-50 text-rose-600"
                      )}>
                        {bill.status === "LUNAS" ? <CheckCircle2 className="h-3 w-3" /> : bill.status === "BELUM_ADA" ? <Info className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {bill.status === "MENCICIL" ? "DICICIL" : bill.status === "MENUNGGAK" ? "BELUM LUNAS" : bill.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setHistoryBillId(bill.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Riwayat Pembayaran"
                        >
                          <History className="h-5 w-5" />
                        </button>
                        {bill.status === "LUNAS" && (
                          <button 
                            onClick={() => handlePrint(bill)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Cetak Kwitansi"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                        )}
                      </div>
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
                <div className="h-10 bg-slate-50 rounded w-full"></div>
              </div>
            ))
          ) : bills.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic text-sm">
              Data tagihan tidak ditemukan.
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="p-6 space-y-4 active:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                      {bill.mahasiswa?.nama?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{bill.mahasiswa?.nama}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{bill.mahasiswa?.nim}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    bill.status === "LUNAS" ? "bg-emerald-50 text-status-emerald" : 
                    bill.status === "MENCICIL" ? "bg-amber-50 text-status-amber" :
                    bill.status === "BELUM_ADA" ? "bg-slate-50 text-slate-400" :
                    "bg-rose-50 text-rose-600"
                  )}>
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {bill.status === "MENCICIL" ? "DICICIL" : bill.status === "MENUNGGAK" ? "BELUM LUNAS" : bill.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Tagihan</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {bill.isPlaceholder ? "Belum Ada" : bill.jenis}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
                    <p className="text-sm font-serif font-bold text-indigo-600">
                      {bill.isPlaceholder ? "-" : formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setHistoryBillId(bill.id)}
                    className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    Riwayat
                  </button>
                  {bill.status === "LUNAS" && (
                    <button 
                      onClick={() => handlePrint(bill)}
                      className="flex-1 py-3 bg-slate-50 text-primary rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Cetak Kwitansi
                    </button>
                  )}
                </div>
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

      {selectedBill && (
        <PaymentModal 
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={() => {
            refetch();
            setSelectedBill(null);
          }}
        />
      )}

      {historyBillId && (
        <PaymentHistory 
          billId={historyBillId}
          onClose={() => setHistoryBillId(null)}
        />
      )}
    </div>
  );
}
