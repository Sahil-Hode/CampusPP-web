"use client";

import {
  Bell,
  Menu,
  Search,
  User,
  ChevronDown,
  Sparkles,
  Zap,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useDashboardTheme } from "../../../components/ThemeProvider";

export default function DashboardHeader({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useDashboardTheme();

  const notifications = [
    {
      title: "Courses",
      text: "New React module is live",
      time: "2m ago",
      color: "text-[#63D2F3]",
    },
    {
      title: "System",
      text: "Login detected from Chrome",
      time: "1h ago",
      color: "text-[#F6AD55]",
    },
  ];

  return (
    <header className="px-4 md:px-6 py-4 sticky top-0 z-[100] bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-500">
      <div
        className="max-w-7xl mx-auto flex items-center justify-between bg-white dark:bg-zinc-900 border-2 border-slate-50 dark:border-zinc-800 rounded-3xl md:rounded-[2.5rem] px-4 py-2.5 md:px-5 md:py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
      >
        {/* LEFT: Logo + Mobile Menu */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-[#63D2F3] hover:text-white transition-all"
          >
            <Menu size={20} strokeWidth={3} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#63D2F3] rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_4px_0_0_#48BBDB] transform -rotate-3">
              <Sparkles size={18} className="text-white" fill="white" />
            </div>
            <div className="hidden xs:flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tighter leading-none text-slate-800 dark:text-white">
                Jnexia
              </span>
              <span className="text-[9px] md:text-[10px] font-black text-[#63D2F3] uppercase tracking-[0.2em]">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Search (Hidden on Mobile unless toggled) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="w-full flex items-center rounded-2xl px-5 py-2.5 bg-slate-50 dark:bg-zinc-800 border-2 border-transparent focus-within:border-[#63D2F3] transition-all shadow-inner">
            <Search size={18} className="text-slate-400" strokeWidth={3} />
            <input
              type="text"
              placeholder="Quick Search..."
              className="bg-transparent border-none outline-none text-sm ml-3 w-full text-slate-700 dark:text-zinc-200 font-bold placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-300"
          >
            <Search size={20} strokeWidth={3} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl md:rounded-2xl border-2 bg-white dark:bg-zinc-800 border-slate-50 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:text-[#63D2F3] transition-all"
          >
            {theme === "dark" ? <Sun size={20} strokeWidth={3} /> : <Moon size={20} strokeWidth={3} />}
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className={`p-3 rounded-xl md:rounded-2xl relative transition-all border-2 ${
                open
                  ? "bg-[#F6AD55] border-[#DD6B20] text-white shadow-lg"
                  : "bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-300 border-slate-50 dark:border-zinc-700 hover:text-[#F6AD55]"
              }`}
            >
              <Bell size={20} strokeWidth={3} />
              {!open && notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-800 animate-pulse" />
              )}
            </button>

            {/* RESPONSIVE DROPDOWN */}
            <AnimatePresence>
              {open && (
                <>
                  {/* Mobile Overlay Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed left-4 right-4 md:absolute md:left-auto md:right-0 mt-4 md:w-80 z-50 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-[2rem] p-5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Notifications
                      </h3>
                      <button onClick={() => setOpen(false)} className="md:hidden p-1">
                        <X size={16} className="text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {notifications.map((note, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-transparent hover:border-[#F6AD55]/20 transition-all"
                        >
                          <div className="flex justify-between mb-1">
                            <span className={`text-[9px] font-black uppercase ${note.color}`}>
                              {note.title}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 dark:text-zinc-600">
                              {note.time}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* PROFILE */}
          <Link
            href="/dashboard/profile"
            className="hidden xs:flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border-2 border-transparent hover:border-slate-100 dark:hover:border-zinc-700 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700 flex items-center justify-center text-slate-500">
              <User size={18} strokeWidth={3} />
            </div>
            <ChevronDown size={14} className="text-slate-400" strokeWidth={3} />
          </Link>
        </div>
      </div>

      {/* MOBILE SEARCH BAR (Toggled) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden pt-3"
          >
            <div className="flex items-center rounded-2xl px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-[#63D2F3] shadow-lg">
              <Search size={18} className="text-[#63D2F3]" strokeWidth={3} />
              <input
                autoFocus
                type="text"
                placeholder="Search resources..."
                className="bg-transparent border-none outline-none text-sm ml-3 w-full text-slate-700 dark:text-zinc-200 font-bold"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 