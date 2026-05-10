"use client";

import { Student } from "@/hooks/useStudents";
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
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
  onRefresh,
}: StudentTableProps) {
  const supabase = createClient();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDelete = async (id: string) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIM</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prodi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Angkatan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                  Tidak ada data mahasiswa ditemukan.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-tabular text-sm text-slate-600">{student.nim}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{student.nama}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.prodi}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.angkatan}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(student)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
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
          Menampilkan <span className="font-semibold text-slate-700">{students.length}</span> dari <span className="font-semibold text-slate-700">{totalCount}</span> mahasiswa
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium text-slate-600 px-2">
            Halaman {page} dari {totalPages || 1}
          </div>
          <button 
            disabled={page === totalPages || totalPages === 0 || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
