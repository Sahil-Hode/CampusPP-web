"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Bot, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    // Reduced padding: pt-24 for mobile, pt-32 for desktop
    <main className="flex-1 flex flex-col items-center justify-center relative px-6 text-center pt-24 md:pt-32 pb-16 bg-transparent overflow-hidden">

      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-[#63D2F3]/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D6BCFA]/10 blur-[100px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="z-10 space-y-8 max-w-5xl mx-auto">

        {/* VERSION BADGE */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border-2 border-slate-100 bg-white/80 backdrop-blur-md text-[10px] uppercase tracking-[0.3em] font-black text-slate-800 shadow-sm transition-all cursor-default"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#63D2F3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#63D2F3]"></span>
          </span>
          Campus++ Intelligence v1.0
          <ChevronRight size={10} className="text-slate-300" />
        </motion.div>

        {/* MAIN TITLE */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-[1000] tracking-tighter text-slate-900 max-w-4xl mx-auto leading-[0.95] md:leading-[0.9]"
          >
            Design your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63D2F3] via-[#48BBDB] to-[#D6BCFA]">
              dream career.
            </span>
          </motion.h1>

          {/* SUBTEXT */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-[500px] mx-auto text-slate-500 text-base md:text-xl font-bold leading-relaxed tracking-tight"
          >
            Personalized learning paths and AI-powered mentorship
            built for the next generation of professionals.
          </motion.p>
        </div>

        {/* ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/institute-register"
            className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-[#63D2F3] text-white px-10 py-4.5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-[0_6px_0_0_#48BBDB] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#48BBDB] active:translate-y-[6px] active:shadow-none transition-all"
          >
            Register Institute
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" strokeWidth={3} />
          </Link>

          <Link
            href="/institute-login"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-800 px-10 py-4.5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Bot size={18} className="text-[#63D2F3]" strokeWidth={2.5} />
            Faculty/Admin Login
          </Link>
        </motion.div>

        {/* FEATURE TAGS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 pt-10"
        >
          {[
            { icon: Zap, text: "Fast Analysis" },
            { icon: Sparkles, text: "AI Optimized" },
            { icon: ShieldCheck, text: "Secure" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 group opacity-60 hover:opacity-100 transition-opacity">
              <item.icon size={14} className="text-[#63D2F3]" strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

function ShieldCheck({ size, className }: { size: number, className: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      strokeLinejoin="round" className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}