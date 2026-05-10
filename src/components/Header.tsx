"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const supabase = createClient();
  
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    const path = pathname.split("/")[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : "Dashboard";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 fixed top-0 right-0 left-[260px] z-40">
      <div className="flex items-center gap-4">
        <h2 className="font-serif text-lg text-slate-800">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari data..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-status-rose rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-slate-100"></div>

          <div className="relative">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 leading-none">Admin UT</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Super Administrator</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <User className="h-5 w-5" />
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">User Aktif</p>
                  <p className="text-sm font-bold text-slate-800">admin@utsalatiga.ac.id</p>
                </div>
                <div className="p-2">
                  <Link 
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                  >
                    <Settings className="h-4 w-4" />
                    Pengaturan Sistem
                  </Link>
                  <Link 
                    href="/verifikasi"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    Verifikasi Pembayaran
                  </Link>
                  <div className="h-[1px] bg-slate-50 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
