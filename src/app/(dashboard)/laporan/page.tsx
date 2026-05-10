"use client";

import { useState, useEffect } from "react";
import { 
  FileDown, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Loader2,
  FileSpreadsheet,
  Clock,
  CheckCircle2
} from "lucide-react";
import { getReports } from "@/lib/actions/stats";
import { exportToExcel } from "@/lib/utils/export-excel";
import { cn } from "@/lib/utils";

export default function LaporanPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    method: "",
    type: "",
    status: "",
    dateStart: "",
    dateEnd: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getReports(filters);
    if (result.data) setData(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleExport = () => {
    exportToExcel(data, "Laporan_Pembayaran_UT");
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          </select>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <FileSpreadsheet className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Semua Jenis Tagihan</option>
            <option value="SPP">SPP</option>
            <option value="BUKU">Buku</option>
            <option value="ALMAMATER">Almamater</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Tagihan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic text-sm">
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
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {item.metode}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "flex items-center gap-2 w-fit px-3 py-1 rounded-full mx-auto",
                        item.status === "LUNAS" ? "bg-emerald-50 text-status-emerald" : "bg-amber-50 text-status-amber"
                      )}>
                        {item.status === "LUNAS" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-slate-900 font-tabular">{formatRupiah(item.jumlah_bayar)}</p>
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
