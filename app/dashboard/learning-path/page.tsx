"use client";

import { useState } from "react";
import { Brain, Sparkles, Map, ChevronRight, CheckCircle2, Zap, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LearningPathPage() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);

  async function generatePath() {
    if (!goal.trim()) return;
    setLoading(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setResult([
        "Mastering UI/UX Fundamentals",
        "Deep Dive into React & Next.js",
        "Backend Architecture with Node.js",
        "Database Design & Optimization",
        "Cloud Deployment & Scaling"
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 transition-colors duration-500">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="p-1.5 bg-[#F6AD55]/10 rounded-lg text-[#F6AD55]">
              <Map size={16} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Strategy Engine</span>
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">AI Learning Path</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">Map out your journey to career mastery.</p>
        </div>
      </div>

      {/* 2. Input Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 items-end relative overflow-hidden transition-all">
        <div className="flex-1 w-full space-y-2 relative z-10">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Your Career Objective</label>
          <div className="relative group">
            <Brain className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-[#F6AD55] transition-colors" size={20} />
            <input
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-[#F6AD55]/20 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="e.g. Senior Full Stack Engineer"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={generatePath} 
          disabled={loading}
          className="w-full md:w-auto bg-[#F6AD55] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_5px_0_0_#DD6B20] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#DD6B20] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 relative z-10"
        >
          {loading ? "Analyzing..." : "Generate Path"}
          <Sparkles size={16} className={loading ? "animate-spin" : "fill-current text-white/80"} />
        </button>
        
        {/* Background Decor */}
        <Zap size={120} className="absolute -right-8 -bottom-8 text-slate-50 dark:text-slate-800/50 opacity-50 -rotate-12 pointer-events-none" />
      </div>

      {/* 3. Results Roadmap */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 px-4">
              <div className="h-[2px] flex-1 bg-slate-100 dark:bg-slate-800" />
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                <Rocket size={14} className="text-[#F6AD55]" />
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Personalized Roadmap</h3>
              </div>
              <div className="h-[2px] flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="relative space-y-4">
              {/* Vertical Connector Line */}
              <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-50 dark:bg-slate-800 rounded-full" />

              {result.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative flex items-center gap-6"
                >
                  {/* Step Marker */}
                  <div className={`
                    w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center z-10 transition-all duration-300
                    ${index === 0 
                      ? 'bg-[#F6AD55] text-white shadow-[0_6px_0_0_#DD6B20]' 
                      : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-2 border-slate-50 dark:border-slate-800 group-hover:border-[#F6AD55]/30 group-hover:text-[#F6AD55]'}
                  `}>
                    <span className="text-[10px] font-black leading-none mb-1 uppercase">Step</span>
                    <span className="text-xl font-black leading-none">{index + 1}</span>
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm group-hover:shadow-md dark:group-hover:border-[#F6AD55]/20 transition-all flex items-center justify-between">
                    <div>
                      <p className={`text-base font-black tracking-tight ${index === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {step}
                      </p>
                      {index === 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 size={12} className="text-[#F6AD55]" />
                          <span className="text-[9px] font-black text-[#F6AD55] uppercase tracking-widest">Immediate Priority</span>
                        </div>
                      )}
                    </div>

                    <motion.button 
                      whileHover={{ x: 3 }}
                      className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-[#F6AD55] group-hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight size={18} strokeWidth={3} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Final Goal Node */}
            <div className="flex justify-center pt-6">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="px-8 py-4 bg-slate-900 dark:bg-[#F6AD55] text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 shadow-xl"
               >
                  <div className="w-2 h-2 rounded-full bg-[#F6AD55] dark:bg-white animate-ping" />
                  Career Destination Reached
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}