"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Receipt, 
  Banknote, 
  BarChart3 
} from "lucide-react";
import { cn } from "@/lib/utils";

const bottomMenuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mahasiswa", href: "/mahasiswa", icon: GraduationCap },
  { name: "Tagihan", href: "/tagihan", icon: Receipt },
  { name: "Pembayaran", href: "/pembayaran", icon: Banknote },
  { name: "Laporan", href: "/laporan", icon: BarChart3 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 px-2 py-1">
      <div className="flex justify-around items-center">
        {bottomMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all",
                isActive ? "text-blue-600" : "text-slate-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
