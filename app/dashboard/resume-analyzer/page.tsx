"use client";

import { useState } from "react";
import { FileText, Upload, ShieldCheck, AlertCircle, FileCheck, Sparkles, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setScore(84);
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 transition-colors duration-500">
      {/* 1. Header */}
      <div>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <div className="p-1.5 bg-[#63D2F3]/10 rounded-lg text-[#63D2F3]">
            <ShieldCheck size={16} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">ATS Optimizer</span>
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Resume Analyzer</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">Get AI-powered insights to beat the recruitment filters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 2. Upload Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`
            relative bg-white dark:bg-slate-900/50 backdrop-blur-xl border-4 border-dashed rounded-[3rem] p-12 
            flex flex-col items-center justify-center text-center transition-all duration-300
            ${file 
              ? 'border-[#63D2F3] bg-[#63D2F3]/5 dark:bg-[#63D2F3]/5' 
              : 'border-slate-100 dark:border-slate-800 hover:border-[#63D2F3]/30 dark:hover:border-[#63D2F3]/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
          `}>
            
            {/* Animated Background Pulse for "Scanning" state */}
            {analyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-[#63D2F3] rounded-[2.8rem]"
              />
            )}

            <motion.div 
              animate={file ? { rotate: [0, 5, -5, 0] } : {}}
              className={`
                w-20 h-20 rounded-3xl flex items-center justify-center mb-6 z-10 transition-all duration-500
                ${file 
                  ? 'bg-[#63D2F3] text-white shadow-[0_8px_0_0_#48BBDB]' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}
              `}
            >
              {file ? <FileCheck size={32} strokeWidth={3} /> : <Upload size={32} strokeWidth={3} />}
            </motion.div>
            
            <div className="relative z-10">
              {file ? (
                <div className="space-y-3">
                  <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{file.name}</p>
                  <button 
                    onClick={() => setFile(null)} 
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-all shadow-sm"
                  >
                    <X size={14} strokeWidth={3} />
                    Change File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Drop your resume</p>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-6">PDF or Word docs supported</p>
                  <label className="cursor-pointer inline-block px-8 py-3 bg-slate-900 dark:bg-[#63D2F3] hover:bg-[#63D2F3] dark:hover:bg-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 transition-all shadow-xl active:translate-y-1 active:shadow-none">
                    Browse Files
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="group w-full bg-[#63D2F3] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-[0_8px_0_0_#48BBDB] hover:translate-y-[2px] hover:shadow-[0_6px_0_0_#48BBDB] active:translate-y-[8px] active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Neural Scan...</span>
              </>
            ) : (
              <>
                <span>Analyze Resume</span>
                <Sparkles size={20} className="fill-current transition-transform group-hover:rotate-12" />
              </>
            )}
          </button>
        </div>

        {/* 3. Info Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 dark:bg-slate-900/50 border-2 border-transparent dark:border-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#63D2F3] rounded-full" />
                Engine Specs
              </h3>
              <ul className="space-y-5">
                {[
                  { icon: FileCheck, text: "ATS Compatibility Scan" },
                  { icon: AlertCircle, text: "Industry Skill-Gap Audit" },
                  { icon: Sparkles, text: "Keyword Density Check" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 transition-colors group-hover:bg-[#63D2F3]/20">
                      <item.icon size={18} className="text-[#63D2F3]" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 dark:text-slate-400">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Ambient Background Glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#63D2F3]/10 dark:bg-[#63D2F3]/5 blur-[80px] rounded-full pointer-events-none" />
          </div>

          {/* 4. Score Result */}
          <AnimatePresence>
            {score && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden"
              >
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">Analysis Result</p>
                <div className="relative inline-flex items-center justify-center mb-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter"
                  >
                    {score}%
                  </motion.div>
                  <CheckCircle2 size={24} className="text-[#63D2F3] absolute -right-6 top-2" />
                </div>
                
                {/* Score Progress Bar */}
                <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden mb-6 border border-slate-100 dark:border-slate-700 p-1">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#63D2F3] to-[#D6BCFA] rounded-full shadow-[0_0_15px_rgba(99,210,243,0.5)]"
                   />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="text-slate-900 dark:text-white font-black">AI TIP:</span> Add quantifiable metrics like "Increased efficiency by 20%" to improve score.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}