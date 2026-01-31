"use client";

import { FileUp, CloudUpload, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";

interface UploadCardProps {
  title: string;
  description?: string;
  isActive: boolean; // Controls if the user can interact
  isCompleted: boolean; // Shows success state
  onUploadSuccess: () => void; // Triggered when "Initialize" is clicked
}

export default function UploadCard({
  title,
  isActive,
  isCompleted,
  onUploadSuccess
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && isActive) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    setUploading(false);
    onUploadSuccess();
  };

  return (
    <div className={`
      relative p-8 rounded-[2.5rem] border-2 transition-all duration-500
      ${isCompleted ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800" : "bg-white dark:bg-zinc-900 border-slate-50 dark:border-zinc-800"}
      ${!isActive && !isCompleted ? "opacity-40 grayscale pointer-events-none" : "opacity-100"}
    `}>

      {!isActive && !isCompleted && (
        <div className="absolute top-6 right-6 text-slate-300">
          <Lock size={18} />
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-[1000] text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
          {title}
          {isCompleted && <CheckCircle2 size={18} className="text-emerald-500" />}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {isCompleted ? "Step Completed" : "Data Ingestion Module"}
        </p>
      </div>

      <label
        className={`
          relative group cursor-pointer flex flex-col items-center justify-center 
          w-full h-48 rounded-[2rem] border-2 border-dashed transition-all
          ${isCompleted ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 dark:border-zinc-800 bg-slate-50/50 hover:border-[#63D2F3]/50"}
        `}
      >
        <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileChange} disabled={!isActive || isCompleted} />

        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-2xl transition-all ${isCompleted ? "bg-emerald-500 text-white" : "bg-white text-[#63D2F3] shadow-sm"}`}>
            {isCompleted ? <CheckCircle2 size={28} /> : <CloudUpload size={28} />}
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider px-4 truncate max-w-[200px]">
              {isCompleted ? "Successfully Parsed" : file ? file.name : "Drop file here"}
            </p>
          </div>
        </div>
      </label>

      <button
        onClick={handleUpload}
        disabled={!file || isCompleted || !isActive}
        className={`w-full mt-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
          ${isCompleted
            ? "bg-emerald-500 text-white cursor-default"
            : file
              ? "bg-slate-900 dark:bg-[#63D2F3] text-white dark:text-slate-900 shadow-[0_5px_0_0_#000] active:translate-y-[4px] active:shadow-none"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"}
        `}
      >
        <FileUp size={14} strokeWidth={3} />
        {uploading ? "Uploading..." : isCompleted ? "Data Locked" : "Initialize Upload"}
      </button>
    </div>
  );
}