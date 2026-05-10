"use client";

import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  return (
    <div className="hidden lg:flex w-[260px] bg-sidebar min-h-screen flex-col fixed left-0 top-0 text-white z-50">
      <SidebarContent />
    </div>
  );
}
