"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { terbilang } from "@/lib/utils/terbilang";

interface OfficialReceiptProps {
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

export default function OfficialReceipt({ data, onClose }: OfficialReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const amountInWords = terbilang(data.jumlah) + " rupiah";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static official-receipt-container">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Modal Header - Hidden on Print */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <h3 className="font-serif text-lg text-slate-800">Cetak Kwitansi Resmi</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-10 print:p-0 overflow-y-auto max-h-[80vh] print:max-h-none">
          <div ref={printRef} className="official-receipt relative border-2 border-slate-900 p-12 print:border-none print:p-4">
            {/* Institution Header */}
            <div className="flex items-start justify-between border-b-4 border-slate-900 pb-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-sidebar rounded-full flex items-center justify-center text-white font-serif text-2xl font-bold">UT</div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-slate-900 uppercase leading-none">UNIVERSITAS TERBUKA</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">SALATIGA LEARNING CENTER</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Jl. Tentara Pelajar No. 12, Salatiga, Jawa Tengah</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Kwitansi No. / ID</div>
                  <div className="font-serif text-lg font-bold text-slate-900 leading-none">{data.no_kwitansi}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tanggal</div>
                  <div className="font-serif text-xs font-bold text-slate-800 leading-none">{data.tanggal}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metode</div>
                  <span className="inline-block text-[10px] font-sans font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider leading-none">
                    {data.metode || "TUNAI"}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="space-y-6 font-serif">
              <div className="flex border-b border-slate-200 pb-2">
                <div className="w-48 text-sm text-slate-500 italic">Sudah Terima Dari</div>
                <div className="flex-1 text-base font-bold text-slate-900 uppercase">{data.nama} ({data.nim})</div>
              </div>
              <div className="flex border-b border-slate-200 pb-2">
                <div className="w-48 text-sm text-slate-500 italic">Transfer Dari (Pengirim)</div>
                <div className="flex-1 text-sm font-semibold text-slate-850">
                  {data.metode === "TRANSFER" || data.metode === "TRANSFER_MANUAL" ? (data.bank_pengirim || `${data.nama} (${data.nim})`) : "Cash"}
                </div>
              </div>
              <div className="flex border-b border-slate-200 pb-2">
                <div className="w-48 text-sm text-slate-500 italic">Transfer Ke (Penerima)</div>
                <div className="flex-1 text-sm font-semibold text-slate-850">
                  {data.metode === "TRANSFER" || data.metode === "TRANSFER_MANUAL" ? (data.bank_tujuan || "Detail Rekening Kampus") : "Tunai via Kasir / Admin"}
                </div>
              </div>
              <div className="flex border-b border-slate-200 pb-2">
                <div className="w-48 text-sm text-slate-500 italic">Banyaknya Uang</div>
                <div className="flex-1 text-base font-bold text-slate-900 capitalize"># {amountInWords} #</div>
              </div>
              <div className="flex border-b border-slate-200 pb-2">
                <div className="w-48 text-sm text-slate-500 italic">Untuk Pembayaran</div>
                <div className="flex-1 text-base font-bold text-slate-900">{data.untuk_pembayaran}</div>
              </div>
            </div>

            {/* Amount Box */}
            <div className="mt-12 flex justify-between items-end">
              <div className="bg-slate-900 text-white p-6 rounded-lg min-w-[250px]">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Gabungan (IDR)</div>
                <div className="text-3xl font-bold font-tabular">{formatRupiah(data.total_gabungan || data.jumlah)}</div>
              </div>

              {/* Breakdown Table for Printing */}
              {(data.nominal_deposit || 0) > 0 && (
                <div className="flex-1 max-w-[300px] ml-8">
                   <table className="w-full text-[10px] uppercase font-bold tracking-widest text-slate-500 border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1">Cash / Transfer</td>
                        <td className="py-1 text-right text-slate-900">{formatRupiah(data.jumlah)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1">Saldo Deposit</td>
                        <td className="py-1 text-right text-indigo-600">{formatRupiah(data.nominal_deposit || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="text-center w-64">
                <div className="text-sm text-slate-900 mb-2">Salatiga, {data.tanggal}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-16 italic">Penerima,</div>
                <div className="border-b-2 border-slate-900 pb-1 text-sm font-bold text-slate-900 uppercase">
                  {data.admin}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Admin Keuangan</div>
              </div>
            </div>

            {/* Watermark/Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <div className="space-y-1">
                <span>Bukti pembayaran sah secara sistem</span>
                {(data.nominal_deposit || 0) > 0 && (
                  <p className="text-indigo-500 font-bold lowercase italic">* Pembayaran ini mencakup penggunaan deposit {formatRupiah(data.nominal_deposit || 0)}</p>
                )}
              </div>
              <span className="italic">Powered by Administrasi UT Salatiga</span>
            </div>
          </div>
        </div>

        {/* Modal Footer - Hidden on Print */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4 print:hidden">
          <button onClick={onClose} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-white transition-all">
            Batalkan
          </button>
          <button onClick={handlePrint} className="flex-1 py-3 px-4 bg-sidebar text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20">
            <Printer className="h-5 w-5" />
            Cetak Sekarang
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* HIDE EVERYTHING */
          body * {
            visibility: hidden !important;
          }
          
          /* SHOW ONLY RECEIPT AREA */
          .official-receipt, 
          .official-receipt * {
            visibility: visible !important;
          }
          
          /* FIX POSITIONING AND PREVENT EXTRA PAGES */
          .official-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            border: none !important;
            background: white !important;
            z-index: 9999 !important;
          }

          /* ABSOLUTELY HIDE UI ELEMENTS TO PREVENT HEIGHT CLUTTER */
          nav, header, footer, aside, .sidebar, .bottom-nav, button, .print-hidden, .no-print, [role="dialog"]:not(.official-receipt-container) {
            display: none !important;
          }

          /* PAGE SETTINGS */
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* FORCE NO PAGE BREAKS INSIDE RECEIPT */
          .official-receipt {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
