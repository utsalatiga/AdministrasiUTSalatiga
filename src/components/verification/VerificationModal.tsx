"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Maximize2, 
  Loader2,
  Calendar,
  Receipt,
  Upload,
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

  // Reset state when modal closes or data changes
  useEffect(() => {
    if (!isOpen || !data?.id) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsFullscreen(false);
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, data?.id]);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
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
          className="relative bg-white w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh]"
        >
          {/* Left: Image Proof / Upload Zone */}
          <div className="flex-1 bg-slate-50 p-4 sm:p-6 relative group overflow-hidden border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center min-h-[300px] md:min-h-[450px]">
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
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
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
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-white transition-all w-full h-full group"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 group-hover:text-primary" />
                </div>
                <h4 className="text-slate-800 font-bold mb-2 text-sm sm:text-base">Unggah Bukti Transfer</h4>
                <p className="text-slate-400 text-xs text-center max-w-[200px]">
                  Klik untuk melengkapi verifikasi
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
          <div className="w-full md:w-[400px] flex flex-col bg-white overflow-y-auto">
            <div className="p-6 sm:p-8 flex-1 space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-slate-800 leading-tight">Verifikasi Data</h3>
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
                      <span className="text-slate-400 flex items-center gap-2 text-xs"><Receipt className="h-3.5 w-3.5" /> Jenis</span>
                      <span className="font-semibold text-slate-700 text-xs">{data.tagihan.jenis}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs"><Calendar className="h-3.5 w-3.5" /> Tanggal</span>
                      <span className="font-semibold text-slate-700 text-xs">{new Date(data.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal Pembayaran</span>
                      <span className="font-serif text-2xl sm:text-3xl text-primary font-tabular tracking-tighter">
                        {formatRupiah(data.jumlah_bayar)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3 sm:gap-4 sticky bottom-0">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 h-12 sm:py-4 px-4 bg-white border border-slate-200 text-status-rose rounded-2xl font-bold hover:bg-rose-50 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-sm"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 h-12 sm:py-4 px-4 bg-status-emerald text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 text-xs sm:text-sm"
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
