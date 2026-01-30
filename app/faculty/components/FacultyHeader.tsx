"use client";

import { Menu, Bell, Search, UserCircle, Settings, LogOut, Sun, Moon, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardTheme } from "../../../components/ThemeProvider";

interface FacultyHeaderProps {
  onOpenSidebar: () => void;
}

export default function FacultyHeader({ onOpenSidebar }: FacultyHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [name, setName] = useState("Professor"); // Local state for the name
  
  const { theme, toggleTheme } = useDashboardTheme();
  const router = useRouter();
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load the real name from storage
    const storedName = localStorage.getItem("user_name");
    if (storedName) setName(storedName);

    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 md:px-8 py-4 transition-all duration-300">
      <div className={`
        mx-auto max-w-7xl flex items-center justify-between px-6 py-3
        rounded-[2rem] border-2 transition-all duration-300
        ${scrolled 
          ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-white dark:border-zinc-800 shadow-lg" 
          : "bg-white dark:bg-zinc-900 border-slate-50 dark:border-zinc-800 shadow-sm"}
      `}>
        
        {/* LEFT: Logo & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            <Menu className="w-5 h-5" strokeWidth={3} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
              Faculty <span className="text-[#63D2F3]">Portal</span>
            </h1>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-3 rounded-2xl border-2 bg-white dark:bg-zinc-800 border-slate-50 dark:border-zinc-700 text-slate-500">
            {theme === "dark" ? <Sun size={18} strokeWidth={3} /> : <Moon size={18} strokeWidth={3} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pl-4 bg-slate-900 dark:bg-[#63D2F3] rounded-2xl shadow-md"
            >
              <span className="hidden sm:block text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-widest">
                {name.split(' ')[0]} {/* Display only first name for layout */}
              </span>
              <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center text-white dark:text-slate-900">
                <UserCircle className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-56 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border-2 border-slate-50 dark:border-zinc-800 p-2 z-50"
                >
                  <Link href="/faculty/profile">
                    <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800">
                      <Settings className="w-4 h-4" strokeWidth={3} />
                      Profile Settings
                    </button>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={3} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}