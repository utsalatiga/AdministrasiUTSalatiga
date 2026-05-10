"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentRange = searchParams.get("range") || "all";

  const ranges = [
    { label: "Semua Waktu", value: "all" },
    { label: "Hari Ini", value: "today" },
    { label: "Minggu Ini", value: "week" },
    { label: "Bulan Ini", value: "month" },
  ];

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("range");
      params.delete("start");
      params.delete("end");
    } else {
      params.set("range", value);
      
      const now = new Date();
      let start = new Date();
      
      if (value === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (value === "week") {
        start.setDate(now.getDate() - now.getDay());
      } else if (value === "month") {
        start.setDate(1);
      }
      
      params.set("start", start.toISOString());
      params.set("end", now.toISOString());
    }
    
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span>{ranges.find(r => r.value === currentRange)?.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-20 animate-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {ranges.map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeChange(range.value)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm rounded-lg transition-colors",
                  currentRange === range.value ? "bg-primary/5 text-primary font-bold" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
