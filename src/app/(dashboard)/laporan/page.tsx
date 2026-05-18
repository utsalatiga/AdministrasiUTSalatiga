"use client";

import { useState } from "react";
import { 
  FileDown, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Loader2,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Eye,
  X,
  Maximize2,
  Printer
} from "lucide-react";
import { getReports } from "@/lib/actions/stats";
import { exportToExcel } from "@/lib/utils/export-excel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import OfficialReceipt from "@/components/payments/OfficialReceipt";

import { useQuery } from "@tanstack/react-query";

export default function LaporanPage() {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [filters, setFilters] = useState({
    method: "",
    type: "",
    status: "",
    dateStart: "",
    dateEnd: "",
    hasProof: false
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["reports", filters],
    queryFn: async () => {
      const result = await getReports(filters);
      return result.data || [];
    },
    staleTime: 30000,
  });

  const handleExport = () => {
    exportToExcel(data, "Laporan_Pembayaran_UT");
  };

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
    return `${year}/${ddmm}/${semester}/${nim}/001`;
  };

  const handlePrint = (p: any) => {
    setSelectedReceipt({
      no_kwitansi: getClientNoKwitansi(p.tagihan?.mahasiswa, p.tagihan, p.no_kwitansi),
      tanggal: new Date(p.created_at || Date.now()).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
      nama: p.tagihan?.mahasiswa?.nama,
      nim: p.tagihan?.mahasiswa?.nim,
      untuk_pembayaran: p.tagihan?.jenis,
      jumlah: p.jumlah_bayar,
      admin: "Admin Keuangan",
    });
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-500 text-sm">Rekapitulasi data transaksi dan ekspor laporan berkala.</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
        >
          <FileDown className="h-5 w-5" />
          <span>Export ke Excel</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        {/* Date Filters */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <input 
            type="date" 
            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
            value={filters.dateStart}
            onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
          />
          <span className="text-slate-300 text-xs">sampai</span>
          <input 
            type="date" 
            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
            value={filters.dateEnd}
            onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
          >
            <option value="">Semua Metode</option>
            <option value="TUNAI">Tunai</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <Clock className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Semua Status</option>
            <option value="LUNAS">Lunas (Verified)</option>
            <option value="PENDING">Pending</option>
            <option value="GAGAL">Gagal / Ditolak</option>
          </select>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={filters.hasProof}
                onChange={(e) => setFilters({ ...filters, hasProof: e.target.checked })}
              />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">
              Hanya yang ada bukti
            </span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Tagihan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Bukti Bayar</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-8 py-6">
                      <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-sm text-slate-400 font-tabular">{index + 1}</td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.tagihan?.mahasiswa?.nama}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.tagihan?.mahasiswa?.nim}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                      {item.tagihan?.jenis}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {item.bukti_url ? (
                        <div 
                          onClick={() => setSelectedProof(item.bukti_url)}
                          className="relative w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-100 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all group/img"
                        >
                          <img 
                            src={item.bukti_url} 
                            alt="Bukti" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-10 w-10 mx-auto rounded-lg bg-slate-50 flex items-center justify-center text-slate-200">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {item.metode}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={cn(
                        "flex items-center gap-2 w-fit px-3 py-1 rounded-full mx-auto",
                        item.status === "LUNAS" || item.status === "VERIFIED" ? "bg-emerald-50 text-status-emerald" : 
                        item.status === "PENDING" ? "bg-amber-50 text-status-amber" : "bg-rose-50 text-status-rose"
                      )}>
                        {item.status === "LUNAS" || item.status === "VERIFIED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-slate-900 font-tabular">{formatRupiah(item.jumlah_bayar)}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handlePrint(item)}
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
                <div className="h-10 bg-slate-50 rounded w-full"></div>
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic text-sm">
              Data tidak ditemukan.
            </div>
          ) : (
            data.map((item, index) => (
              <div key={item.id} className="p-6 space-y-4 active:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-tabular text-slate-400 font-bold">#{index + 1}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.tagihan?.mahasiswa?.nama}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{item.tagihan?.mahasiswa?.nim}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    item.status === "LUNAS" || item.status === "VERIFIED" ? "bg-emerald-50 text-status-emerald" : 
                    item.status === "PENDING" ? "bg-amber-50 text-status-amber" : "bg-rose-50 text-status-rose"
                  )}>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{item.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Tagihan</p>
                    <p className="text-xs font-semibold text-slate-600">{item.tagihan?.jenis}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</p>
                    <p className="text-sm font-serif font-bold text-slate-900">{formatRupiah(item.jumlah_bayar)}</p>
                    <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase mt-1">
                      {item.metode}
                    </span>
                  </div>
                </div>

                {item.bukti_url && (
                  <button 
                    onClick={() => setSelectedProof(item.bukti_url)}
                    className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Bukti Transfer
                  </button>
                )}

                <button 
                  onClick={() => handlePrint(item)}
                  className="w-full py-3 bg-slate-50 text-primary rounded-xl text-xs font-bold border border-slate-100 flex items-center justify-center gap-2 mt-2"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Kwitansi
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <a 
                  href={selectedProof} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-primary shadow-sm transition-all"
                >
                  <Maximize2 className="h-5 w-5" />
                </a>
                <button 
                  onClick={() => setSelectedProof(null)}
                  className="p-3 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-rose-600 shadow-sm transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 bg-white min-h-[400px] flex items-center justify-center">
                <img 
                  src={selectedProof} 
                  alt="Bukti Transfer Detail" 
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                />
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Pratinjau Bukti Transfer • Sistem Audit Digital
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedReceipt && (
        <OfficialReceipt 
          data={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}
    </div>
  );
}
