"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import { DashboardThemeProvider } from "../../components/ThemeProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Controls mobile sidebar (drawer)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardThemeProvider>
      <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
        
        {/* SIDEBAR */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* HEADER */}
          <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto px-2 py-2 md:px-3 md:py-3 lg:px-4 lg:py-4">
            <div className="w-full text-black dark:text-white">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}
