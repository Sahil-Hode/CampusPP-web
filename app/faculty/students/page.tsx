"use client";

import { useEffect, useState } from "react";
import StudentTable from "../components/StudentTable";
import { Search, Filter, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PERFORMANCE_API = "https://campuspp-f7qx.onrender.com/api";

type Student = {
  _id: string;
  email: string;
  name: string;
  studentId: string;
  instituteName: string;
  dateOfJoin: string;
  instituteId: string;
  Course: string;
  attendance: string;
  classes: string;
  language: string;
  marks: string;
  performance: {
    score: number;
    riskLevel: "High" | "Medium" | "Low";
    trend: string;
    intervention: {
      required: boolean;
      priority?: string;
    };
  };
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const hydrateWithLatestPerformance = async (baseStudents: Student[]) => {
    const token = getToken();

    const settled = await Promise.allSettled(
      baseStudents.map(async (s) => {
        const res = await fetch(`${PERFORMANCE_API}/student/public/performance/${s.studentId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return s;
        const json = await res.json();
        const perf = json?.data?.currentPerformance;
        if (!perf) return s;

        return {
          ...s,
          performance: {
            score: Number(perf.score ?? s.performance?.score ?? 0),
            riskLevel: (perf.riskLevel || s.performance?.riskLevel || "Low") as "High" | "Medium" | "Low",
            trend: String(perf.trends || s.performance?.trend || "Stable"),
            intervention: {
              required: Boolean(perf.intervention?.required),
              priority: perf.intervention?.priority,
            },
          },
        } as Student;
      })
    );

    return settled.map((r, i) => (r.status === "fulfilled" ? r.value : baseStudents[i]));
  };

  const sendFacultyNote = async (studentId: string, note: string) => {
    const token = getToken();
    const facultyName = sessionStorage.getItem("user_name") || localStorage.getItem("user_name") || "Faculty";

    const res = await fetch("/api/faculty-annotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "x-user-name": facultyName,
        "x-user-role": "FACULTY", // hardcoded – this route is only called from the faculty portal
      },
      body: JSON.stringify({
        studentId,
        note,
        metadata: {
          source: "faculty_dashboard_chat",
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || "Failed to send annotation");
    }

    const notificationSent = json?.notification?.attempted
      ? Boolean(json?.notification?.sent)
      : undefined;

    return {
      notificationSent,
      notificationMessage: json?.notification?.message,
    };
  };

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res: any = await apiRequest("/faculty/students", { method: "GET" });
        const rawStudents = res.data || [];
        const mergedStudents = await hydrateWithLatestPerformance(rawStudents);

        setStudents(mergedStudents);
        setFilteredStudents(mergedStudents);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Unable to load students. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (riskFilter !== "all") {
      filtered = filtered.filter(
        (student) => student.performance?.riskLevel?.toLowerCase() === riskFilter.toLowerCase()
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, riskFilter, students]);

  const highRiskCount = students.filter((s) => s.performance?.riskLevel === "High").length;

  return (
    <div className="space-y-8 pb-10">

      {/* 1. HEADER - BUTTONS REMOVED */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase">
            Risk <span className="text-[#63D2F3]">Analysis</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Real-time Academic Performance Monitoring
          </p>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
        >
          <AlertTriangle size={20} />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto text-xs font-black uppercase underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4 p-4 bg-white dark:bg-zinc-900 rounded-4xl border-2 border-slate-50 dark:border-zinc-800 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name, ID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-950 border-none rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-[#63D2F3] transition-all outline-none dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-950 border-none rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-[#63D2F3] cursor-pointer outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          <button className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-2xl text-slate-500 hover:text-[#63D2F3] transition-colors">
            <Filter size={20} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>

      {/* 3. QUICK STATS SUMMARY */}
      <div className="flex flex-wrap gap-8 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Users size={16} className="text-[#63D2F3]" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            Total Enrolled: <span className="text-slate-900 dark:text-white ml-1">{students.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            Urgent Attention: <span className="text-red-500 ml-1">{highRiskCount} Students</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            Showing: <span className="text-slate-900 dark:text-white ml-1">{filteredStudents.length}</span>
          </span>
        </div>
      </div>

      {/* 4. MAIN TABLE SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <StudentTable students={filteredStudents} loading={loading} onSendNote={sendFacultyNote} />
      </motion.div>

    </div>
  );
} 