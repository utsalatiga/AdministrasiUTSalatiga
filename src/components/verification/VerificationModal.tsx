"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Maximize2, 
  Loader2,
  ExternalLink,
  Calendar,
  User,
  Receipt,
  Upload,
  Image as ImageIcon,
  RotateCcw
} from "lucide-react";
import { verifyPayment, rejectPayment } from "@/lib/actions/verification";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSuccess: () => void;
}

export default function VerificationModal({ isOpen, onClose, data, onSuccess }: VerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !data) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    
    let formData = undefined;
    if (selectedFile) {
      formData = new FormData();
      formData.append("file", selectedFile);
    }

    const result = await verifyPayment(data.id, data.tagihan.id, formData);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    const reason = prompt("Alasan penolakan (opsional):");
    setIsSubmitting(true);
    const result = await rejectPayment(data.id, reason || undefined);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const activeImage = previewUrl || data.bukti_url;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
        >
          {/* Left: Image Proof / Upload Zone */}
          <div className="flex-1 bg-slate-50 p-6 relative group overflow-hidden border-r border-slate-100 flex items-center justify-center min-h-[450px]">
            {activeImage ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img 
                  src={activeImage} 
                  alt="Bukti Transfer" 
                  className={cn(
                    "w-full h-full object-contain rounded-xl transition-all duration-500",
                    isFullscreen ? "scale-110" : "scale-100"
                  )}
                />
                
                {/* Image Actions Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-primary transition-all"
                    title="Fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-amber-600 transition-all"
                    title="Ganti Bukti"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <a 
                    href={activeImage} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-primary transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {previewUrl && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Preview Unggahan Baru
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-white transition-all w-full h-full group"
              >
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-primary" />
                </div>
                <h4 className="text-slate-800 font-bold mb-2">Unggah Bukti Transfer</h4>
                <p className="text-slate-400 text-sm text-center max-w-[200px]">
                  Klik atau seret gambar bukti transfer untuk melengkapi verifikasi
                </p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Right: Details & Actions */}
          <div className="w-full md:w-[400px] flex flex-col bg-white">
            <div className="p-8 flex-1 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-slate-800 leading-tight">Verifikasi Data</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Review Pembayaran</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Mahasiswa</p>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {data.tagihan.mahasiswa.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{data.tagihan.mahasiswa.nama}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{data.tagihan.mahasiswa.nim}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Rincian Transaksi</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Receipt className="h-4 w-4" /> Jenis</span>
                      <span className="font-semibold text-slate-700">{data.tagihan.jenis}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Calendar className="h-4 w-4" /> Tanggal Transaksi</span>
                      <span className="font-semibold text-slate-700">{new Date(data.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal Pembayaran</span>
                      <span className="font-serif text-3xl text-primary font-tabular tracking-tighter">
                        {formatRupiah(data.jumlah_bayar)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-4 px-4 bg-white border border-slate-200 text-status-rose rounded-2xl font-bold hover:bg-rose-50 transition-all disabled:opacity-50 text-sm"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-4 px-4 bg-status-emerald text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Setujui
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
