"use client";

import StudentTable from "../components/StudentTable";
import { Search, Filter, Download, Users, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentsPage() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase">
            Risk <span className="text-[#63D2F3]">Analysis</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Real-time Academic Performance Monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-slate-100 transition-all">
            <Download size={14} strokeWidth={3} />
            Export Data
          </button>
          <button className="flex items-center gap-2 bg-[#63D2F3] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_0_0_#48BBDB] active:translate-y-[2px] active:shadow-none transition-all">
            <UserPlus size={14} strokeWidth={3} />
            Add Student
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4 p-4 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by student name, ID or email..." 
            className="w-full bg-slate-50 dark:bg-zinc-950 border-none rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-[#63D2F3] transition-all transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <select className="bg-slate-50 dark:bg-zinc-950 border-none rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-[#63D2F3] cursor-pointer outline-none">
            <option>All Risk Levels</option>
            <option>High Risk</option>
            <option>Medium Risk</option>
            <option>Safe</option>
          </select>
          
          <button className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl text-slate-500 hover:text-[#63D2F3] transition-colors">
            <Filter size={20} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>

      {/* 3. QUICK STATS SUMMARY */}
      <div className="flex flex-wrap gap-8 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Users size={16} className="text-[#63D2F3]" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Total Enrolled: <span className="text-slate-900 dark:text-white ml-1">1,240</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Urgent Attention: <span className="text-red-500 ml-1">18 Students</span></span>
        </div>
      </div>

      {/* 4. MAIN TABLE SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <StudentTable />
      </motion.div>

    </div>
  );
}