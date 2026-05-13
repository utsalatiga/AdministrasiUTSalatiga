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
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import OfficialReceipt from "@/components/payments/OfficialReceipt";
import PaymentModal from "@/components/payments/PaymentModal";
import PaymentHistory from "@/components/payments/PaymentHistory";
import { History } from "lucide-react";

export default function TagihanPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [historyBillId, setHistoryBillId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("tagihan")
        .select(`
          *,
          mahasiswa:mahasiswa_id (
            id,
            nama,
            nim,
            email
          )
        `);

      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }

      if (search) {
        // Correct syntax for filtering on joined tables in Supabase
        query = query.or(`nama.ilike.%${search}%,nim.ilike.%${search}%`, { foreignTable: 'mahasiswa' });
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching bills:", error);
      }

      if (data && data.length > 0) {
        setBills(data);
      } else {
        // Fallback dummy data for testing if DB is empty
        if (!search && !filterStatus && (!data || data.length === 0)) {
          const dummyBills = [
            {
              id: "dummy-1",
              kode: "INV-DUMMY-001",
              jenis: "SPP Semester Genap",
              jumlah: 2500000,
              sisa_tagihan: 2500000,
              status: "BELUM_LUNAS",
              created_at: new Date().toISOString(),
              mahasiswa: {
                nama: "Budi Santoso",
                nim: "012345678",
              }
            },
            {
              id: "dummy-2",
              kode: "INV-DUMMY-002",
              jenis: "SPI",
              jumlah: 5000000,
              sisa_tagihan: 1500000,
              status: "MENCICIL",
              created_at: new Date().toISOString(),
              mahasiswa: {
                nama: "Siti Aminah",
                nim: "087654321",
              }
            }
          ];
          setBills(dummyBills);
        } else {
          setBills([]);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBills();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filterStatus]);

  const handlePrint = (bill: any) => {
    setSelectedReceipt({
      no_kwitansi: `KW-${bill.kode}-${Date.now().toString().slice(-4)}`,
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
          <h1 className="font-serif text-3xl text-slate-900">Manajemen Tagihan</h1>
          <p className="text-slate-500 text-sm">Monitoring status pembayaran mahasiswa Universitas Terbuka.</p>
        </div>
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
            <option value="MENCICIL">Mencicil</option>
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
                      {bill.jenis}
                      <p className="text-[10px] text-slate-400 mt-1">{bill.kode}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-slate-900 font-tabular">
                      <p className="text-sm font-bold">{formatRupiah(bill.jumlah)}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-emerald-600 font-tabular">
                      <p className="text-sm font-bold">{formatRupiah(bill.jumlah - (bill.sisa_tagihan ?? bill.jumlah))}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-serif text-slate-900 font-tabular">
                      <p className="text-sm font-bold text-indigo-600">{formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "flex items-center gap-2 w-fit px-3 py-1 rounded-full mx-auto",
                        bill.status === "LUNAS" ? "bg-emerald-50 text-status-emerald" : 
                        bill.status === "MENCICIL" ? "bg-amber-50 text-status-amber" :
                        "bg-rose-50 text-rose-600"
                      )}>
                        {bill.status === "LUNAS" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{bill.status?.replace('_', ' ')}</span>
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
                        {bill.status !== "LUNAS" && (
                          <button 
                            onClick={() => setSelectedBill(bill)}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-all"
                          >
                            Bayar
                          </button>
                        )}
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
                    "bg-rose-50 text-rose-600"
                  )}>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{bill.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Tagihan</p>
                    <p className="text-xs font-semibold text-slate-600">{bill.jenis}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
                    <p className="text-sm font-serif font-bold text-indigo-600">{formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {bill.status !== "LUNAS" && (
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      Bayar Sekarang
                    </button>
                  )}
                  {bill.status === "LUNAS" && (
                    <button 
                      onClick={() => handlePrint(bill)}
                      className="w-full py-3 bg-slate-50 text-primary rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
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
            fetchBills();
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
