import { 
  ArrowUpRight, 
  Users, 
  Wallet, 
  Clock, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { getDashboardStats } from "@/lib/actions/stats";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import DashboardFilters from "@/components/dashboard/DashboardFilters";

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: { start?: string; end?: string; range?: string } 
}) {
  const statsData = await getDashboardStats({
    dateStart: searchParams.start,
    dateEnd: searchParams.end
  });


  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const stats = [
    {
      title: "Total Pemasukan",
      value: formatRupiah(statsData.totalIncome),
      description: "Verifikasi & Lunas",
      icon: Wallet,
      color: "bg-status-emerald",
    },
    {
      title: "Total Tunggakan",
      value: formatRupiah(statsData.totalArrears),
      description: "Belum lunas & mencicil",
      icon: AlertCircle,
      color: "bg-status-rose",
    },
    {
      title: "Transaksi Hari Ini",
      value: `${statsData.todayCount} Transaksi`,
      description: "Aktivitas pembayaran hari ini",
      icon: ArrowUpRight,
      color: "bg-primary",
    },
    {
      title: "Antrean Verifikasi",
      value: `${statsData.pendingCount} Transaksi`,
      description: "Butuh persetujuan segera",
      icon: Clock,
      color: "bg-status-amber",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm">Ringkasan real-time aktivitas keuangan mahasiswa.</p>
        </div>
        <DashboardFilters />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.title}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${stat.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {stat.title}
              </p>
              <h3 className="font-serif text-2xl text-slate-800 font-tabular tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[11px] text-slate-400 mt-2 italic font-medium">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-status-emerald rounded-2xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-slate-800">Tren Pemasukan</h3>
              <p className="text-xs text-slate-400 font-medium">Statistik real-time 6 bulan terakhir</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-status-emerald font-bold bg-emerald-50 px-4 py-2 rounded-full uppercase tracking-wider">
            <ArrowUpRight className="h-4 w-4" />
            <span>Update Otomatis</span>
          </div>
        </div>
        
        <AnalyticsChart data={statsData.chartData} />
      </div>
    </div>
  );
}
