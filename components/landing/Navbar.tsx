"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, ChevronDown, Building2, UserCircle, Zap, Menu, X, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-6 pointer-events-none">
      <div className={`
        max-w-7xl mx-auto flex justify-between items-center px-6 py-3 md:py-4
        rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 pointer-events-auto
        ${scrolled
          ? "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-2 border-white/50 dark:border-zinc-800/50"
          : "bg-white dark:bg-zinc-900 border-2 border-slate-50 dark:border-zinc-800 shadow-sm"}
      `}>

        {/* LEFT: BRAND */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 md:h-10 md:w-10 bg-[#63D2F3] rounded-xl shadow-[0_4px_0_0_#48BBDB] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-300">
            <GraduationCap className="text-white w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
          <span className="font-[1000] tracking-tighter text-slate-800 dark:text-white text-xl md:text-2xl uppercase">
            Campus ++
          </span>
        </Link>

        {/* CENTER/RIGHT: DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-10">
          <div
            className="relative"
            onMouseEnter={() => setIsLoginOpen(true)}
            onMouseLeave={() => setIsLoginOpen(false)}
          >
            <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 hover:text-[#63D2F3] uppercase tracking-[0.25em] transition-colors py-2">
              Institute
              <ChevronDown size={14} className={`transition-transform duration-300 ${isLoginOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isLoginOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border-2 border-slate-50 dark:border-zinc-800 p-3"
                >
                  <InstituteOptions />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/institute-login"
            className="bg-[#63D2F3] text-white px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_5px_0_0_#48BBDB] hover:translate-y-[2px] hover:shadow-[0_3px_0_0_#48BBDB] active:translate-y-[5px] active:shadow-none transition-all flex items-center gap-2"
          >
            Faculty/Admin Login <Zap size={14} className="fill-current" />
          </Link>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE MINI-DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[100px] left-4 right-4 bg-white dark:bg-zinc-900 border-2 border-slate-50 dark:border-zinc-800 rounded-[2.5rem] p-4 shadow-2xl pointer-events-auto"
          >
            <div className="space-y-4">
              <Link
                href="/institute-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full bg-[#63D2F3] text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-[0_6px_0_0_#48BBDB]"
              >
                Faculty/Admin Login <Zap size={14} className="ml-2 fill-current" />
              </Link>

              <div className="h-px bg-slate-100 dark:bg-zinc-800 mx-4" />

              <div className="px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Institute Portals</p>
                <InstituteOptions onAction={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function InstituteOptions({ onAction }: { onAction?: () => void }) {
  return (
    <div className="space-y-1">
      {/* INSTITUTE LOGIN */}
      <Link
        href="/institute-login"
        onClick={onAction}
        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-[1.8rem] transition-all group"
      >
        <div className="w-11 h-11 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
          <Building2 size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-widest leading-none mb-1">Organization</p>
          <p className="text-sm font-black text-slate-700 dark:text-zinc-200 tracking-tight">Login Portal</p>
        </div>
      </Link>

      <div className="h-px bg-slate-100 dark:bg-zinc-800 mx-4 my-2" />

      {/* INSTITUTE REGISTER */}
      <Link
        href="/institute-register"
        onClick={onAction}
        className="flex items-center gap-4 p-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-[1.8rem] transition-all group"
      >
        <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 transition-all">
          <PlusCircle size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest leading-none mb-1">Partnership</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">Register Institute</p>
        </div>
      </Link>
    </div>
  );
}
