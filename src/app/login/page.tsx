"use client";

import { Lock, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-950/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo or Brand */}
        <div className="text-center mb-8">
          <img 
            src="https://lh3.googleusercontent.com/d/1_p7yRshg69PT2mo3pYqohb7Bs1PUi8HE" 
            alt="Logo UT" 
            className="w-20 h-20 mx-auto mb-3 object-contain opacity-80" 
          />
          <h2 className="text-lg font-bold tracking-wider text-slate-400 uppercase">UT Salatiga</h2>
        </div>

        {/* Clean & Minimalist Box Layout Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center text-center">
          
          {/* Lock / Cog Icon Wrapper with animation */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Outer glowing ring */}
            <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center relative shadow-inner">
              <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
              <Settings className="w-4 h-4 text-slate-500 absolute -bottom-1 -right-1 animate-[spin_10s_linear_infinite]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wide uppercase mb-3">
            PEMBERITAHUAN SISTEM
          </h1>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-8 tracking-wide uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            Status: Temporary Lock / Maintenance
          </div>

          {/* Content Body */}
          <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed text-justify md:text-center font-normal">
            <p>
              Akses platform ditutup sementara untuk peningkatan performa infrastruktur keamanan data dan sinkronisasi server utama.
            </p>
            <p>
              Layanan akan diaktifkan kembali secara penuh setelah seluruh proses validasi administrasi dan standardisasi sistem selesai diverifikasi.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-slate-800/80 my-8" />

          {/* Footer */}
          <div className="text-xs md:text-sm text-slate-400 space-y-1">
            <p className="font-medium">Terima kasih atas kerja samanya.</p>
            <p className="text-slate-500 font-semibold">— Tim Teknis Digipro</p>
          </div>

        </div>
      </div>
    </div>
  );
}
