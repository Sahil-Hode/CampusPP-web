"use client";

import DashboardCard from "./components/DashboardCard";
import { Zap, FileText, MessageSquare, Sparkles, TrendingUp, Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="space-y-10 pb-10 transition-colors duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="p-1.5 bg-[#63D2F3]/10 rounded-lg text-[#63D2F3]">
              <Sparkles size={16} className="fill-current" />
            </div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
              Next-Gen Learning
            </span>
          </motion.div>
          
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Welcome to <span className="text-[#63D2F3]">Jnexia</span> 
          </h2>
          <p className="text-slate-400 dark:text-slate-400 font-bold text-base max-w-md">
            Your AI career accelerator is active.
          </p>
        </div>

        {/* Stats Section - Interactive 3D feel */}
        <div className="flex gap-4">
          {[
            { label: "Skill Rank", value: "Level 4", icon: Trophy, color: "text-[#F6AD55]", bg: "bg-[#F6AD55]/10" },
            { label: "Goal Score", value: "82%", icon: Target, color: "text-[#D6BCFA]", bg: "bg-[#D6BCFA]/10" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, rotateX: 5 }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-4 rounded-[1.5rem] flex items-center gap-4 shadow-sm dark:shadow-none transition-all"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{stat.value}</p>
                <p className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grid - Cards handle their own internal dark mode logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DashboardCard
          title="AI Learning Path"
          description="Personalized roadmap tailored to your specific goals."
          href="/dashboard/learning-path"
          icon={Zap}
          color="blue"
        />
        <DashboardCard
          title="Resume Analyzer"
          description="Get instant AI feedback and scoring for your CV."
          href="/dashboard/resume-analyzer"
          icon={FileText}
          color="purple"
        />
        <DashboardCard
          title="AI Chatbot"
          description="Chat with your career mentor about jobs and trends."
          href="/dashboard/chatbot"
          icon={MessageSquare}
          color="orange"
        />
      </div>

      {/* Motivation Card - Optimized for Dark/Light Interaction */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 dark:bg-[#63D2F3]/5 dark:border-2 dark:border-[#63D2F3]/20 rounded-[2.5rem] p-10 text-white relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex w-14 h-14 bg-white/5 dark:bg-[#63D2F3]/10 rounded-2xl items-center justify-center border border-white/10 dark:border-[#63D2F3]/20 transition-transform group-hover:scale-110">
              <TrendingUp size={28} className="text-[#63D2F3]" strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight leading-none text-white dark:text-[#63D2F3]">Consistency Wins</h3>
              <p className="text-slate-400 dark:text-slate-300 text-sm font-bold mt-2 max-w-lg">
                Your streak is 5 days. Keep pushing to unlock the AI Interview Prep module!
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-[#63D2F3] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_5px_0_0_#48BBDB] transition-all active:shadow-none active:translate-y-[5px]"
          >
            Check Daily Tasks
          </motion.button>
        </div>
        
        {/* Background Decor - Interactive glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#63D2F3] opacity-10 dark:opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity" />
      </motion.div>
    </div>
  );
}