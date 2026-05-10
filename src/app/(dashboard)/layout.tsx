import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";

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
        <main className="pt-16 p-4 md:p-6 lg:p-8 pb-20 sm:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
