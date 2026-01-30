"use client";

import { 
  ArrowLeft, 
  BrainCircuit, 
  Target, 
  Zap, 
  MessageSquare, 
  TrendingDown, 
  Award, 
  Clock 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import RiskBadge from "../../components/RiskBadge";


export default function StudentDetail() {
  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      
      {/* 1. TOP NAVIGATION & IDENTITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/faculty/students" className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-50 dark:border-zinc-800 hover:text-[#63D2F3] transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase">
              Rahul <span className="text-[#63D2F3]">Sharma</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Student ID: #JN-2024-082</p>
          </div>
        </div>
        <RiskBadge level="High" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* 2. LEFT COLUMN: CORE METRICS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm text-center">
            <p className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest mb-4">Engagement Score</p>
            <div className="relative inline-flex items-center justify-center mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-zinc-800" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - 0.45)} className="text-red-500" strokeLinecap="round" />
              </svg>
              <span className="absolute text-2xl font-black text-slate-800 dark:text-white">45%</span>
            </div>
            <div className="flex justify-center gap-4 border-t border-slate-50 dark:border-zinc-800 pt-6 mt-2">
              <MetricMini icon={Clock} label="Attendance" val="62%" color="text-red-500" />
              <MetricMini icon={Award} label="GPA" val="2.4" color="text-amber-500" />
            </div>
          </div>
        </div>

        {/* 3. RIGHT COLUMN: AI BRAIN-DUMP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DIAGNOSTIC PANEL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-red-500/10 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                <TrendingDown size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-[1000] text-slate-800 dark:text-white uppercase tracking-widest">Risk Factor Diagnosis</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Critical attendance drop in last 14 days",
                "Internal assessment decay (-12% vs Class Avg)",
                "LMS Activity: Only 2 sessions this week",
                "Late submission detected in core modules"
              ].map((point, i) => (
                <div key={i} className="flex gap-3 p-4 bg-slate-50/50 dark:bg-zinc-950/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* PRESCRIPTION PANEL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-[#63D2F3]/30 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#63D2F3]/20 rounded-xl text-[#63D2F3]">
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-[1000] text-white uppercase tracking-widest">AI Action Plan</h2>
            </div>

            <div className="space-y-3">
              {[
                { icon: MessageSquare, text: "Schedule 15-min mentoring session immediately" },
                { icon: BrainCircuit, text: "Assign Remedial Quiz #4 (Focus: Data Structures)" },
                { icon: Target, text: "Enable Daily SMS Reminders for morning lectures" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                  <item.icon size={18} className="text-[#63D2F3] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-200 uppercase tracking-wide">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

function MetricMini({ icon: Icon, label, val, color }: any) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1.5 font-black text-lg ${color}`}>
        <Icon size={14} />
        {val}
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}