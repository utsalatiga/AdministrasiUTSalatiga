"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";

interface ReceiptProps {
  data: {
    no_kwitansi: string;
    tanggal: string;
    nama: string;
    nim: string;
    untuk_pembayaran: string;
    jumlah: number;
    admin: string;
  };
  onClose: () => void;
}

export default function ReceiptTemplate({ data, onClose }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowPrint = window.open("", "", "width=800,height=600");
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Kwitansi - ${data.no_kwitansi}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Merriweather:wght@700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .receipt-card { border: 2px solid #e2e8f0; padding: 30px; max-width: 700px; margin: 0 auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { font-family: 'Merriweather', serif; margin: 0; font-size: 24px; color: #0f172a; }
            .header p { margin: 5px 0 0; font-size: 12px; color: #64748b; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item label { display: block; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
            .info-item span { font-size: 14px; font-weight: 600; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; text-align: center; margin-bottom: 30px; }
            .amount-box label { display: block; font-size: 12px; margin-bottom: 8px; color: #64748b; }
            .amount-value { font-family: 'Merriweather', serif; font-size: 32px; color: #0f172a; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
            .signature { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #0f172a; margin-top: 60px; padding-top: 8px; font-size: 12px; font-weight: 600; }
            @media print {
              body { padding: 0; }
              .receipt-card { border: none; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-serif text-lg text-slate-800">Pratinjau Kwitansi</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto max-h-[70vh]">
          <div ref={printRef} className="receipt-card border-2 border-slate-100 p-8 rounded-xl bg-white shadow-inner">
            <div className="header text-center border-b-2 border-slate-900 pb-6 mb-8">
              <h1 className="font-serif text-2xl text-slate-900">UNIVERSITAS TERBUKA</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mt-1 font-bold">SALATIGA LEARNING CENTER</p>
            </div>

            <div className="info-grid grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="info-item">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Kwitansi</label>
                  <span className="block text-slate-800 font-semibold">{data.no_kwitansi}</span>
                </div>
                <div className="info-item">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</label>
                  <span className="block text-slate-800 font-semibold">{data.tanggal}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="info-item">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diterima Dari</label>
                  <span className="block text-slate-800 font-semibold">{data.nama} ({data.nim})</span>
                </div>
                <div className="info-item">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Untuk Pembayaran</label>
                  <span className="block text-slate-800 font-semibold">{data.untuk_pembayaran}</span>
                </div>
              </div>
            </div>

            <div className="amount-box bg-slate-50 border border-slate-100 p-8 rounded-2xl text-center mb-10">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Pembayaran</label>
              <div className="font-serif text-4xl text-slate-900 font-tabular tracking-tighter">
                {formatRupiah(data.jumlah)}
              </div>
            </div>

            <div className="footer flex justify-between items-end mt-12">
              <div className="text-slate-400 text-[10px] italic">
                * Kwitansi ini adalah bukti pembayaran yang sah.
              </div>
              <div className="signature text-center w-48">
                <div className="text-[10px] text-slate-400 uppercase mb-16">Petugas Administrasi</div>
                <div className="border-t border-slate-900 pt-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {data.admin}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-white transition-all">
            Tutup
          </button>
          <button onClick={handlePrint} className="flex-1 py-3 px-4 bg-sidebar text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20">
            <Printer className="h-5 w-5" />
            Cetak Kwitansi
          </button>
        </div>
      </div>
    </div>
  );
}
