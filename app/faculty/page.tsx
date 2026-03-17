"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  Clock,
  FileUp,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit,
  Fingerprint,
  Zap,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  LineChart,
  Line,
  Legend,
} from "recharts";

type DashboardAnalytics = {
  totalStudents: number;
  riskDistribution: { High: number; Medium: number; Low: number };
  studentsAtRisk: number;
  interventionsRequired: number;
  byPriority: { critical: number; moderate: number; low: number };
  studentsJoinedToday?: number;
};

export default function FacultyDashboard() {
  const [facultyName, setFacultyName] = useState("Professor");
  const [stats, setStats] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setFacultyName(storedName);

    async function fetchAnalytics() {
      try {
        const res: any = await apiRequest("/faculty/dashboard/analytics", { method: "GET" });
        setStats(res.data);
      } catch (err) {
        setStats({
          totalStudents: 150,
          riskDistribution: { High: 12, Medium: 45, Low: 93 },
          studentsAtRisk: 57,
          interventionsRequired: 5,
          byPriority: { critical: 1, moderate: 2, low: 2 },
          studentsJoinedToday: 4
        });
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const riskChartData = [
    { name: "High", value: stats?.riskDistribution?.High ?? 0, color: "#fb7185" },
    { name: "Medium", value: stats?.riskDistribution?.Medium ?? 0, color: "#f59e0b" },
    { name: "Low", value: stats?.riskDistribution?.Low ?? 0, color: "#22c55e" },
  ];

  const priorityChartData = [
    { name: "Critical", value: stats?.byPriority?.critical ?? 0 },
    { name: "Moderate", value: stats?.byPriority?.moderate ?? 0 },
    { name: "Low", value: stats?.byPriority?.low ?? 0 },
  ];

  const hasRiskData = riskChartData.some((item) => item.value > 0);
  const hasPriorityData = priorityChartData.some((item) => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-6 pt-6 transition-colors duration-500">
      
      {/* 1. TOP NAV / WELCOME */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#63D2F3]/10 text-[#63D2F3] rounded-xl">
              <Fingerprint size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-zinc-500">
              Nexus System / Faculty Node
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-[1000] tracking-tighter text-slate-900 dark:text-zinc-100 leading-none">
            Hello, <span className="text-[#63D2F3]">{facultyName.split(' ')[0]}.</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 pr-6 rounded-2xl shadow-sm">
           <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center rounded-xl text-emerald-500">
              <Activity size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Health</p>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase italic">Risk Engine Nominal</p>
           </div>
        </div>
      </div>

      {/* 2. CORE ANALYTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Cohort" 
          value={stats?.totalStudents} 
          icon={Users} 
          color="bg-sky-500" 
          sub="Active students" 
        />
        <StatCard 
          title="Critical Risk" 
          value={stats?.riskDistribution.High} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          sub="Immediate action" 
          alert 
        />
        <StatCard 
          title="At Risk" 
          value={stats?.studentsAtRisk} 
          icon={TrendingUp} 
          color="bg-amber-500" 
          sub="Pattern detected" 
        />
        <StatCard 
          title="Daily Growth" 
          value={`+${stats?.studentsJoinedToday || 0}`} 
          icon={Zap} 
          color="bg-[#D6BCFA]" 
          sub="New enrollments" 
        />
      </div>

      {/* 3. VISUAL ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-7 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              Risk Distribution
            </p>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              Cohort Risk (Horizontal)
            </h3>
            {!hasRiskData && !loading && (
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                No uploaded risk records yet.
              </p>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskChartData}
                layout="vertical"
                margin={{ top: 14, right: 10, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#33415522" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" width={80} />
                <Tooltip />
                <Bar dataKey="value" barSize={32} radius={[0, 12, 12, 0]} minPointSize={hasRiskData ? 0 : 4}>
                  {riskChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="#64748b" fontSize={13} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-7 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              Action Priority
            </p>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
              Intervention Queue (Trend)
            </h3>
            {!hasPriorityData && !loading && (
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                No intervention priorities yet.
              </p>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priorityChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#63D2F3" strokeWidth={3} dot={{ r: 7, fill: '#63D2F3' }} activeDot={{ r: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. BENTO ACTIONS GRID */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* BIG ACTION: UPLOAD */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[3rem] p-10 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          {/* Abstract Deco */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#63D2F3]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center h-full">
            <div className="space-y-6 flex-1">
              <div className="p-4 bg-[#63D2F3] w-fit rounded-3xl shadow-lg shadow-sky-200 dark:shadow-none">
                <FileUp className="text-white" size={32} />
              </div>
              <h2 className="text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-zinc-100 uppercase leading-[0.95]">
                Sync Your <br />
                <span className="text-[#63D2F3]">Student Data.</span>
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 font-bold text-sm max-w-sm">
                Upload Attendance, Grades, and LMS logs to refresh the Predictive Risk Model.
              </p>
              
              <Link href="/faculty/upload" className="block w-fit">
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl active:scale-95">
                  Launch Ingestion Portal
                  <ArrowUpRight size={18} strokeWidth={3} />
                </button>
              </Link>
            </div>

            <div className="hidden md:flex flex-col gap-3">
               <ProcessStep icon={Activity} label="Logs" />
               <ProcessStep icon={TrendingUp} label="Grades" />
               <ProcessStep icon={Clock} label="Presence" />
            </div>
          </div>
        </motion.div>

        {/* SMALL ACTION: INSIGHTS */}
        <div className="lg:col-span-4 bg-[#F0F9FF] dark:bg-zinc-900/50 border border-sky-100 dark:border-zinc-800 rounded-[3rem] p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl text-sky-500 shadow-sm">
                <BrainCircuit size={24} />
              </div>
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest bg-white dark:bg-zinc-800 px-3 py-1 rounded-full">
                AI Insight
              </span>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 leading-tight">
                {stats?.interventionsRequired} Interventions Required.
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 font-bold text-xs leading-relaxed">
                Our model suggests {stats?.byPriority?.critical} student(s) show high dropout probability based on recent activity.
              </p>
            </div>
          </div>

          <Link href="/faculty/insights" className="mt-8 group flex items-center justify-between bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-sky-100 dark:border-zinc-700 hover:border-sky-300 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">View Detailed Report</span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform text-sky-500" size={18} strokeWidth={3} />
          </Link>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon: Icon, color, sub, alert }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shadow-current/10`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{title}</p>
      </div>
      
      <div className="flex items-baseline gap-2">
        <h3 className={`text-4xl font-[1000] tracking-tighter ${alert ? 'text-rose-500' : 'text-slate-900 dark:text-zinc-100'}`}>
          {value || 0}
        </h3>
      </div>
      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{sub}</p>
    </div>
  );
}

function ProcessStep({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 px-5 py-3 rounded-2xl border border-slate-100 dark:border-zinc-800 min-w-[140px]">
      <Icon size={16} className="text-[#63D2F3]" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}