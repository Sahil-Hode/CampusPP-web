"use client";

import React, { useEffect, useState } from "react";
import {
  Zap,
  FileText,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  Target,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// --- Types ---
type PerformanceData = {
  overview: {
    attendance: string;
    classesAttended: number;
    totalClasses: number;
  };
  scores: {
    averageScore: number;
    grade: string;
  };
  risk: {
    level: "High" | "Medium" | "Low";
    score: number;
    factors: string[];
  };
  trends: {
    labels: string[];
    data: number[];
  };
  intervention: {
    required: boolean;
    status: string;
    actionItems: string[];
  };
  recommendations: string[];
};

// --- Local Components ---

const DashboardCard = ({
  title,
  description,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: "blue" | "purple" | "orange";
}) => {
  const styles = {
    blue: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white border-blue-100 dark:border-blue-900/30",
    purple: "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white border-purple-100 dark:border-purple-900/30",
    orange: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white border-orange-100 dark:border-orange-900/30",
  };

  return (
    <a href={href} className="group block h-full">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${styles[color]}`}>
          <Icon size={28} strokeWidth={2} />
        </div>
        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h4>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{description}</p>

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          <span>Launch Tool</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </a>
  );
};

// --- Local API Helper Removed ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-2xl border border-white/10">
        <p className="font-bold opacity-70 mb-1">{label}</p>
        <p className="font-black text-lg text-[#63D2F3]">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [name, setName] = useState("Student");
  const [stats, setStats] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setName(storedName);

    async function fetchData() {
      try {
        const [
          overviewRes,
          riskRes,
          trendsRes,
          interventionRes,
          scoresRes,
          recRes,
        ] = await Promise.all([
          apiRequest("/student/performance/overview"),
          apiRequest("/student/performance/risk"),
          apiRequest("/student/performance/trends"),
          apiRequest("/student/performance/intervention"),
          apiRequest("/student/performance/scores"),
          apiRequest("/student/performance/recommendations"),
        ]);

        const extract = (res: any) => res?.data || res || {};

        const overview = extract(overviewRes);
        const risk = extract(riskRes);
        const trends = extract(trendsRes);
        const intervention = extract(interventionRes);
        const scores = extract(scoresRes);
        const recommendations = extract(recRes);

        // Normalize Trends: Support both { labels, data } and Array of objects
        let labelsArr: string[] = [];
        let dataArr: number[] = [];

        if (trends.labels && Array.isArray(trends.labels)) {
          labelsArr = trends.labels;
          dataArr = Array.isArray(trends.data) ? trends.data : [];
        } else if (Array.isArray(trends)) {
          labelsArr = trends.map((t: any) => t.label || t.name || t.date || "N/A");
          dataArr = trends.map((t: any) => t.score || t.value || 0);
        }

        setStats({
          overview: {
            attendance: overview.attendance || "0%",
            classesAttended: overview.classesAttended ?? 0,
            totalClasses: overview.totalClasses ?? 0,
          },
          scores: {
            averageScore: scores.averageScore ?? scores.avgScore ?? 0,
            grade: scores.grade || "N/A",
          },
          risk: {
            level: risk.level || "Low",
            score: risk.score ?? 0,
            factors: Array.isArray(risk.factors) ? risk.factors : [],
          },
          trends: {
            labels: labelsArr,
            data: dataArr,
          },
          intervention: {
            required: intervention.required ?? false,
            status: intervention.status || "Safe",
            actionItems: Array.isArray(intervention.actionItems) ? intervention.actionItems : [],
          },
          recommendations: Array.isArray(recommendations)
            ? recommendations
            : recommendations.list || [],
        });
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const trendsData = stats?.trends?.labels?.map((label, index) => ({
    name: label,
    score: stats.trends.data?.[index] ?? 0,
  })) || [];

  const riskStyle = {
    High: "text-red-500 bg-red-500/10 border-red-200 dark:border-red-900/30",
    Medium: "text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-900/30",
    Low: "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30",
  }[stats?.risk?.level || "Low"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 md:p-8 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- HEADER --- */}
        <header className="flex flex-col gap-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="p-1.5 bg-[#63D2F3]/20 rounded-lg text-[#63D2F3]">
              <Sparkles size={14} className="fill-current" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Intelligence Dashboard
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
            Welcome, <span className="text-[#63D2F3]">{name}</span>
          </h1>
        </header>

        {/* --- STATS GRID --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Attendance", value: stats?.overview?.attendance, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Average Score", value: stats?.scores?.averageScore ? `${stats.scores.averageScore}%` : "0%", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Risk Factor", value: stats?.risk?.level || "Low", icon: Shield, color: stats?.risk?.level === "High" ? "text-red-500" : "text-emerald-500", bg: stats?.risk?.level === "High" ? "bg-red-500/10" : "bg-emerald-500/10" },
            { label: "Action Status", value: stats?.intervention?.required ? "Required" : "Healthy", icon: Activity, color: stats?.intervention?.required ? "text-orange-500" : "text-slate-500", bg: stats?.intervention?.required ? "bg-orange-500/10" : "bg-slate-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tight">
                {loading ? "..." : stat.value}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </section>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Performance Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[3rem] shadow-sm flex flex-col min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <TrendingUp size={24} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Progress</h3>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[250px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-300">Syncing charts...</div>
              ) : trendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#63D2F3" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#63D2F3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} dy={10} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#63D2F3" strokeWidth={5} fill="url(#scoreGrad)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-zinc-800/50 rounded-3xl text-slate-400 font-bold">No data available</div>
              )}
            </div>
          </motion.div>

          {/* Risk & Intervention */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-8 rounded-[2.5rem] border ${riskStyle} flex flex-col justify-center`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} strokeWidth={2.5} />
                <h3 className="text-xl font-black tracking-tight uppercase">Risk Profile</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Score</span>
                  <span className="text-5xl font-black leading-none">{stats?.risk?.score || 0}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.risk?.score || 0}%` }}
                    className="h-full bg-current"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm custom-scrollbar"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Required Actions</h3>
              </div>

              <div className="space-y-3">
                {stats?.intervention?.required ? (
                  stats.intervention?.actionItems?.map((item, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-900/20">
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                      <p className="text-xs font-bold text-red-800 dark:text-red-400">{item}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">Perfectly On Track</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Recommendations */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <Lightbulb size={24} className="text-amber-400 fill-current" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personalized Strategies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(stats?.recommendations || []).map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-[#63D2F3]/5 border border-[#63D2F3]/20 p-6 rounded-[2rem] hover:bg-[#63D2F3]/10 transition-colors group"
              >
                <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Target size={20} className="text-[#63D2F3]" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <hr className="border-slate-200 dark:border-zinc-800" />

        {/* QUICK ACTIONS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DashboardCard title="Learning Path" description="AI-generated curriculum personalized for your goals." href="/dashboard/learning-path" icon={Zap} color="blue" />
          <DashboardCard title="Resume Lab" description="Score your CV against industry standards instantly." href="/dashboard/resume-analyzer" icon={FileText} color="purple" />
          <DashboardCard title="AI Career Chat" description="24/7 access to your professional growth mentor." href="/dashboard/chatbot" icon={MessageSquare} color="orange" />
        </section>
      </div>
    </div>
  );
}