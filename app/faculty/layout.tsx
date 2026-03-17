"use client";

import { useState } from "react";
import FacultySidebar from "./components/FacultySidebar";
import FacultyHeader from "./components/FacultyHeader";
import ProtectedRoute from "../../components/ProtectedRoute";
import { DashboardThemeProvider } from "../../components/ThemeProvider";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute requiredRoles={["faculty", "admin"]}>
      <DashboardThemeProvider>
        <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950">
          {/* SIDEBAR */}
          <FacultySidebar isOpen={open} setIsOpen={setOpen} />

          {/* MAIN AREA */}
          <div className="flex-1 flex flex-col">
            <FacultyHeader onOpenSidebar={() => setOpen(true)} />

            <main className="flex-1 overflow-y-auto p-6 text-slate-900 dark:text-zinc-100">
              {children}
            </main>
          </div>
        </div>
       </DashboardThemeProvider>
    </ProtectedRoute>
  );
}
