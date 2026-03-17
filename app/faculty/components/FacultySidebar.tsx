"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileUp,
  Users,
  GraduationCap,
  X,
  ChevronRight,
  LogOut,
  UserCircle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function FacultySidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/faculty", icon: LayoutDashboard },
    { name: "Upload Data", href: "/faculty/upload", icon: FileUp },
    { name: "Student Directory", href: "/faculty/students", icon: Users },
    { name: "Faculty Profile", href: "/faculty/profile", icon: UserCircle },
  ];

  const handleSignOut = () => {
    logout();
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110]
        w-72 sm:w-80 lg:w-72 
        bg-slate-50 dark:bg-zinc-950 border-r-2 border-slate-100 dark:border-zinc-900
        transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col p-6
      `}>

        {/* BRAND LOGO */}
        <div className="flex items-center justify-between mb-10 px-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[#63D2F3] rounded-xl shadow-[0_4px_0_0_#48BBDB] flex items-center justify-center rotate-3">
              <GraduationCap className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-[1000] tracking-tighter text-slate-800 dark:text-white text-xl uppercase">
              Campus++
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-[0.25em] mb-4 px-4">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                <div className={`
                  group flex items-center justify-between px-4 py-4 rounded-[1.5rem] transition-all duration-300 mb-1
                  ${isActive
                    ? "bg-white dark:bg-zinc-900 shadow-md border-2 border-slate-100 dark:border-zinc-800"
                    : "hover:bg-white/50 dark:hover:bg-zinc-900/50"}
                `}>
                  <div className="flex items-center gap-4">
                    <div className={`
                      p-2 rounded-xl transition-all
                      ${isActive ? "bg-[#63D2F3] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:text-[#63D2F3]"}
                    `}>
                      <item.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </div>
                    <span className={`text-[11px] font-[900] uppercase tracking-wider
                      ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-300"}`}>
                      {item.name}
                    </span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#63D2F3]" strokeWidth={3} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* PROFILE STATUS CARD */}
        <div className="mt-6 mb-4 p-4 bg-white dark:bg-zinc-900 rounded-[1.8rem] border-2 border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profile Status</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-[#63D2F3]" />
          </div>
          <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase tracking-tight">85% Information Updated</p>
        </div>

        {/* SIGN OUT */}
        <div className="shrink-0">
          <button
            onClick={handleSignOut}
            className="group w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <div className="p-2 bg-white/10 dark:bg-slate-900/10 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <LogOut className="w-4 h-4" strokeWidth={3} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}