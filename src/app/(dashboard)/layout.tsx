import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-[260px]">
        <Header />
        <main className="pt-16 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
