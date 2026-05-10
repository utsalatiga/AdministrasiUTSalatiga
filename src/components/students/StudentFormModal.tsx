"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  X, 
  Loader2, 
  UserPlus, 
  Save, 
  Phone, 
  CreditCard,
  Calendar,
  Wallet
} from "lucide-react";
import { Student } from "@/hooks/useStudents";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { cn } from "@/lib/utils";

const studentSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  prodi: z.string().min(1, "Prodi wajib diisi"),
  angkatan: z.string().min(1, "Angkatan wajib diisi"),
  no_hp: z.string().regex(/^[0-9]*$/, "Nomor HP hanya boleh berisi angka").optional(),
  // Billing fields (optional, only for creation)
  billing_jenis: z.string().optional(),
  billing_nominal: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
  billing_jatuh_tempo: z.string().optional(),
  billing_status: z.enum(["LUNAS", "BELUM_LUNAS"]).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
}

export default function StudentFormModal({ isOpen, onClose, onSuccess, student }: StudentFormModalProps) {
  const isEdit = !!student;

  const defaultDueDate = new Date();
  defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);
  const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      billing_status: "BELUM_LUNAS",
      billing_jatuh_tempo: defaultDueDateStr,
      billing_nominal: 0
    }
  });

  useEffect(() => {
    if (student) {
      reset({
        nim: student.nim,
        nama: student.nama,
        prodi: student.prodi,
        angkatan: student.angkatan,
        no_hp: (student as any).no_hp || "",
      });
    } else {
      reset({
        nim: "",
        nama: "",
        prodi: "",
        angkatan: "",
        no_hp: "",
        billing_jenis: "SPP Semester 1",
        billing_nominal: 0,
        billing_jatuh_tempo: defaultDueDateStr,
        billing_status: "BELUM_LUNAS"
      });
    }
  }, [student, reset, isOpen, defaultDueDateStr]);

  if (!isOpen) return null;

  const onSubmit = async (values: StudentFormValues) => {
    try {
      let res;
      if (isEdit && student) {
        res = await updateStudent(student.id, {
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: values.no_hp
        });
      } else {
        res = await createStudent({
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: values.no_hp,
          billing: values.billing_nominal && values.billing_nominal > 0 ? {
            jenis: values.billing_jenis || "Tagihan Awal",
            nominal: values.billing_nominal,
            jatuh_tempo: values.billing_jatuh_tempo || defaultDueDateStr,
            status: values.billing_status || "BELUM_LUNAS"
          } : undefined
        });
      }
      
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              {isEdit ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-slate-800">
              {isEdit ? "Edit Data Mahasiswa" : "Registrasi Mahasiswa Baru"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Section 1: Biodata */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <UserPlus className="h-3 w-3" />
              Biodata Mahasiswa
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">NIM</label>
                <input
                  {...register("nim")}
                  className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: 041234567"
                />
                {errors.nim && <p className="text-xs text-status-rose ml-1">{errors.nim.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register("no_hp")}
                    className="w-full pl-11 pr-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="081234567xxx"
                  />
                </div>
                {errors.no_hp && <p className="text-xs text-status-rose ml-1">{errors.no_hp.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Nama Lengkap</label>
              <input
                {...register("nama")}
                className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Nama Lengkap Sesuai Ijazah"
              />
              {errors.nama && <p className="text-xs text-status-rose ml-1">{errors.nama.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Program Studi</label>
                <input
                  {...register("prodi")}
                  className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Manajemen"
                />
                {errors.prodi && <p className="text-xs text-status-rose ml-1">{errors.prodi.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Angkatan</label>
                <input
                  {...register("angkatan")}
                  className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="2023.1"
                />
                {errors.angkatan && <p className="text-xs text-status-rose ml-1">{errors.angkatan.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Keuangan (Only for new students) */}
          {!isEdit && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Wallet className="h-3 w-3" />
                Informasi Tagihan Awal
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Jenis Tagihan</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("billing_jenis")}
                      className="w-full pl-11 pr-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Contoh: SPP Semester 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Nominal (Rp)</label>
                    <input
                      type="number"
                      {...register("billing_nominal")}
                      className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Status Awal</label>
                    <select
                      {...register("billing_status")}
                      className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer font-semibold"
                    >
                      <option value="BELUM_LUNAS">Belum Lunas</option>
                      <option value="LUNAS">Lunas (Auto-Sync)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-slate-50 sticky bottom-0 bg-white">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-12 sm:h-auto px-4 py-3 sm:py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all order-2 sm:order-1"
            >
              Batalkan
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-2 h-12 sm:h-auto px-8 py-3 sm:py-4 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/10 order-1 sm:order-2",
                isEdit ? "bg-sidebar hover:bg-slate-800" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isEdit ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {isEdit ? "Simpan Perubahan" : "Daftarkan Mahasiswa"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
