"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Sparkles,
  X,
  CheckCircle2,
  Trash2,
  Clock,
  Loader2,
  ThumbsUp,
  Lightbulb,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";

// Matches the API documentation structure
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
  _id: string; // or analysisId
  fileName?: string;
  fileSizeKB?: string;
  status?: string;
  analysis: APIAnalysisDetail;
  summary?: {
    strengthsCount: number;
    improvementsCount: number;
    skillsSuggested: number;
  };
  createdAt: string;
};

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch History on Mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setError(null);
      setLoadingHistory(true);
      const res = await apiRequest("/resume/", { method: "GET" });

      // Docs: { status: "success", data: { count: 5, analyses: [...] } }
      const list = res.data?.analyses || [];
      setAnalyses(list);

      // Auto-select latest
      if (list.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
      // Silent error for history fetch
    } finally {
      setLoadingHistory(false);
    }
  }

  // Validate File (Max 5MB)
  const validateFile = (file: File) => {
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isWord = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword" ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".doc");

    if (!isPDF && !isWord) {
      setError("Only PDF and Word documents are supported.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (validateFile(selected)) {
        setFile(selected);
        setError(null);
      } else {
        setFile(null);
      }
    }
  };

  // Handle Analysis: POST /api/resume/analyze
  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    // Official Docs: Body `file` is required.
    formData.append("file", file);

    try {
      const res = await apiRequest("/resume/analyze", {
        method: "POST",
        body: formData,
      });

      // Normalize Response
      const rawData = res.data || {};
      console.log("Resume Analysis Response:", rawData);

      const newAnalysis: AnalysisItem = {
        _id: rawData.analysisId || rawData._id || Date.now().toString(),
        fileName: file.name,
        fileSizeKB: (file.size / 1024).toFixed(1),
        createdAt: rawData.createdAt || new Date().toISOString(),
        summary: rawData.summary,
        analysis: rawData.analysis || {
          atsScore: rawData.atsScore || 0,
          overallRating: rawData.overallRating || "N/A",
          mainStrengths: [],
          criticalImprovements: [],
          keywordOptimization: [],
          missingOrSuggestedSkills: []
        }
      };

      setAnalyses([newAnalysis, ...analyses]);
      setSelectedAnalysis(newAnalysis);
      setFile(null);

    } catch (err: any) {
      console.error("Analysis failed", err);
      // Extract specific error message if available
      const msg = err.message || (err.error ? err.error : "Failed to analyze resume. Server might be busy.");
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Selection (Lazy Load Full Details if missing)
  const handleSelectAnalysis = async (item: AnalysisItem) => {
    // If we already have details (strengths/improvements), just show it
    if (item.analysis.mainStrengths && item.analysis.mainStrengths.length > 0) {
      setSelectedAnalysis(item);
      return;
    }

    // Otherwise, fetch full details: GET /api/resume/:id
    try {
      setSelectedAnalysis(item); // Show skeleton/loading state potentially?
      const res = await apiRequest(`/resume/${item._id}`, { method: "GET" });

      // Docs: { data: { analysis: { _id, analysis: { ... } } } }
      // The inner analysis object has the deep fields
      const fullData = res.data?.analysis;

      if (fullData) {
        const fullAnalysisValue = fullData.analysis || {};

        // Update local state with full details
        const updatedItem: AnalysisItem = {
          ...item,
          createdAt: fullData.createdAt || fullData.processedAt || item.createdAt,
          summary: fullData.summary || item.summary,
          analysis: {
            ...item.analysis,
            ...fullAnalysisValue
          }
        };

        setAnalyses(prev => prev.map(a => a._id === item._id ? updatedItem : a));
        setSelectedAnalysis(updatedItem);
      }
    } catch (err) {
      console.error("Failed to fetch full analysis details", err);
      // Fallback: keep showing what we have
    }
  };

  // Handle Delete: DELETE /api/resume/:id
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this analysis report?")) return;

    try {
      await apiRequest(`/resume/${id}`, { method: "DELETE" });

      const updated = analyses.filter(a => a._id !== id);
      setAnalyses(updated);

      // If deleted active item, select next available
      if (selectedAnalysis?._id === id) {
        setSelectedAnalysis(updated[0] || null);
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      alert("Could not delete analysis.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Upload & History (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Upload Card */}
          <div className={`
                relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl border-4 border-dashed rounded-[2.5rem] p-8 
                flex flex-col items-center justify-center text-center transition-all duration-300
                ${file
              ? 'border-[#63D2F3] bg-[#63D2F3]/5 dark:bg-[#63D2F3]/5'
              : 'border-slate-100 dark:border-zinc-800 hover:border-[#63D2F3]/30 dark:hover:border-[#63D2F3]/20 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30'}
            `}>
            <motion.div
              animate={file ? { rotate: [0, 5, -5, 0] } : {}}
              className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500
                        ${file
                  ? 'bg-[#63D2F3] text-white shadow-lg'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-300 dark:text-slate-600'}
                    `}
            >
              {file ? <FileCheck size={28} strokeWidth={3} /> : <Upload size={28} strokeWidth={3} />}
            </motion.div>

            {file ? (
              <div className="space-y-3 w-full">
                <p className="text-sm font-black text-slate-800 dark:text-white truncate px-4 max-w-[200px] mx-auto">{file.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={() => setFile(null)}
                  className="flex items-center gap-2 mx-auto px-3 py-1.5 bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-500 hover:border-rose-200"
                >
                  <X size={12} strokeWidth={3} /> Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-black text-slate-800 dark:text-white">Upload Resume</p>
                <p className="text-xs font-bold text-slate-400">PDF or Word (Max 5MB)</p>
                <label className="cursor-pointer inline-block px-6 py-2 bg-slate-900 dark:bg-white hover:opacity-90 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 transition-all">
                  Browse Files
                  <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="w-full bg-[#63D2F3] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_6px_0_0_#48BBDB] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
            {analyzing ? "Run Analysis" : "Analyze Now"}
          </button>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-start gap-2 text-left">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* History List */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Past Scans</h3>

            {loadingHistory ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : analyses.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No history found.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {analyses.map((item) => (
                  <motion.div
                    key={item._id}
                    layoutId={item._id}
                    onClick={() => handleSelectAnalysis(item)}
                    className={`
                                    p-4 rounded-xl flex items-center justify-between cursor-pointer border-2 transition-all
                                    ${selectedAnalysis?._id === item._id
                        ? 'bg-[#63D2F3]/10 border-[#63D2F3]'
                        : 'bg-slate-50 dark:bg-zinc-800/50 border-transparent hover:border-slate-200 dark:hover:border-zinc-700'}
                                `}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {item.fileName || "Resume Scan"}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black ${(item.analysis?.atsScore || 0) >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                        {item.analysis?.atsScore || 0}%
                      </span>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="p-1.5 hover:bg-rose-100 text-slate-300 hover:text-rose-500 rounded-lg transition-colors group"
                        title="Delete Analysis"
                      >
                        <Trash2 size={12} className="group-hover:stroke-rose-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedAnalysis ? (
              <motion.div
                key={selectedAnalysis._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden h-full"
              >
                {/* Score Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                  <div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase text-slate-500">
                        <FileCheck size={12} />
                        Analysis Report
                      </div>
                      {selectedAnalysis.summary && (
                        <>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full text-[10px] font-black uppercase text-green-500">
                            {selectedAnalysis.summary.strengthsCount} Strengths
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full text-[10px] font-black uppercase text-orange-500">
                            {selectedAnalysis.summary.improvementsCount} Fixes
                          </div>
                        </>
                      )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mt-4">
                      ATS Score
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2">
                      Rating: <span className="text-[#63D2F3]">{selectedAnalysis.analysis.overallRating}</span>
                    </p>
                  </div>

                  <div className="relative">
                    <span className={`text-6xl md:text-8xl font-black tracking-tighter ${(selectedAnalysis.analysis.atsScore || 0) >= 70 ? 'text-[#63D2F3]' : 'text-orange-400'}`}>
                      {selectedAnalysis.analysis.atsScore || 0}
                    </span>
                    <span className="text-2xl font-bold text-slate-300 absolute top-2 -right-6">%</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="h-6 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedAnalysis.analysis.atsScore || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${(selectedAnalysis.analysis.atsScore || 0) >= 70 ? 'bg-[#63D2F3]' : 'bg-orange-400'}`}
                  />
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Strengths */}
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-[2rem] border border-green-100 dark:border-green-900/30">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-green-600 mb-4">
                      <ThumbsUp size={16} /> Main Strengths
                    </h4>
                    <ul className="space-y-3">
                      {selectedAnalysis.analysis.mainStrengths?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      )) || <li className="text-sm text-slate-400">No strengths listed.</li>}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-900/30">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-orange-600 mb-4">
                      <Lightbulb size={16} /> Critical Improvements
                    </h4>
                    <ul className="space-y-3">
                      {selectedAnalysis.analysis.criticalImprovements?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      )) || <li className="text-sm text-slate-400">No improvements listed.</li>}
                    </ul>
                  </div>
                </div>

                {/* Keyword Advice & Formatting */}
                <div className="grid grid-cols-1 gap-6 mt-6">
                  {/* Formatting Advice */}
                  {(selectedAnalysis.analysis.formattingAndStructureAdvice?.length || 0) > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                      <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600 mb-4">
                        <FileText size={16} /> Formatting Advice
                      </h4>
                      <ul className="space-y-2">
                        {selectedAnalysis.analysis.formattingAndStructureAdvice?.map((advice, i) => (
                          <li key={i} className="text-sm font-bold text-slate-600 dark:text-slate-300 flex gap-2">
                            <span className="text-indigo-400">•</span> {advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keyword Optimization */}
                  {(selectedAnalysis.analysis.keywordOptimization?.length || 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/30">
                      <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-600 mb-4">
                        <Sparkles size={16} /> Keyword Optimization
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedAnalysis.analysis.keywordOptimization?.map((advice, i) => (
                          <div key={i} className="p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {advice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {(selectedAnalysis.analysis.missingOrSuggestedSkills?.length || 0) > 0 && (
                    <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-[2rem]">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">
                        Missing Keywords / Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.analysis.missingOrSuggestedSkills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 dark:bg-zinc-900/50 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem] opacity-50">
                <Upload size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-400">No Analysis Selected</h3>
                <p className="text-sm font-bold text-slate-300">Upload a resume or select from history</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}