"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Mail, Calendar, Shield, Loader2, User, Trash2 } from "lucide-react";
import { getAdmins, getCurrentUserProfile, deleteAdmin } from "@/lib/actions/admins";
import AddAdminModal from "@/components/admins/AddAdminModal";
import { cn } from "@/lib/utils";

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    
    // Security Check: Ensure only super_admins can see this
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'super_admin') {
      router.push("/");
      return;
    }
    setCurrentUser(profile);

    const res = await getAdmins();
    if (res.data) setAdmins(res.data);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus admin ini? Tindakan ini tidak dapat dibatalkan.")) {
      setIsDeleting(id);
      const res = await deleteAdmin(id);
      if (res.success) {
        fetchAdmins();
      } else {
        alert(res.error || "Gagal menghapus admin");
      }
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-slate-900">Manajemen Admin</h1>
          <p className="text-slate-500 text-sm">Kelola akses staf administrasi (Eksklusif Super Admin).</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-sidebar text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-indigo-950/20"
        >
          <UserPlus className="h-5 w-5" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            Daftar Akun Terdaftar
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                 <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dibuat Oleh</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6">
                      <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic text-sm">
                    Belum ada admin lain yang terdaftar.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {admin.nama?.charAt(0) || <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{admin.nama}</p>
                          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        admin.role === 'super_admin' 
                          ? "bg-amber-50 text-amber-600 border-amber-100" 
                          : "bg-indigo-50 text-indigo-600 border-indigo-100"
                      )}>
                        <Shield className="h-3 w-3" />
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-semibold text-slate-600">{admin.creator?.nama || "Sistem"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        {new Date(admin.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {currentUser?.email !== admin.email && (
                        <button 
                          onClick={() => handleDelete(admin.id)}
                          disabled={isDeleting === admin.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          {isDeleting === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddAdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAdmins}
      />
    </div>
  );
}
