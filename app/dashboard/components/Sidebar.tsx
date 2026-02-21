"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Bot,
  FileText,
  Cuboid,
  MessagesSquare,
  GraduationCap,
  LogOut,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", activeColor: "bg-[#63D2F3]" },
    { name: "Learning Path", icon: Route, path: "/dashboard/learning-path", activeColor: "bg-[#F6AD55]" },
    { name: "AI Chatbot", icon: Bot, path: "/dashboard/chatbot", activeColor: "bg-[#B794F4]" },
    { name: "Resume Analyzer", icon: FileText, path: "/dashboard/resume-analyzer", activeColor: "bg-[#68D391]" },
    { name: "3D Live Mentor Bot", icon: Cuboid, path: "/dashboard/3d-mentor", activeColor: "bg-[#4FD1C5]" },
    { name: "Mock Interview", icon: MessagesSquare, path: "/dashboard/mock-interview", activeColor: "bg-[#F6E05E]" },
    { name: "My Profile", icon: User, path: "/dashboard/profile", activeColor: "bg-[#F687B3]" },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[150] lg:hidden bg-slate-900/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-[200] w-72 bg-white dark:bg-zinc-950 border-r-2 border-slate-50 dark:border-zinc-800 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#63D2F3] rounded-2xl flex items-center justify-center shadow-[0_5px_0_0_#48BBDB]">
                <GraduationCap className="text-white w-7 h-7" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
                Campus ++
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] px-4 mb-4 text-slate-300 dark:text-zinc-500">
              Main Menu
            </p>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-[1.25rem] transition-all ${
                      isActive
                        ? `${item.activeColor} text-white`
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={isActive ? "text-white" : "text-slate-400"}
                      strokeWidth={isActive ? 3 : 2}
                    />
                    <span className={`text-sm ${isActive ? "font-black" : "font-bold"}`}>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 space-y-3 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut size={18} strokeWidth={3} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

