"use client";

import { useState } from "react";
import UploadCard from "../components/UploadCard";
import { BrainCircuit, Sparkles, Database, ShieldCheck, ArrowRight, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  // Track the current step (0: Attendance, 1: Assessments, 2: LMS, 3: Completed)
  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20 space-y-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-zinc-800 pb-8 mt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Database className="text-[#63D2F3] w-[18px] h-[18px]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#63D2F3]">
              Step {Math.min(currentStep + 1, 3)} of 3
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
            {currentStep < 3 ? "Pipeline" : "Result"}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63D2F3] to-[#D6BCFA]">
              {currentStep < 3 ? "Ingestion" : "Ready"}
            </span>
          </h1>
        </div>
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 flex items-center gap-3">
          <ShieldCheck className="text-emerald-500 w-4 h-4" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            {currentStep * 33}% Processed
          </span>
        </div>
      </div>

      {/* SEQUENTIAL GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UploadCard 
          title="Attendance" 
          isActive={currentStep === 0}
          isCompleted={currentStep > 0}
          onUploadSuccess={handleNextStep}
        />
        
        <UploadCard 
          title="Assessments" 
          isActive={currentStep === 1}
          isCompleted={currentStep > 1}
          onUploadSuccess={handleNextStep}
        />
        
        <UploadCard 
          title="LMS Engagement" 
          isActive={currentStep === 2}
          isCompleted={currentStep > 2}
          onUploadSuccess={handleNextStep}
        />
      </div>

      {/* AI PROCESSING ACTION (Only active when all 3 are uploaded) */}
      <AnimatePresence>
        {currentStep === 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group bg-slate-900 dark:bg-white rounded-[2.5rem] p-1 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#63D2F3] via-[#D6BCFA] to-[#63D2F3] opacity-30 animate-pulse rounded-[2.5rem]" />
            
            <button className="relative w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-10 rounded-[2.3rem] flex flex-col items-center justify-center gap-6 overflow-hidden">
              <div className="flex items-center gap-4">
                <BrainCircuit className="text-[#63D2F3] w-12 h-12" />
                <h2 className="text-3xl font-[1000] uppercase tracking-tighter">View Final Analytics</h2>
              </div>
              
              <div className="flex items-center gap-4 px-6 py-2 bg-emerald-500 text-white rounded-full">
                <TrendingUp size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Neural Mapping 100% Complete</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}