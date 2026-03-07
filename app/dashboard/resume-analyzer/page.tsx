"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Sparkles,
  CheckCircle2,
  Trash2,
  Clock,
  Loader2,
  ThumbsUp,
  Lightbulb,
  FileText,
  ChevronRight,
  ArrowRightLeft,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";

/**
 * 
 * PROFESSIONAL RESUME ANALYZER MODULE
 * Built for Campus++ Platform
 * Senior AI Engineer & UX Designer Edition
 * 
 */

// --- TYPES ---
type APIAnalysisDetail = {
  atsScore: number;
  overallRating: string;
  mainStrengths?: string[];
  criticalImprovements?: string[];
  missingOrSuggestedSkills?: string[];
  formattingAndStructureAdvice?: string[];
  keywordOptimization?: string[];
};

type AnalysisItem = {
  _id: string;
  fileName?: string;
  fileSizeKB?: string | number;
  status?: string;
  analysis: APIAnalysisDetail;
  summary?: {
    strengthsCount: number;
    improvementsCount: number;
    skillsSuggested: number;
  };
  createdAt: string;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  status?: string;
  statusCode?: number;
  error?: string;
  details?: string;
};

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const payload = err as ApiErrorPayload;
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.details === "string" && payload.details.trim()) {
      return payload.details;
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.statusCode === "number") {
      return `Request failed with status ${payload.statusCode}`;
    }
  }
  try {
    if (typeof err === "object" && err !== null) {
      return JSON.stringify(err);
    }
  } catch {
    // no-op
  }
  return "Request failed";
};

const isMissingFileError = (err: unknown) => {
  if (typeof err !== "object" || err === null) return false;
  const payload = err as ApiErrorPayload;
  return (
    payload.code === "MISSING_FILE" ||
    /no file uploaded|missing file/i.test(payload.message || "")
  );
};

const isRetryableUploadFieldError = (err: unknown) => {
  if (isMissingFileError(err)) return true;
  if (typeof err !== "object" || err === null) return false;
  const payload = err as ApiErrorPayload;
  if (typeof payload.statusCode === "number" && payload.statusCode >= 500) {
    return true;
  }
  const text = `${payload.message || ""} ${payload.error || ""} ${payload.details || ""
    }`.toLowerCase();
  return /unexpected field|no file|req\.file|reading 'buffer'|reading "buffer"|internal server error/i.test(text);
};

// --- COMPONENTS ---

const ATSProgressRing = ({ score, size = 160 }: { score: number; size?: number }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-slate-100 dark:text-zinc-800"
        />
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className={(score >= 80 ? "text-[#63D2F3]" : score >= 60 ? "text-amber-400" : "text-rose-400") + " drop-shadow-[0_0_8px_rgba(99,210,243,0.3)]"}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-black text-slate-900 dark:text-white tabular-nums"
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</span>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-48 bg-slate-100 dark:bg-zinc-800 rounded-[3rem]" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-[2rem]" />
      <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-[2rem]" />
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = () => {
    setInputKey(prev => prev + 1);
    setFile(null);
    setError(null);
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res: any = await apiRequest("/resume", { method: "GET" });
      const list = Array.isArray(res.data?.analyses) ? res.data.analyses : [];
      setAnalyses(list);
      if (list.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedAnalysis]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError(null);
    if (selected) {
      const lowerName = selected.name.toLowerCase();
      const isPDF =
        selected.type === "application/pdf" || lowerName.endsWith(".pdf");

      if (!isPDF) {
        setError("Please upload a PDF file only.");
        resetFileInput();
        return;
      }

      if (selected.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        resetFileInput();
        return;
      }

      setFile(selected);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const uploadAnalysis = async (fieldName: string) => {
        const formData = new FormData();
        formData.append(fieldName, file, file.name);
        return await apiRequest("/resume/analyze", {
          method: "POST",
          body: formData,
        }) as any;
      };

      const uploadFieldCandidates = [
        "pdf",
        "file",
        "resume",
        "resumeFile",
        "document",
        "cv",
      ];
      let res: unknown = null;
      let lastError: unknown = null;

      for (const fieldName of uploadFieldCandidates) {
        try {
          res = await uploadAnalysis(fieldName);
          lastError = null;
          break;
        } catch (attemptErr) {
          lastError = attemptErr;
          if (!isRetryableUploadFieldError(attemptErr)) {
            throw attemptErr;
          }
        }
      }

      if (lastError) throw lastError;

      const rawData = (res as { data?: Record<string, unknown> }).data || {};
      const newAnalysis: AnalysisItem = {
        _id:
          String(rawData.analysisId || "") ||
          String(rawData._id || "") ||
          Date.now().toString(),
        fileName: file.name,
        fileSizeKB: (file.size / 1024).toFixed(1),
        createdAt: String(rawData.createdAt || new Date().toISOString()),
        summary: rawData.summary as AnalysisItem["summary"],
        analysis: (rawData.analysis as APIAnalysisDetail) || {
          atsScore: Number(rawData.atsScore || 0),
          overallRating: String(rawData.overallRating || "N/A"),
          mainStrengths: [],
          criticalImprovements: [],
          keywordOptimization: [],
          missingOrSuggestedSkills: []
        }
      };

      setAnalyses(prev => [newAnalysis, ...prev]);
      setSelectedAnalysis(newAnalysis);
      resetFileInput();

    } catch (err: unknown) {
      console.error("Analysis execution error:", err);
      setError(`Analysis failed: ${getErrorMessage(err)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectAnalysis = async (item: AnalysisItem) => {
    if (item.analysis.mainStrengths && item.analysis.mainStrengths.length > 0) {
      setSelectedAnalysis(item);
      return;
    }

    try {
      setSelectedAnalysis(item);
      const res: any = await apiRequest(`/resume/${item._id}`, { method: "GET" });
      const fullData = res.data?.analysis;

      if (fullData) {
        const updatedItem: AnalysisItem = {
          ...item,
          createdAt: fullData.createdAt || fullData.processedAt || item.createdAt,
          summary: fullData.summary || item.summary,
          analysis: {
            ...item.analysis,
            ...fullData.analysis
          }
        };

        setAnalyses(prev => prev.map(a => a._id === item._id ? updatedItem : a));
        setSelectedAnalysis(updatedItem);
      }
    } catch (err) {
      console.error("Failed to fetch details", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis permanently?")) return;

    try {
      await apiRequest(`/resume/${id}`, { method: "DELETE" });
      const updated = analyses.filter(a => a._id !== id);
      setAnalyses(updated);
      if (selectedAnalysis?._id === id) {
        setSelectedAnalysis(updated[0] || null);
      }
    } catch (err: unknown) {
      alert(`Failed to delete analysis: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="p-2 bg-[#63D2F3]/10 rounded-xl text-[#63D2F3]">
              <ShieldCheck size={20} className="stroke-[3]" />
            </div>
            <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.4em]">Intelligence Suite</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            Resume <span className="text-[#63D2F3]">Analyzer</span>
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 font-bold text-base mt-2 max-w-lg">
            Professional ATS-driven insights to elevate your career and bypass recruitment algorithms.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Analyzed</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{analyses.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: UPLOAD & HISTORY */}
        <div className="lg:col-span-4 space-y-6">

          {/* UPLOAD CARD */}
          <div className={`
            relative bg-white dark:bg-zinc-900 border-4 border-dashed rounded-[3rem] p-10 
            flex flex-col items-center justify-center text-center transition-all duration-300
            ${file
              ? 'border-[#63D2F3] bg-[#63D2F3]/5 outline-none'
              : 'border-slate-100 dark:border-zinc-800 hover:border-[#63D2F3]/40'}
          `}>
            {file ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6 w-full"
              >
                <div className="w-20 h-20 bg-[#63D2F3] rounded-[1.5rem] flex items-center justify-center mx-auto shadow-[0_8px_30px_rgb(99,210,243,0.3)]">
                  <FileCheck size={36} className="text-white stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate px-6">{file.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB Ready</p>
                </div>
                <button
                  onClick={resetFileInput}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={14} /> Remove File
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-300 dark:text-zinc-700">
                  <Upload size={36} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Professional Review</h3>
                  <p className="text-xs font-bold text-slate-400 px-8">Drop your PDF file here for deep AI analysis (Max 5MB)</p>
                </div>
                <label className="group relative cursor-pointer inline-flex items-center gap-3 px-8 py-3.5 bg-slate-900 dark:bg-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 hover:translate-y-[-2px] active:translate-y-[1px] transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                  Select Document
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  <input key={inputKey} ref={fileInputRef} type="file" className="hidden" accept=".pdf,application/pdf" onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className={`
              w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] transition-all relative overflow-hidden group
              ${analyzing || !file
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                : 'bg-[#63D2F3] text-white shadow-[0_8px_30px_rgb(99,210,243,0.4)] hover:shadow-[0_12px_40px_rgb(99,210,243,0.6)] hover:-translate-y-1 active:translate-y-1'}
            `}
          >
            {analyzing && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            <div className="relative flex items-center justify-center gap-3">
              {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {analyzing ? "Engine Processing..." : "Start Analysis"}
            </div>
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-3xl flex items-start gap-4"
            >
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Error Detected</p>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300 leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          {/* HISTORY SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[3rem] p-8">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Past Analysis</h3>
              <div className="h-[2px] w-12 bg-[#63D2F3]/30 rounded-full" />
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />)}
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-10 grayscale opacity-40">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Library</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                {analyses.map((item) => (
                  <motion.div
                    key={item._id}
                    layoutId={item._id}
                    onClick={() => handleSelectAnalysis(item)}
                    className={`
                      p-4 rounded-2xl flex items-center justify-between cursor-pointer border-2 transition-all group
                      ${selectedAnalysis?._id === item._id
                        ? 'bg-[#63D2F3]/10 border-[#63D2F3] shadow-md shadow-[#63D2F3]/10'
                        : 'bg-slate-50/50 dark:bg-zinc-800/50 border-transparent hover:border-slate-200 dark:hover:border-zinc-700'}
                    `}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className={`p-2 rounded-lg ${selectedAnalysis?._id === item._id ? 'bg-[#63D2F3] text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                        <FileText size={14} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-black text-slate-700 dark:text-zinc-200 truncate pr-2">{item.fileName || "Summary Scan"}</p>
                        <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-xs font-black ${(item.analysis?.atsScore || 0) >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                          {item.analysis?.atsScore || 0}%
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROFESSIONAL RESULTS VIEW */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full"
              >
                <SkeletonLoader />
              </motion.div>
            ) : selectedAnalysis ? (
              <motion.div
                key={selectedAnalysis._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* HERO STAT CARD */}
                <div className="bg-white dark:bg-zinc-900 border-4 border-slate-100 dark:border-zinc-800 rounded-[3.5rem] p-8 md:p-12 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#63D2F3]/5 rounded-full blur-3xl -mr-32 -mt-32" />

                  <div className="flex-1 space-y-6 relative">
                    <div className="flex flex-wrap gap-2">
                      <div className="px-4 py-1.5 bg-[#63D2F3]/10 text-[#63D2F3] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#63D2F3]/20">
                        {selectedAnalysis.analysis.overallRating || "Verified"} Rating
                      </div>
                      {selectedAnalysis.summary && (
                        <div className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                          {selectedAnalysis.summary.strengthsCount} Strengths Detected
                        </div>
                      )}
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                      ATS Performance <br />
                      <span className="text-[#63D2F3]">Index Analysis</span>
                    </h2>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(selectedAnalysis.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <FileText size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{selectedAnalysis.fileName || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 relative">
                    <ATSProgressRing score={selectedAnalysis.analysis.atsScore || 0} />
                  </div>
                </div>

                {/* DETAILED INSIGHTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* STRENGTHS */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-100 dark:border-zinc-800 flex flex-col"
                  >
                    <div className="p-4 bg-green-500/10 text-green-500 w-fit rounded-2xl mb-6">
                      <ThumbsUp className="stroke-[2.5]" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Main Strengths</h3>
                    <ul className="space-y-4 flex-1">
                      {selectedAnalysis.analysis.mainStrengths?.map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm font-bold text-slate-600 dark:text-zinc-300 leading-relaxed">{item}</span>
                        </li>
                      )) || <li className="text-sm text-slate-400 italic font-bold">Comprehensive analysis pending...</li>}
                    </ul>
                  </motion.div>

                  {/* IMPROVEMENTS */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-100 dark:border-zinc-800 flex flex-col"
                  >
                    <div className="p-4 bg-rose-500/10 text-rose-500 w-fit rounded-2xl mb-6">
                      <Lightbulb className="stroke-[2.5]" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Critical Fixes</h3>
                    <ul className="space-y-4 flex-1">
                      {selectedAnalysis.analysis.criticalImprovements?.map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                          <span className="text-sm font-bold text-slate-600 dark:text-zinc-300 leading-relaxed">{item}</span>
                        </li>
                      )) || <li className="text-sm text-slate-400 italic font-bold">No critical warnings found.</li>}
                    </ul>
                  </motion.div>
                </div>

                {/* KEYWORD TRANSFORMER */}
                {(selectedAnalysis.analysis.keywordOptimization?.length || 0) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900 dark:bg-zinc-800 rounded-[3rem] p-10 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#63D2F3]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-white/10 rounded-xl text-[#63D2F3]">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Keyword Optimization</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">AI-Driven Professional Upgrades</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                      {selectedAnalysis.analysis.keywordOptimization?.map((item, i) => {
                        const parts = item.split('→').map(p => p.trim());
                        return (
                          <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex-1">
                              {parts.length === 2 ? (
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 line-through decoration-rose-500/40">{parts[0]}</span>
                                  <ArrowRightLeft size={14} className="text-slate-600 group-hover:text-[#63D2F3] transition-colors" />
                                  <span className="text-sm font-black text-[#63D2F3] tracking-tight">{parts[1]}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-slate-300">{item}</span>
                              )}
                            </div>
                            <CheckCircle2 size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ADDITIONAL INSIGHT GROUPS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* MISSING SKILLS */}
                  <div className="md:col-span-12 lg:col-span-7 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Missing Core Competencies</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedAnalysis.analysis.missingOrSuggestedSkills?.map((skill, i) => (
                        <div key={i} className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300">
                          {skill}
                        </div>
                      )) || <div className="text-sm text-slate-400">All key competencies detected.</div>}
                    </div>
                  </div>

                  {/* FORMATTING ADVICE */}
                  <div className="md:col-span-12 lg:col-span-5 bg-[#63D2F3]/5 p-8 rounded-[3rem] border border-[#63D2F3]/10">
                    <div className="flex items-center gap-3 mb-6">
                      <FileText size={20} className="text-[#63D2F3]" />
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Format Advice</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedAnalysis.analysis.formattingAndStructureAdvice?.map((advice, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#63D2F3] mt-1.5 shrink-0" />
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 leading-relaxed">{advice}</span>
                        </li>
                      )) || <li className="text-xs text-slate-400">Structure optimized for parsing.</li>}
                    </ul>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50/50 dark:bg-zinc-900/30 border-4 border-dashed border-slate-100 dark:border-zinc-800 rounded-[4rem] group hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-all duration-700">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#63D2F3]/20 rounded-full blur-2xl animate-pulse scale-150" />
                  <div className="relative w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-slate-100 dark:border-zinc-800">
                    <FileText size={40} className="text-slate-300 dark:text-zinc-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-400 dark:text-zinc-700 tracking-tight">Intelligence Engine Standby</h3>
                <p className="text-sm font-bold text-slate-300 dark:text-zinc-800 mt-2 max-w-xs mx-auto uppercase tracking-widest leading-loose">
                  Select a scan from your cloud library <br /> or upload a new resume to initiate <br /> deep analysis.
                </p>
                <div className="flex gap-2 mt-10">
                  {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-800" />)}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
