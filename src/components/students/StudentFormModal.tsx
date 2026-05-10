"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, UserPlus, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Student } from "@/hooks/useStudents";

const studentSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  prodi: z.string().min(1, "Prodi wajib diisi"),
  angkatan: z.string().min(1, "Angkatan wajib diisi"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
}

export default function StudentFormModal({ isOpen, onClose, onSuccess, student }: StudentFormModalProps) {
  const supabase = createClient();
  const isEdit = !!student;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
  });

  useEffect(() => {
    if (student) {
      reset({
        nim: student.nim,
        nama: student.nama,
        prodi: student.prodi,
        angkatan: student.angkatan,
      });
    } else {
      reset({
        nim: "",
        nama: "",
        prodi: "",
        angkatan: "",
      });
    }
  }, [student, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (values: StudentFormValues) => {
    try {
      if (isEdit && student) {
        const { error } = await supabase
          .from("mahasiswa")
          .update(values)
          .eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mahasiswa")
          .insert([values]);
        if (error) throw error;
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {isEdit ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <h3 className="font-serif text-xl text-slate-800">
              {isEdit ? "Edit Data Mahasiswa" : "Tambah Mahasiswa Baru"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">NIM</label>
            <input
              {...register("nim")}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Contoh: 041234567"
            />
            {errors.nim && <p className="text-xs text-status-rose ml-1">{errors.nim.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Nama Lengkap</label>
            <input
              {...register("nama")}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Nama Mahasiswa"
            />
            {errors.nama && <p className="text-xs text-status-rose ml-1">{errors.nama.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Program Studi</label>
              <input
                {...register("prodi")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Manajemen"
              />
              {errors.prodi && <p className="text-xs text-status-rose ml-1">{errors.prodi.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Angkatan</label>
              <input
                {...register("angkatan")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="2023.1"
              />
              {errors.angkatan && <p className="text-xs text-status-rose ml-1">{errors.angkatan.message}</p>}
            </div>
          </div>

          <div className="mt-8 flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-sidebar text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isEdit ? "Update Data" : "Simpan Mahasiswa"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
