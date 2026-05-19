"use client";

import { useState, Fragment } from "react";
import { Student } from "@/hooks/useStudents";
import { 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getStudentDetails } from "@/lib/actions/payments";
import { deleteMahasiswa } from "@/lib/actions/students";
import { getCurrentUserProfile } from "@/lib/actions/admins";
import { isSuperAdmin } from "@/lib/roles";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();
  const totalPages = Math.ceil(totalCount / pageSize);
  const [jumpPage, setJumpPage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then(profile => setUserRole(profile?.role || "admin"));
  }, []);

  const prefetchStudent = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ["student-details", id],
      queryFn: () => getStudentDetails(id),
      staleTime: 60 * 1000,
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin(userRole)) {
      alert("Hanya Super Admin yang memiliki akses untuk menghapus data.");
      return;
    }

    if (confirm("Apakah Anda yakin ingin menghapus data mahasiswa ini secara permanen? Seluruh riwayat tagihan dan pembayaran juga akan ikut terhapus.")) {
      try {
        setIsDeleting(id);
        const res = await deleteMahasiswa(id);
        if (res.error) throw new Error(res.error);
        onRefresh();
      } catch (err: any) {
        alert(err.message || "Gagal menghapus data");
      } finally {
        setIsDeleting(null);
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

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpPage("");
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + showMax - 1);
    
    if (end - start < showMax - 1) {
      start = Math.max(1, end - showMax + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm relative">
      {/* Loading Overlay */}
      {isLoading && students.length > 0 && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-rose-600 animate-spin" />
            <span className="text-sm font-bold text-slate-600">Memuat Data...</span>
          </div>
        </div>
      )}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prodi / Angkatan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Tagihan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Deposit</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status Keuangan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && students.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-6">
                    <div className="h-6 bg-slate-100 rounded-xl w-full"></div>
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                  Tidak ada data mahasiswa ditemukan.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <Fragment key={student.id}>
                  <tr 
                    onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                    onMouseEnter={() => prefetchStudent(student.id)}
                    className={cn("hover:bg-slate-50/80 transition-all group cursor-pointer", expandedStudentId === student.id && "bg-slate-50/80")}
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
                  <td className="px-6 py-4 text-right">
                    <p className={cn(
                      "font-serif text-base font-tabular tracking-tight",
                      (student.deposit || 0) > 0 ? "text-emerald-600 font-bold" : "text-slate-400"
                    )}>
                      {formatRupiah(student.deposit || 0)}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {student.status_keuangan === "MENUNGGAK" ? "BELUM LUNAS" : student.status_keuangan}
                      </span>
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
                      {isSuperAdmin(userRole) && (
                        <button 
                          onClick={(e) => handleDelete(student.id, e)}
                          disabled={isDeleting === student.id}
                          className="p-2 text-slate-400 hover:text-status-rose hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30"
                        >
                          {isDeleting === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedStudentId === student.id && (
                  <tr className="bg-slate-50/30">
                    <td colSpan={6} className="p-0">
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-6 border-b border-slate-100">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Biodata Lengkap
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Grup A: Kependudukan */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NIK (Nomor Induk Kependudukan)</p>
                                <p className="text-sm font-semibold text-slate-700">{student.nik || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Lahir</p>
                                <p className="text-sm font-semibold text-slate-700">{student.tanggal_lahir || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Ibu Kandung</p>
                                <p className="text-sm font-semibold text-slate-700">{student.nama_ibu || "-"}</p>
                              </div>
                            </div>
                            {/* Grup B: Akademik & Kontak */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. WhatsApp</p>
                                <p className="text-sm font-semibold text-slate-700">{student.no_wa || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi Ujian</p>
                                <p className="text-sm font-semibold text-slate-700">{student.lokasi_ujian || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Angkatan Masuk</p>
                                <p className="text-sm font-semibold text-slate-700">{student.angkatan || "-"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
                             <button 
                               onClick={(e) => { e.stopPropagation(); onView(student); }} 
                               className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/10"
                             >
                               Lihat Detail Tagihan
                             </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {isLoading && students.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-3 bg-slate-50 rounded w-1/3"></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-8 bg-slate-50 rounded"></div>
                <div className="h-8 bg-slate-50 rounded"></div>
              </div>
            </div>
          ))
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-slate-400 italic text-sm">
            Tidak ada data ditemukan.
          </div>
        ) : (
          students.map((student) => (
            <div 
              key={student.id}
              onClick={() => onView(student)}
              className="p-4 space-y-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {student.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-none">{student.nama}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{student.nim}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                  student.status_keuangan === "LUNAS" ? "bg-emerald-50 text-status-emerald" : 
                  student.status_keuangan === "MENUNGGAK" ? "bg-rose-50 text-status-rose" : "bg-slate-100 text-slate-400"
                )}>
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {student.status_keuangan === "MENUNGGAK" ? "BELUM LUNAS" : student.status_keuangan}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prodi / Angkatan</p>
                  <p className="text-xs font-semibold text-slate-600">{student.prodi} ({student.angkatan})</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tagihan / Deposit</p>
                  <p className="text-sm font-serif font-bold text-slate-900">{formatRupiah(student.total_tagihan || 0)}</p>
                  <p className="text-xs font-serif text-emerald-600 font-bold">{formatRupiah(student.deposit || 0)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                  className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100 flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                {isSuperAdmin(userRole) && (
                  <button 
                    onClick={(e) => handleDelete(student.id, e)}
                    disabled={isDeleting === student.id}
                    className="flex-1 py-2 bg-rose-50 text-status-rose rounded-lg text-xs font-bold border border-rose-100 flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    {isDeleting === student.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/30 gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            Halaman <span className="font-bold text-slate-900">{page}</span> dari <span className="font-bold text-slate-900">{totalPages || 1}</span>
          </p>
          <form onSubmit={handleJump} className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ke Halaman</span>
            <input 
              type="number" 
              min={1} 
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              className="w-12 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            />
          </form>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button 
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                disabled={isLoading}
                className={cn(
                  "h-9 w-9 rounded-xl text-xs font-bold transition-all",
                  page === n 
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20 scale-110" 
                    : "text-slate-500 hover:bg-white hover:text-rose-600 border border-transparent hover:border-rose-100"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <button 
            disabled={page === totalPages || totalPages === 0 || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button 
            disabled={page === totalPages || totalPages === 0 || isLoading}
            onClick={() => onPageChange(totalPages)}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
