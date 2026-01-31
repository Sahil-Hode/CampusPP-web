"use client";

import {
  Users,
  AlertCircle,
  Activity,
  ShieldCheck,
  Lightbulb,
  TrendingDown,
  CheckCircle2,
  ArrowUpRight,
  BrainCircuit
} from "lucide-react";
import { motion } from "framer-motion";

export default function FacultyInsightsPage() {
  return (
    <div className="space-y-10 pb-12">
      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-[#63D2F3]/20 rounded-lg">
              <BrainCircuit size={18} className="text-[#63D2F3]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#63D2F3]">Intelligence Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
            Predictive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63D2F3] to-[#D6BCFA]">Insights</span>
          </h1>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
          Last Synced: Just Now
        </div>
      </div>

      {/* 1. SUMMARY CARDS - HIGH IMPACT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Students" value="120" icon={Users} color="cyan" />
        <StatCard title="High Risk" value="18" icon={AlertCircle} color="red" trend="increase" />
        <StatCard title="Medium Risk" value="32" icon={Activity} color="amber" />
        <StatCard title="Safe Zone" value="70" icon={ShieldCheck} color="emerald" />
      </div>

      {/* 2. KEY INSIGHTS - BENTO STYLE */}
      <div className="grid lg:grid-cols-2 gap-6">
        <InsightBox
          title="Attendance Dynamics"
          icon={TrendingDown}
          color="border-red-500/20"
          points={[
            "22% of students have attendance below 65%",
            "Attendance drop directly mirrors internal score decay",
            "Peak absenteeism detected in Morning Lecture Slots",
          ]}
        />
        <InsightBox
          title="Academic Momentum"
          icon={ArrowUpRight}
          color="border-[#63D2F3]/20"
          points={[
            "Internal scores peaked during week 4 (LMS spike)",
            "Gamified quizzes increased participation by 18%",
            "LMS regular usage correlates with Grade A potential",
          ]}
        />
      </div>

      {/* 3. AI RECOMMENDATIONS - THE "NEURAL" BOX */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-2 border-[#63D2F3]/30"
      >
        {/* Glow Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#63D2F3]/20 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <Lightbulb className="text-[#63D2F3]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">System Recommendations</h2>
              <p className="text-[10px] font-bold text-[#63D2F3] uppercase tracking-[0.2em]">Automated Action Plan</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Deploy remedial resources for Attendance < 65%",
              "Initiate mandatory 1-on-1 Mentoring for High Risk",
              "Lock internal marks to LMS Engagement triggers",
              "Execute mock finals for bottom 20 percentile"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                <CheckCircle2 size={18} className="text-[#63D2F3] mt-1 shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-sm font-bold text-slate-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  color: "cyan" | "red" | "amber" | "emerald";
  trend?: "increase";
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colors: Record<string, string> = {
    cyan: "text-[#63D2F3] bg-[#63D2F3]/10",
    red: "text-red-500 bg-red-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm group hover:scale-[1.02] transition-transform">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tighter">{value}</h3>
        {trend === "increase" && <span className="text-[10px] font-black text-red-500 uppercase">+12% ↑</span>}
      </div>
    </div>
  );
}

interface InsightBoxProps {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  points: string[];
  color: string;
}

function InsightBox({ title, icon: Icon, points, color }: InsightBoxProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 ${color} shadow-sm`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-xl text-slate-800 dark:text-white">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-[1000] text-slate-800 dark:text-white uppercase tracking-widest">{title}</h2>
      </div>
      <ul className="space-y-4">
        {points.map((p: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[#63D2F3] mt-2 shrink-0" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 leading-relaxed tracking-tight">{p}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}