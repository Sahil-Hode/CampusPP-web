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
          <DashboardHeader />

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto text-black dark:text-white">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}
