"use client";

import { usePathname } from "next/navigation";
import { User, Bell, Search } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    const path = pathname.split("/")[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
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

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-none">Admin UT</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Super Administrator</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
