import { 
  ArrowUpRight, 
  Users, 
  Wallet, 
  Clock, 
  AlertCircle 
} from "lucide-react";

const stats = [
  {
    title: "Total Pemasukan",
    value: "Rp 1.250.000.000",
    description: "Bulan ini",
    icon: Wallet,
    color: "bg-status-emerald",
  },
  {
    title: "Total Tunggakan",
    value: "Rp 450.200.000",
    description: "420 Mahasiswa",
    icon: AlertCircle,
    color: "bg-status-rose",
  },
  {
    title: "Pembayaran Pending",
    value: "Rp 85.000.000",
    description: "12 Transaksi",
    icon: Clock,
    color: "bg-status-amber",
  },
  {
    title: "Total Mahasiswa",
    value: "2.450",
    description: "Aktif Semester Ini",
    icon: Users,
    color: "bg-primary",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Ringkasan aktivitas keuangan mahasiswa hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.title}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300"
          >
            {/* Gradient Top Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${stat.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-status-emerald bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold">
                <ArrowUpRight className="h-3 w-3" />
                <span>12%</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </p>
              <h3 className="font-serif text-2xl text-slate-800 font-tabular">
                {stat.value}
              </h3>
              <p className="text-[11px] text-slate-400 mt-2">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 h-[400px] flex items-center justify-center text-slate-400 text-sm italic">
          Grafik Tren Pembayaran (Placeholder)
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 h-[400px] flex items-center justify-center text-slate-400 text-sm italic">
          Verifikasi Terbaru (Placeholder)
        </div>
      </div>
    </div>
  );
}
