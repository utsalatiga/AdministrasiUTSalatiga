"use client";

import { useEffect, useState } from "react";
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
  Trash2,
  Info,
  Edit2,
  CheckCircle2,
  Clock,
  Receipt
} from "lucide-react";
import { Student } from "@/hooks/useStudents";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { getStudentFinancialSummary, getStudentDetails, updateBillAmount } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import { PRODI_UT, JENIS_TAGIHAN_DEFAULT } from "@/lib/constants";
import { useRouter } from "next/navigation";

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
  const [billCount, setBillCount] = useState<number | null>(null);
  const [customJenis, setCustomJenis] = useState<{[key: number]: boolean}>({});

  const [existingBills, setExistingBills] = useState<any[]>([]);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState<number>(0);
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();

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
        jenis: "Uang Semester",
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

  const fetchExistingBills = () => {
    if (student) {
      getStudentDetails(student.id).then(res => {
        if (res && res.bills) {
          setExistingBills(res.bills);
          setBillCount(res.bills.length);
        }
      });
    }
  };

  useEffect(() => {
    setCustomJenis({});
    if (student) {
      reset({
        nim: student.nim,
        nama: student.nama,
        prodi: student.prodi,
        angkatan: student.angkatan,
        no_hp: (student as any).no_hp || "",
        billings: [] // Initialize empty for edit mode
      });
      
      fetchExistingBills();
    } else {
      setBillCount(null);
      setExistingBills([]);
      reset({
        nim: "",
        nama: "",
        prodi: "",
        angkatan: "",
        no_hp: "",
        billings: [{
          jenis: "Uang Semester",
          nominal: 0,
          jatuh_tempo: defaultDueDateStr,
          status: "BELUM_LUNAS"
        }]
      });
    }
  }, [student, reset, isOpen, defaultDueDateStr]);

  if (!isOpen) return null;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const onSubmit = async (values: StudentFormValues) => {
    try {
      let res;
      if (isEdit && student) {
        res = await updateStudent(student.id, {
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: values.no_hp || undefined,
          new_billings: values.billings
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
          {/* Active Bills Summary (Edit mode only) */}
          {isEdit && billCount !== null && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-indigo-700">
                Mahasiswa ini memiliki <span className="text-indigo-900 font-bold">{billCount}</span> tagihan terdaftar.
              </p>
            </div>
          )}

          {/* Existing Bills List (Edit mode only) */}
          {isEdit && billCount !== null && (
            <div className="space-y-4 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 animate-in fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-indigo-100/80">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base text-indigo-950 font-bold">Daftar Tagihan Mahasiswa</h4>
                  <p className="text-xs font-medium text-indigo-700">
                    Total terdaftar: <span className="text-indigo-900 font-bold">{billCount}</span> tagihan. Berikut adalah tagihan yang belum lunas.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {existingBills
                  .filter((bill: any) => bill.status !== "LUNAS" && (bill.sisa_tagihan ?? bill.jumlah) > 0)
                  .map((bill: any) => {
                    const totalTerbayar = bill.jumlah - (bill.sisa_tagihan ?? bill.jumlah);
                    const isEditing = editingBillId === bill.id;

                    return (
                      <div key={bill.id} className="p-4 bg-white border border-indigo-100/80 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              bill.status === "MENCICIL" ? "bg-amber-100 text-status-amber" : "bg-rose-100 text-rose-600"
                            )}>
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{bill.jenis}</p>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{bill.kode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                              <span className="text-[10px] text-slate-400 font-medium">Terbayar: {formatRupiah(totalTerbayar)}</span>
                              <span className="text-[10px] text-slate-300">/</span>
                              <span className="text-[10px] text-slate-400 font-medium">Total: {formatRupiah(bill.jumlah)}</span>
                            </div>
                            <p className="font-serif text-lg text-slate-900 font-bold leading-tight">
                              {formatRupiah(bill.sisa_tagihan ?? bill.jumlah)}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sisa Tagihan</p>
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md mt-2",
                              (bill.sisa_tagihan ?? bill.jumlah) < bill.jumlah ? "bg-amber-50 text-status-amber" : "bg-rose-50 text-rose-600"
                            )}>
                              <span className="text-[9px] font-bold uppercase tracking-widest">
                                {(bill.sisa_tagihan ?? bill.jumlah) < bill.jumlah ? "DICICIL" : "BELUM LUNAS"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Edit Button & Form */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBillId(bill.id);
                                setNewAmount(bill.jumlah);
                                setUpdateError(null);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit Nominal
                            </button>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full justify-end bg-slate-50 p-3 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in">
                              <div className="w-full sm:w-auto flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Total Tagihan Baru (Rp)</label>
                                <input
                                  type="number"
                                  value={newAmount}
                                  min={totalTerbayar}
                                  onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {newAmount < totalTerbayar && (
                                  <p className="text-[10px] text-rose-500 font-medium">Nominal tidak boleh di bawah total yang sudah dibayar ({formatRupiah(totalTerbayar)}).</p>
                                )}
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingBillId(null)}
                                  disabled={isUpdatingBill}
                                  className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all disabled:opacity-50"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingBill || newAmount < totalTerbayar}
                                  onClick={async () => {
                                    setIsUpdatingBill(true);
                                    setUpdateError(null);
                                    const res = await updateBillAmount(bill.id, newAmount);
                                    if (res.success) {
                                      setEditingBillId(null);
                                      fetchExistingBills();
                                      router.refresh();
                                    } else {
                                      setUpdateError(res.error || "Gagal mengubah tagihan.");
                                    }
                                    setIsUpdatingBill(false);
                                  }}
                                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm shadow-indigo-500/20"
                                >
                                  {isUpdatingBill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {isEditing && updateError && (
                          <p className="text-xs text-rose-500 font-medium text-right">{updateError}</p>
                        )}
                      </div>
                    );
                  })}
                {existingBills.filter((bill: any) => bill.status !== "LUNAS" && (bill.sisa_tagihan ?? bill.jumlah) > 0).length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-2xl border border-indigo-100/60">Tidak ada tagihan tertunda / belum lunas untuk mahasiswa ini.</p>
                )}
              </div>
            </div>
          )}

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
                <select
                  {...register("prodi")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer font-semibold"
                >
                  <option value="">Pilih Program Studi</option>
                  {PRODI_UT.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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

          {/* Section 2: Keuangan / Tambah Tagihan Baru */}
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5" />
                {isEdit ? "Tambah Tagihan Baru" : "Daftar Tagihan Awal"}
              </h4>
              <button
                type="button"
                onClick={() => append({ jenis: isEdit ? "" : "Uang Semester", nominal: 0, jatuh_tempo: defaultDueDateStr, status: "BELUM_LUNAS" })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Tagihan
              </button>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between sm:hidden">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Tagihan #{index + 1}</span>
                       <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                      <div className="sm:col-span-5 space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Jenis Tagihan</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                          {customJenis[index] ? (
                            <div className="flex items-center gap-1">
                              <input
                                {...register(`billings.${index}.jenis` as const)}
                                autoFocus
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                placeholder="Ketik jenis tagihan custom..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomJenis(prev => ({...prev, [index]: false}));
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Batal Custom"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <select
                              {...register(`billings.${index}.jenis` as const)}
                              onChange={(e) => {
                                register(`billings.${index}.jenis`).onChange(e);
                                if (e.target.value === "Pembayaran Lain") {
                                  setCustomJenis(prev => ({...prev, [index]: true}));
                                }
                              }}
                              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm appearance-none cursor-pointer font-medium"
                            >
                              <option value="">Pilih Jenis Tagihan</option>
                              {JENIS_TAGIHAN_DEFAULT.map((j) => (
                                <option key={j} value={j}>{j}</option>
                              ))}
                            </select>
                          )}
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
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Hapus Tagihan"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
            ) : isEdit ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="text-sm text-slate-400 font-medium italic">Klik "+ Tambah Tagihan" untuk menambahkan tagihan baru untuk mahasiswa ini.</p>
              </div>
            ) : null}
          </div>

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
