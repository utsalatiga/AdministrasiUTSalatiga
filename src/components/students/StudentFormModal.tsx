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
    id: z.string().optional(),
    jenis: z.string().min(1, "Jenis wajib diisi"),
    nominal: z.preprocess((val) => Number(val), z.number().min(0)),
    status: z.enum(["LUNAS", "BELUM_LUNAS", "DICICIL"]),
  })).optional(),
  nomorBillingUtama: z.string().optional().or(z.literal("")),
  totalBillingUtama: z.preprocess((val) => Number(val) || 0, z.number().min(0)).optional(),
  nomorBillingTambahan: z.string().optional().or(z.literal("")),
  totalBillingTambahan: z.preprocess((val) => Number(val) || 0, z.number().min(0)).optional(),
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
  const router = useRouter();

  // Biodata & Financial States
  const [nik, setNik] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [noWa, setNoWa] = useState("");
  const [lokasiUjian, setLokasiUjian] = useState("");
  const [totalDeposit, setTotalDeposit] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      billings: [{
        jenis: "Uang Semester",
        nominal: 0,
        status: "BELUM_LUNAS"
      }],
      nomorBillingUtama: "",
      totalBillingUtama: 0,
      nomorBillingTambahan: "",
      totalBillingTambahan: 0,
    }
  });

  const watchedBillings = watch("billings");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "billings"
  });

  const handleDepositChange = (val: number) => {
    setTotalDeposit(val);
    
    const currentBillings = watchedBillings || [];
    if (currentBillings.length === 0) return;

    let remainingDeposit = val;
    const updatedBillings = currentBillings.map((bill, index) => {
      let nominal = bill.nominal || 0;
      if (index === 0 && (nominal === 0 || isNaN(nominal))) {
        nominal = val;
      }
      
      let status: "LUNAS" | "BELUM_LUNAS" | "DICICIL" = "BELUM_LUNAS";
      if (nominal > 0 && remainingDeposit >= nominal) {
        status = "LUNAS";
        remainingDeposit -= nominal;
      }

      return {
        ...bill,
        nominal,
        status
      };
    });

    setValue("billings", updatedBillings);
  };

  useEffect(() => {
    if (isOpen && student) {
      reset({
        nim: student.nim,
        nama: student.nama,
        prodi: student.prodi,
        angkatan: student.angkatan,
        no_hp: (student as any).no_hp || "",
        billings: []
      });
      
      // Initialize states from student
      setNik((student as any).nik || "");
      setTanggalLahir((student as any).tanggal_lahir || (student as any).tanggalLahir || "");
      setNamaIbu((student as any).nama_ibu || (student as any).namaIbu || "");
      setNoWa((student as any).no_hp || (student as any).noWa || "");
      setLokasiUjian((student as any).lokasi_ujian || (student as any).lokasiUjian || "");
      setTotalDeposit((student as any).deposit || (student as any).totalDeposit || 0);

      // Fetch existing bills and set to form array
      getStudentDetails(student.id).then(res => {
        if (res && res.bills) {
          const loadedBillings = res.bills.map((bill: any) => ({
            id: bill.id,
            jenis: bill.jenis,
            nominal: bill.jumlah,
            status: (bill.status === "LUNAS" 
              ? "LUNAS" 
              : (bill.status === "DICICIL" || bill.status === "MENCICIL" ? "DICICIL" : "BELUM_LUNAS")) as "LUNAS" | "BELUM_LUNAS" | "DICICIL"
          }));

          const utamaBills = (res.bills as any[]).filter((bill: any) => bill.tipe_billing === "utama");
          const tambahanBills = (res.bills as any[]).filter((bill: any) => bill.tipe_billing === "tambahan");

          const nomorBillingUtama = utamaBills[0]?.nomor_billing || "";
          const totalBillingUtama = utamaBills.reduce((acc: number, curr: any) => acc + (curr.jumlah || 0), 0);
          const nomorBillingTambahan = tambahanBills[0]?.nomor_billing || "";
          const totalBillingTambahan = tambahanBills.reduce((acc: number, curr: any) => acc + (curr.jumlah || 0), 0);

          reset({
            nim: student.nim,
            nama: student.nama,
            prodi: student.prodi,
            angkatan: student.angkatan,
            no_hp: (student as any).no_hp || "",
            billings: loadedBillings.length > 0 ? loadedBillings : [{
              jenis: "Uang Semester",
              nominal: 0,
              status: "BELUM_LUNAS"
            }],
            nomorBillingUtama,
            totalBillingUtama,
            nomorBillingTambahan,
            totalBillingTambahan
          });
        }
      });
    } else {
      reset({
        nim: "",
        nama: "",
        prodi: "",
        angkatan: "",
        no_hp: "",
        billings: [{
          jenis: "Uang Semester",
          nominal: 0,
          status: "BELUM_LUNAS"
        }],
        nomorBillingUtama: "",
        totalBillingUtama: 0,
        nomorBillingTambahan: "",
        totalBillingTambahan: 0
      });

      setNik("");
      setTanggalLahir("");
      setNamaIbu("");
      setNoWa("");
      setLokasiUjian("");
      setTotalDeposit(0);
    }
  }, [student, reset, isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const formatWhatsApp = (num: string): string => {
    let cleaned = num.trim();
    if (cleaned.startsWith("0")) {
      cleaned = "+62" + cleaned.slice(1);
    } else if (cleaned.startsWith("62")) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  };

  const onSubmit = async (values: StudentFormValues) => {
    try {
      const formattedNoWa = formatWhatsApp(noWa);
      setNoWa(formattedNoWa);
      
      // Dynamically map statuses based on deposit distribution
      let remainingDeposit = totalDeposit;
      const formattedBillings = values.billings?.map((bill, index) => {
        let nominal = bill.nominal || 0;
        if (index === 0 && (nominal === 0 || isNaN(nominal))) {
          nominal = totalDeposit;
        }
        
        let status: "LUNAS" | "BELUM_LUNAS" = "BELUM_LUNAS";
        if (nominal > 0 && remainingDeposit >= nominal) {
          status = "LUNAS";
          remainingDeposit -= nominal;
        }
        
        return {
          ...bill,
          nominal,
          status
        };
      }) || [];

      let res;
      if (isEdit && student) {
        res = await updateStudent(student.id, {
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: formattedNoWa || values.no_hp || undefined,
          billings: formattedBillings,
          nik,
          tanggalLahir,
          namaIbu,
          noWa: formattedNoWa,
          lokasiUjian,
          totalDeposit,
          nomorBillingUtama: values.nomorBillingUtama,
          totalBillingUtama: values.totalBillingUtama,
          nomorBillingTambahan: values.nomorBillingTambahan,
          totalBillingTambahan: values.totalBillingTambahan
        });
      } else {
        res = await createStudent({
          nim: values.nim,
          nama: values.nama,
          prodi: values.prodi,
          angkatan: values.angkatan,
          no_hp: formattedNoWa || values.no_hp || undefined,
          billings: formattedBillings,
          nik,
          tanggalLahir,
          namaIbu,
          noWa: formattedNoWa,
          lokasiUjian,
          totalDeposit,
          nomorBillingUtama: values.nomorBillingUtama,
          totalBillingUtama: values.totalBillingUtama,
          nomorBillingTambahan: values.nomorBillingTambahan,
          totalBillingTambahan: values.totalBillingTambahan
        });
      }
      
      if (res.success) {
        onSuccess();
        handleClose();
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
            onClick={handleClose}
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
              Biodata Mahasiswa (Section 1)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NIM */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">NIM</label>
                <input
                  {...register("nim")}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 9);
                    setValue("nim", val, { shouldValidate: true });
                  }}
                  maxLength={9}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: 041234567"
                />
                {errors.nim && <p className="text-xs text-status-rose ml-1 font-medium">{errors.nim.message}</p>}
              </div>

              {/* NIK */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">NIK</label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setNik(val);
                  }}
                  maxLength={16}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Nomor Induk Kependudukan (16 digit)"
                />
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nama Lengkap</label>
                <input
                  {...register("nama")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Nama Lengkap Sesuai Ijazah"
                />
                {errors.nama && <p className="text-xs text-status-rose ml-1 font-medium">{errors.nama.message}</p>}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Nama Ibu Kandung */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nama Ibu Kandung</label>
                <input
                  type="text"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Nama Ibu Kandung"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="081234567xxx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Akademik & Zonasi */}
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Akademik & Zonasi (Section 2)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Program Studi */}
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

              {/* Angkatan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Angkatan</label>
                <input
                  {...register("angkatan")}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: 2023.1"
                />
                {errors.angkatan && <p className="text-xs text-status-rose ml-1 font-medium">{errors.angkatan.message}</p>}
              </div>

              {/* Lokasi Ujian */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Lokasi Ujian</label>
                <input
                  type="text"
                  value={lokasiUjian}
                  onChange={(e) => setLokasiUjian(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Contoh: UPBJJ UT Salatiga"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Integrasi Keuangan & Billing */}
          <div className="space-y-6 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Integrasi Keuangan & Billing (Section 3)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Deposit */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Total Deposit (Rp)</label>
                <input
                  type="number"
                  value={totalDeposit}
                  onChange={(e) => handleDepositChange(Number(e.target.value) || 0)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                  placeholder="0"
                />
              </div>

              {/* Jumlah Tagihan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Jumlah Tagihan (Rp)</label>
                <input
                  type="number"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                  placeholder="0"
                  value={
                    watchedBillings?.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0) || 0
                  }
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 ml-1">Daftar Tagihan</label>
                <button
                  type="button"
                  onClick={() => append({
                    jenis: "Uang Semester",
                    nominal: 0,
                    status: "BELUM_LUNAS"
                  })}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Tagihan
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  let remainingDeposit = totalDeposit;
                  for (let i = 0; i < index; i++) {
                    remainingDeposit -= watchedBillings?.[i]?.nominal || 0;
                  }
                  const nominal = watchedBillings?.[index]?.nominal || 0;
                  const isBillLunas = nominal > 0 && remainingDeposit >= nominal;

                  return (
                    <div key={field.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Tagihan #{index + 1}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kategori Tagihan */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Kategori</label>
                          <select
                            {...register(`billings.${index}.jenis` as const)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
                          >
                            {JENIS_TAGIHAN_DEFAULT.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>

                        {/* Nominal Tagihan */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Nominal (Rp)</label>
                          <input
                            {...register(`billings.${index}.nominal` as const)}
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-[11px] pt-1 gap-2">
                        <span className="text-slate-400 font-semibold">Status Tagihan:</span>
                        <select
                          {...register(`billings.${index}.status` as const)}
                          className={cn(
                            "px-3 py-1 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold uppercase tracking-wider transition-all",
                            watchedBillings?.[index]?.status === "LUNAS" && "text-emerald-600 border-emerald-200 bg-emerald-50/50",
                            watchedBillings?.[index]?.status === "DICICIL" && "text-amber-600 border-amber-200 bg-amber-50/50",
                            watchedBillings?.[index]?.status === "BELUM_LUNAS" && "text-slate-600 border-slate-200 bg-slate-50/50"
                          )}
                        >
                          <option value="BELUM_LUNAS">Belum Lunas</option>
                          <option value="DICICIL">Dicicil</option>
                          <option value="LUNAS">Lunas</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Menu Billing Bank */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700 ml-1">Menu Billing Bank</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom A: Billing Utama */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-3">
                  <span className="text-xs font-bold text-primary">Billing Utama (Semester)</span>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Nomor Billing Utama</label>
                    <input
                      {...register("nomorBillingUtama")}
                      type="text"
                      placeholder="Contoh: 8234567890"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Total Billing Utama (Rp)</label>
                    <input
                      {...register("totalBillingUtama")}
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Kolom B: Billing Tambahan */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-3">
                  <span className="text-xs font-bold text-indigo-600">Billing Tambahan (Lain-lain)</span>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Nomor Billing Tambahan</label>
                    <input
                      {...register("nomorBillingTambahan")}
                      type="text"
                      placeholder="Contoh: 8234567890"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Total Billing Tambahan (Rp)</label>
                    <input
                      {...register("totalBillingTambahan")}
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={handleClose}
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
