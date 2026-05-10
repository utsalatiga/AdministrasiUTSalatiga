"use client";

import { Student } from "@/hooks/useStudents";
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onView: (student: Student) => void;
  onRefresh: () => void;
}

export default function StudentTable({
  students,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onView,
  onRefresh,
}: StudentTableProps) {
  const supabase = createClient();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Apakah Anda yakin ingin menghapus data mahasiswa ini?")) {
      try {
        const { error } = await supabase.from("mahasiswa").delete().eq("id", id);
        if (error) throw error;
        onRefresh();
      } catch (err: any) {
        alert(err.message || "Gagal menghapus data");
      }
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prodi / Angkatan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Tagihan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status Keuangan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-6">
                    <div className="h-6 bg-slate-100 rounded-xl w-full"></div>
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                  Tidak ada data mahasiswa ditemukan.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr 
                  key={student.id} 
                  onClick={() => onView(student)}
                  className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {student.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{student.nama}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{student.nim}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-600">{student.prodi}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{student.angkatan}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-serif text-lg text-slate-900 font-tabular tracking-tight">
                      {formatRupiah(student.total_tagihan || 0)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "flex items-center gap-2 w-fit px-3 py-1 rounded-full mx-auto",
                      student.status_keuangan === "LUNAS" ? "bg-emerald-50 text-status-emerald" : 
                      student.status_keuangan === "MENUNGGAK" ? "bg-rose-50 text-status-rose" : "bg-slate-100 text-slate-400"
                    )}>
                      {student.status_keuangan === "LUNAS" ? <CheckCircle2 className="h-3 w-3" /> : 
                       student.status_keuangan === "MENUNGGAK" ? <AlertCircle className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{student.status_keuangan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(student.id, e)}
                        className="p-2 text-slate-400 hover:text-status-rose hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
        <p className="text-sm text-slate-500">
          Halaman {page} dari {totalPages || 1} • <span className="font-semibold text-slate-700">{totalCount}</span> Mahasiswa
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            disabled={page === totalPages || totalPages === 0 || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
