"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  Wallet,
  Plus,
  Trash2
} from "lucide-react";
import { Student } from "@/hooks/useStudents";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { cn } from "@/lib/utils";

const studentSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  prodi: z.string().min(1, "Prodi wajib diisi"),
  angkatan: z.string().min(1, "Angkatan wajib diisi"),
  no_hp: z.string().regex(/^[0-9]*$/, "Nomor HP hanya boleh berisi angka").optional().or(z.literal("")),
  billings: z.array(z.object({
    jenis: z.string().min(1, "Jenis wajib diisi"),
    nominal: z.preprocess((val) => Number(val), z.number().min(0)),
    jatuh_tempo: z.string().min(1, "Jatuh tempo wajib diisi"),
    status: z.enum(["LUNAS", "BELUM_LUNAS"]),
  })).optional(),
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      billings: [{
        jenis: "SPP Semester 1",
        nominal: 0,
        jatuh_tempo: defaultDueDateStr,
        status: "BELUM_LUNAS"
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "billings"
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
        billings: [{
          jenis: "SPP Semester 1",
          nominal: 0,
          jatuh_tempo: defaultDueDateStr,
          status: "BELUM_LUNAS"
        }]
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
          no_hp: values.no_hp || undefined
        });
      } else {
        res = await createStudent({
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: values.no_hp || undefined,
          billings: values.billings
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              {isEdit ? <Save className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </div>
            <h3 className="font-serif text-xl text-slate-800">
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 overflow-y-auto">
          {/* Section 1: Biodata */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              Biodata Mahasiswa
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">NIM</label>
                <input
                  {...register("nim")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: 041234567"
                />
                {errors.nim && <p className="text-xs text-status-rose ml-1 font-medium">{errors.nim.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register("no_hp")}
                    className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="081234567xxx"
                  />
                </div>
                {errors.no_hp && <p className="text-xs text-status-rose ml-1 font-medium">{errors.no_hp.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Nama Lengkap</label>
              <input
                {...register("nama")}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Nama Lengkap Sesuai Ijazah"
              />
              {errors.nama && <p className="text-xs text-status-rose ml-1 font-medium">{errors.nama.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Program Studi</label>
                <input
                  {...register("prodi")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Manajemen"
                />
                {errors.prodi && <p className="text-xs text-status-rose ml-1 font-medium">{errors.prodi.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Angkatan</label>
                <input
                  {...register("angkatan")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="2023.1"
                />
                {errors.angkatan && <p className="text-xs text-status-rose ml-1 font-medium">{errors.angkatan.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Keuangan (Only for new students) */}
          {!isEdit && (
            <div className="space-y-6 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" />
                  Daftar Tagihan Awal
                </h4>
                <button
                  type="button"
                  onClick={() => append({ jenis: "", nominal: 0, jatuh_tempo: defaultDueDateStr, status: "BELUM_LUNAS" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Tagihan
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between sm:hidden">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Tagihan #{index + 1}</span>
                       {fields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                      <div className="sm:col-span-5 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Jenis Tagihan</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            {...register(`billings.${index}.jenis` as const)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="Contoh: SPP Semester 1"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Nominal (Rp)</label>
                        <input
                          type="number"
                          {...register(`billings.${index}.nominal` as const)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                          placeholder="0"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Status</label>
                        <select
                          {...register(`billings.${index}.status` as const)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm appearance-none cursor-pointer font-semibold"
                        >
                          <option value="BELUM_LUNAS">Belum Lunas</option>
                          <option value="LUNAS">Lunas</option>
                        </select>
                      </div>

                      <div className="hidden sm:flex sm:col-span-1 justify-center mb-1">
                        {fields.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Hapus Tagihan"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Jatuh Tempo</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="date"
                          {...register(`billings.${index}.jatuh_tempo` as const)}
                          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all order-2 sm:order-1"
            >
              Batalkan
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-[2] px-10 py-4 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/10 order-1 sm:order-2",
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
