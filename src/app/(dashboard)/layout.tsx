import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[260px] transition-all duration-300">
        <Header />
        <main className="p-4 md:p-6 lg:p-8 pt-20 md:pt-22 lg:pt-24 pb-20 sm:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
