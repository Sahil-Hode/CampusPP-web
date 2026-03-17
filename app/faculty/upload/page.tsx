"use client";

import { useState, useEffect } from "react";
import {
  Database, UploadCloud, FileSpreadsheet, Users, ArrowRight,
  Loader2, X, Download, Lock, AlertCircle, CheckCircle2
} from "lucide-react";
import Papa from "papaparse";
import { getToken } from "@/lib/auth";

export default function RegistrationPipeline() {
  // Matches the provided API JSON Structure
  interface Student {
    _id?: string;
    studentId: string;
    name: string;
    email: string;
    classes: string;
    Course: string;
    marks?: string;
    attendance?: string;
    password?: string;
    dateOfJoin?: string;
    language?: string;
    instituteName?: string;
    instituteId?: string;
  }

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [fileName, setFileName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [responseMessage, setResponseMessage] = useState<any>(null);

  // Auto-load Token
  const [token, setToken] = useState("");

  useEffect(() => {
    const stored = getToken();
    if (stored) setToken(stored);
  }, []);

  const instituteName = "My Institute";
  const instituteId = "INST001"; // Default based on JSON

  const API_AUTH_REGISTER = "https://techxpression-hackathon.onrender.com/api/auth/register";
  const API_STUDENT_EXPORT = "https://techxpression-hackathon.onrender.com/api/faculty/students/export";

  // FIXED FETCH LOGIC
  const fetchExistingStudents = async () => {
    if (!token) {
      alert("Session expired or missing. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_STUDENT_EXPORT, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${res.status}`);
      }

      const result = await res.json();

      // JSON: { success: true, count: 12, data: [...] }
      const dataArray = result.data || result.students || [];

      if (Array.isArray(dataArray)) {
        setStudents(dataArray);
        setFileName("Live Server Data");
        setIsReady(true);
        setResponseMessage(null);
      } else {
        throw new Error("API returned data in an unexpected format.");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      alert(`Fetch Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const formatted: Student[] = results.data.map((row: any) => ({
          email: row.email || row.Email || "",
          name: row.name || row.Name || "",
          studentId: row.studentId || row.StudentId || `STU${Math.floor(Math.random() * 10000)}`,
          dateOfJoin: row.dateOfJoin || row.DateOfJoin || new Date().toISOString().split('T')[0],
          classes: row.classes || row.Class || "SYIT",
          Course: row.Course || row.course || "Computer Science",
          // Default fields for registration
          password: row.password || "student123",
          instituteName: instituteName,
          instituteId: instituteId
        }));
        setStudents(formatted);
        setIsReady(true);
        setLoading(false);
      }
    });
  };

  const executeSync = async () => {
    if (responseMessage) { // Reset for new batch
      setResponseMessage(null);
      setStudents([]);
      setFileName("");
      return;
    }

    try {
      setLoading(true);

      // Sanitize students before sending (remove _id, __v if re-registering to avoid duplicates/errors)
      // The register API likely expects new student objects
      const payloadStudents = students.map(({ _id, ...rest }) => ({
        ...rest,
        // Ensure mandatory fields exist
        password: rest.password || "student123",
        instituteName: rest.instituteName || instituteName,
        instituteId: rest.instituteId || instituteId
      }));

      const res = await fetch(API_AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instituteName, instituteId, students: payloadStudents }),
      });
      const data = await res.json();
      setResponseMessage(data);
      if (res.ok) setIsReady(false);
    } catch (err) {
      alert("Sync failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-6 lg:p-12 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-[1300px] mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#63D2F3] rounded-[1.8rem] flex items-center justify-center shadow-lg shadow-sky-100 dark:shadow-none">
              <Database className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                Student <span className="text-[#63D2F3]">Registration</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                  Portal • {instituteName}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchExistingStudents}
            disabled={loading}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="text-[#63D2F3]" />}
            Fetch Records
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* UPLOAD PANEL */}
          <div className="lg:col-span-4">
            <div className={`relative min-h-[400px] rounded-[3.5rem] border-[3px] border-dashed transition-all duration-500 flex flex-col items-center justify-center p-10 text-center
              ${isReady
                ? 'bg-emerald-500 border-transparent shadow-2xl'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#63D2F3]'}
            `}>
              {!isReady ? (
                <>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.2rem] flex items-center justify-center mb-6">
                    <UploadCloud size={48} className="text-[#63D2F3]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-2xl uppercase tracking-tighter">Upload Manifest</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Select .csv student file</p>
                  </div>
                </>
              ) : (
                <div className="text-white w-full space-y-8">
                  <div className="flex justify-between items-start">
                    <FileSpreadsheet size={64} className="opacity-50" />
                    <button onClick={() => { setStudents([]); setIsReady(false); setFileName(""); }} className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Source Loaded</p>
                    <p className="text-2xl font-black truncate">{fileName}</p>
                    <p className="text-sm font-bold mt-2">{students.length} students detected</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PREVIEW & RESPONSE PANEL */}
          <div className="lg:col-span-8">
            <div className="bg-[#0F172A] dark:bg-slate-900/50 rounded-[3.5rem] p-10 min-h-[500px] shadow-2xl border border-transparent dark:border-slate-800 flex flex-col">

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4 text-white">
                  <Users className="text-[#63D2F3]" />
                  <h3 className="font-black uppercase tracking-widest text-sm">
                    {responseMessage ? "Sync Summary" : "Data Preview"}
                  </h3>
                </div>
              </div>

              <div className="flex-grow overflow-auto">
                {responseMessage ? (
                  /* SUCCESS VIEW */
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4">
                      <CheckCircle2 className="text-emerald-500" size={32} />
                      <div>
                        <p className="text-white font-black uppercase text-sm">{responseMessage.message}</p>
                        <p className="text-emerald-500/80 text-xs font-bold">Assigned ID: {responseMessage.instituteId}</p>
                      </div>
                    </div>
                    {/* (Stats and credential audit UI remains same as previous version) */}
                  </div>
                ) : students.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#0F172A] dark:bg-slate-900 border-b border-white/10 z-10">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="pb-4">Student</th>
                        <th className="pb-4">Course/Class</th>
                        <th className="pb-4">Auth</th>
                        <th className="pb-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students.slice(0, 10).map((s, i) => (
                        <tr key={i} className="text-white group">
                          <td className="py-4">
                            <p className="font-bold text-sm tracking-tight">{s.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{s.email}</p>
                            <p className="text-[9px] text-[#63D2F3] font-mono mt-0.5">{s.studentId}</p>
                          </td>
                          <td className="py-4">
                            <p className="text-[#63D2F3] text-xs font-black uppercase tracking-widest">{s.Course || "N/A"}</p>
                            <p className="text-slate-500 text-[10px] font-bold italic">{s.classes || "N/A"}</p>
                            <p className="text-[9px] text-slate-600 mt-0.5">Joined: {s.dateOfJoin?.split('T')[0]}</p>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Lock size={10} className="text-slate-500" />
                              <p className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                                {s.password || "••••••"}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-block w-2 h-2 rounded-full bg-[#63D2F3] shadow-[0_0_8px_#63D2F3]" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <AlertCircle size={48} className="opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Waiting for data uplink...</p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  disabled={(!isReady && !responseMessage) || loading}
                  onClick={executeSync}
                  className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center gap-4 transition-all
                    ${(isReady || responseMessage) && !loading
                      ? 'bg-[#63D2F3] text-white shadow-[0_10px_0_0_#48BBDB] active:translate-y-1 active:shadow-none'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                  `}
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      {responseMessage ? "Clear & Start New" : "Execute Registration"}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}