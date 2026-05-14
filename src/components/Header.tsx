"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Menu,
  X,
  Key
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import SidebarContent from "./SidebarContent";
import { getCurrentUserProfile } from "@/lib/actions/admins";
import ChangePasswordModal from "./admins/ChangePasswordModal";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();
  
  useEffect(() => {
    getCurrentUserProfile().then(setUserProfile);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    if (pathname === "/admins") return "Manajemen Admin";
    const path = pathname.split("/")[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : "Dashboard";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 left-0 lg:left-[260px] z-40 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="font-serif text-lg text-slate-800 hidden sm:block">{getPageTitle()}</h2>
          <h2 className="font-serif text-base text-slate-800 sm:hidden">{getPageTitle()}</h2>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari data..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all w-64"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-rose rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-slate-100 hidden sm:block"></div>

            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700 leading-none">{userProfile?.nama || "Admin UT"}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{userProfile?.role === 'admin' ? 'Super Administrator' : 'Staff Admin'}</p>
                </div>
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <User className="h-5 w-5" />
                </div>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">User Aktif</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.email || 'Admin UT Salatiga'}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setIsPasswordModalOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                    >
                      <Key className="h-4 w-4" />
                      Ganti Password
                    </button>
                    <Link 
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      Pengaturan Sistem
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

      {/* Mobile Drawer (Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-sidebar shadow-2xl animate-in slide-in-from-left duration-300 border-r border-white/5">
            <div className="absolute right-4 top-8 lg:hidden">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent onClose={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={userProfile?.email}
      />
    </>
  );
}
