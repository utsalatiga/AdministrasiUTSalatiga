"use client";

import { Wallet, Info, Search, Filter, History } from "lucide-react";
import { useState } from "react";

export default function DepositPlaceholderPage() {
  const [search, setSearch] = useState("");

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
          <h1 className="font-serif text-3xl text-slate-900">Ikhtisar Deposit</h1>
          <p className="text-slate-500 text-sm">Monitoring saldo deposit dan kelebihan bayar mahasiswa.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-white text-amber-600 rounded-2xl shadow-sm">
          <Info className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-amber-900">Fitur Dalam Pengembangan</h3>
          <p className="text-sm text-amber-700 leading-relaxed">
            Halaman ini akan menampilkan daftar lengkap mahasiswa yang memiliki saldo deposit, 
            riwayat penggunaan deposit untuk pelunasan tagihan, serta fitur penarikan atau pengembalian dana.
          </p>
        </div>
      </div>

      {/* Placeholder Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden opacity-60 grayscale-[0.5]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Daftar Saldo Deposit</h3>
          </div>
          
          <div className="flex items-center gap-4 flex-1 max-w-md">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Cari Mahasiswa..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm disabled:cursor-not-allowed"
                 disabled
               />
             </div>
             <button className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400" disabled>
               <Filter className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <History className="h-10 w-10 text-slate-200" />
          </div>
          <div>
            <p className="text-slate-400 font-medium italic">Modul laporan deposit segera hadir.</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">V1.5 COMING SOON</p>
          </div>
        </div>
      </div>
    </div>
  );
}
