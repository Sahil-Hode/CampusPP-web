"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  FileUp, 
  ChevronRight, 
  ArrowUpRight, 
  TrendingUp,
  BrainCircuit,
  Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";

export default function FacultyDashboard() {
  const [facultyName, setFacultyName] = useState("Professor");

  useEffect(() => {
    // Pull real faculty name from localStorage
    const storedName = localStorage.getItem("user_name");
    if (storedName) setFacultyName(storedName);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 px-4">
      
      {/* WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#63D2F3]/10 rounded-lg text-[#63D2F3]">
              <Fingerprint size={16} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black text-[#63D2F3] uppercase tracking-[0.3em]">
              Faculty Node: Verified
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
            Welcome, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63D2F3] to-[#D6BCFA]">
              {facultyName.split(' ')[0]}.
            </span>
          </h1>
        </div>

        <div className="flex gap-2">
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Risk Engine Active
             </span>
           </div>
        </div>
      </div>

      {/* 1. KEY STATS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Students" 
          value="142" 
          icon={Users} 
          color="bg-[#63D2F3]" 
          description="Assigned to your modules"
        />
        <StatCard 
          title="High Risk" 
          value="12" 
          icon={AlertTriangle} 
          color="bg-red-500" 
          description="Immediate attention required"
          alert
        />
        <StatCard 
          title="Last Data Sync" 
          value="Today" 
          icon={Clock} 
          color="bg-slate-900" 
          description="Last updated 2 hours ago"
        />
      </div>

      {/* 2. MAIN ACTIONS SECTION */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* UPDATED UPLOAD CALL-TO-ACTION */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="lg:col-span-2 relative group overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[350px] shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <BrainCircuit size={220} className="text-[#63D2F3]" strokeWidth={1} />
          </div>
          
          <div className="relative z-10">
            <div className="p-3 bg-[#63D2F3] w-fit rounded-2xl mb-8 shadow-[0_5px_0_0_#48BBDB]">
              <FileUp className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-[1000] text-white uppercase tracking-tighter leading-[0.9] max-w-xs">
              Synchronize <br /> <span className="text-[#63D2F3]">Student Records.</span>
            </h2>
            <div className="flex items-center gap-4 mt-6">
              <StepBadge num="1" text="Attendance" />
              <div className="h-px w-4 bg-slate-700" />
              <StepBadge num="2" text="Grades" />
              <div className="h-px w-4 bg-slate-700" />
              <StepBadge num="3" text="LMS Logs" />
            </div>
          </div>

          <Link href="/dashboard/upload" className="relative z-10 w-fit">
            <button className="flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#63D2F3] hover:text-white transition-all shadow-xl group/btn">
              Open Ingestion Portal
              <ArrowUpRight size={18} strokeWidth={3} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </button>
          </Link>
        </motion.div>

        {/* QUICK INSIGHTS PANEL */}
        <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-900 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#63D2F3]" />
              Risk Insights
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  <span className="text-red-500 font-black uppercase tracking-tighter mr-2">Critical:</span> 
                  8 students in CS-101 have missed 3 consecutive labs.
                </p>
              </div>
              <div className="p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  <span className="text-[#63D2F3] font-black uppercase tracking-tighter mr-2">Pattern:</span> 
                  LMS engagement correlates with mid-term success by 84%.
                </p>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard/insights" className="mt-8 text-[10px] font-black text-[#63D2F3] uppercase tracking-widest flex items-center gap-2 group">
            Analyze Department Trends 
            <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description, alert }: any) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-900 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-bl-[5rem]`} />
      
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <h3 className={`text-4xl font-[1000] tracking-tighter mt-1 ${alert ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {value}
          </h3>
        </div>
      </div>
      
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {description}
      </p>
    </div>
  );
}

function StepBadge({ num, text }: { num: string, text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-md bg-slate-800 text-[#63D2F3] flex items-center justify-center text-[10px] font-black">
        {num}
      </span>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {text}
      </span>
    </div>
  );
}