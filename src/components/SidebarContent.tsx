"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  BarChart3,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/admins";

const baseMenuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mahasiswa", href: "/mahasiswa", icon: Users },
  { name: "Tagihan", href: "/tagihan", icon: Receipt },
  { name: "Pembayaran", href: "/pembayaran", icon: CreditCard },
  { name: "Verifikasi", href: "/verifikasi", icon: CheckCircle2 },
  { name: "Laporan", href: "/laporan", icon: BarChart3 },
];

interface SidebarContentProps {
  onClose?: () => void;
}

export default function SidebarContent({ onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentUserProfile().then(profile => {
      if (profile?.role === 'super_admin') setIsAdmin(true);
    });
  }, []);

  const menuItems = [...baseMenuItems];
  if (isAdmin) {
    menuItems.push({ name: "Admin", href: "/admins", icon: ShieldCheck });
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full text-white">
      <div className="p-8">
        <h1 className="font-serif text-2xl tracking-tight">UT Salatiga</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1 font-semibold">
          Finance Admin
        </p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose && onClose()}
              className={cn(
                "group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative",
                isActive 
                  ? "bg-white/10 text-white font-medium" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-300"
              )} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3.5 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
}
