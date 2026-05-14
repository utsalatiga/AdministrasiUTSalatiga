"use client";

import { Wallet, Info, Search, Filter, History, Loader2, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function DepositPage() {
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["deposits", search],
    queryFn: async () => {
      let query = supabase
        .from("mahasiswa")
        .select("id, nama, nim, prodi, deposit")
        .gt("deposit", 0)
        .order("deposit", { ascending: false });

      if (search) {
        query = query.or(`nama.ilike.%${search}%,nim.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const totalDeposit = students.reduce((acc, curr) => acc + Number(curr.deposit || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Ikhtisar Deposit</h1>
          <p className="text-slate-500 text-sm">Monitoring saldo deposit dan kelebihan bayar mahasiswa.</p>
        </div>
      </div>

      {/* Summary Stat */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Wallet className="h-48 w-48" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Total Saldo Tertahan</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight">
              {formatRupiah(totalDeposit)}
            </h2>
            <p className="text-slate-400 text-sm font-medium">Dari {students.length} mahasiswa aktif</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Cari Mahasiswa..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
               />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program Studi</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Saldo Deposit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={3} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">Tidak ada mahasiswa dengan saldo deposit.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {student.nama?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{student.nama}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{student.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">{student.prodi}</td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-serif text-lg text-emerald-600 font-bold">{formatRupiah(student.deposit)}</p>
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
