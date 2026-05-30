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
    nominal_deposit?: number;
    total_gabungan?: number;
    admin: string;
    metode?: string;
    bank_pengirim?: string;
    bank_tujuan?: string;
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
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
            .receipt-card { border: 2px solid #e2e8f0; padding: 20px; max-width: 650px; margin: 0 auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { font-family: 'Merriweather', serif; margin: 0; font-size: 20px; color: #0f172a; }
            .header p { margin: 3px 0 0; font-size: 10px; color: #64748b; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
            .info-item label { display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
            .info-item span { font-size: 13px; font-weight: 600; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: center; margin-bottom: 15px; }
            .amount-box label { display: block; font-size: 11px; margin-bottom: 4px; color: #64748b; }
            .amount-value { font-family: 'Merriweather', serif; font-size: 24px; color: #0f172a; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; }
            .signature { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 6px; font-size: 11px; font-weight: 600; }
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }

              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                visibility: hidden;
              }

              /* Tampilkan print-area */
              #print-area, #print-area * {
                visibility: visible !important;
              }

              /* Biarkan print-area menyesuaikan isi, jangan dipaksa 297mm */
              #print-area {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: max-content !important; 
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                z-index: 999999 !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }

              #print-area > div {
                padding: 8mm !important;
                box-sizing: border-box !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="print-area">
            ${printContent.innerHTML}
          </div>
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
    <div id="print-area" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-serif text-lg text-slate-800">Pratinjau Kwitansi</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div ref={printRef} className="receipt-card border-2 border-slate-100 p-6 rounded-xl bg-white shadow-inner">
            <div className="header text-center border-b-2 border-slate-900 pb-3 mb-4">
              <img src="https://lh3.googleusercontent.com/d/1_p7yRshg69PT2mo3pYqohb7Bs1PUi8HE" alt="Logo UT" className="w-16 h-16 mx-auto mb-2 object-contain" />
              <h1 className="font-serif text-xl text-slate-900">UNIVERSITAS TERBUKA</h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 mt-1 font-bold">SALATIGA LEARNING CENTER</p>
            </div>

            <div className="info-grid grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="info-item">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">No. Kwitansi</label>
                  <span className="block text-slate-800 font-semibold">{data.no_kwitansi}</span>
                </div>
                <div className="info-item">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</label>
                  <span className="block text-slate-800 font-semibold">{data.tanggal}</span>
                </div>
                <div className="info-item">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
                  <span className="block text-slate-800 font-semibold uppercase">{data.metode || "TUNAI"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="info-item">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Diterima Dari</label>
                  <span className="block text-slate-800 font-semibold">{data.nama} ({data.nim})</span>
                </div>
                <div className="info-item">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Untuk Pembayaran</label>
                  <span className="block text-slate-800 font-semibold">{data.untuk_pembayaran}</span>
                </div>
              </div>
            </div>

            <div className="info-grid grid grid-cols-2 gap-4 mb-4" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div className="info-item">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transfer Dari (Pengirim)</label>
                <span className="block text-slate-800 font-semibold text-xs">
                  {data.metode === "TRANSFER" || data.metode === "TRANSFER_MANUAL" ? (data.bank_pengirim || `${data.nama} (${data.nim})`) : "Cash"}
                </span>
              </div>
              <div className="info-item">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transfer Ke (Penerima)</label>
                <span className="block text-slate-800 font-semibold text-xs">
                  {data.metode === "TRANSFER" || data.metode === "TRANSFER_MANUAL" ? (data.bank_tujuan || "Detail Rekening Kampus") : "Tunai via Kasir / Admin"}
                </span>
              </div>
            </div>

            <div className="amount-box bg-slate-50 border border-slate-100 p-4 rounded-xl text-center mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 font-sans">Total Gabungan</label>
              <div className="font-serif text-2xl text-slate-900 font-tabular tracking-tighter">
                {formatRupiah(data.total_gabungan || data.jumlah)}
              </div>
            </div>

            {/* Breakdown Table */}
            {(data.nominal_deposit || 0) > 0 && (
              <div className="mb-4 px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl animate-in zoom-in-95">
                <table className="w-full text-[9px] uppercase font-bold tracking-widest text-slate-500">
                  <tbody>
                    <tr className="border-b border-indigo-100/50">
                      <td className="py-1">Pembayaran (Cash/Transfer)</td>
                      <td className="py-1 text-right text-slate-700">{formatRupiah(data.jumlah)}</td>
                    </tr>
                    <tr className="border-b border-indigo-100/50">
                      <td className="py-1">Potongan Saldo Deposit</td>
                      <td className="py-1 text-right text-indigo-600">{formatRupiah(data.nominal_deposit || 0)}</td>
                    </tr>
                    <tr className="text-slate-900">
                      <td className="py-1.5">TOTAL PENERIMAAN</td>
                      <td className="py-1.5 text-right text-sm font-serif">{formatRupiah(data.total_gabungan || data.jumlah)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="footer flex justify-between items-end mt-6">
              <div className="text-slate-400 text-[9px] italic space-y-0.5">
                <p>* Kwitansi ini adalah bukti pembayaran yang sah.</p>
                {(data.nominal_deposit || 0) > 0 && (
                  <p className="text-indigo-500 font-bold">** Pembayaran ini menggunakan saldo deposit sebesar {formatRupiah(data.nominal_deposit || 0)}</p>
                )}
              </div>
              <div className="signature text-center w-44">
                <div className="text-xs text-slate-950 mb-1 font-semibold">Salatiga, {data.tanggal}</div>
                <div className="text-[9px] text-slate-400 uppercase mb-10 italic font-bold">Penerima / Kasir,</div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ( {data.admin} )
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-white transition-all">
            Tutup
          </button>
          <button onClick={handlePrint} className="flex-1 py-2.5 px-4 bg-sidebar text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20">
            <Printer className="h-5 w-5" />
            Cetak Kwitansi
          </button>
        </div>
      </div>
    </div>
  );
}
