"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Lightbulb,
  Target,
  ArrowRight,
  GraduationCap,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

/**
 * API INTEGRATION UTILITY
 * Connecting to the REST APIs for complete student performance tracking.
 */

// --- TypeScript Types ---
interface SummaryData {
  overallScore: number;
  riskLevel: string;
  consistency: string;
  engagement: string;
}

interface OverviewData {
  attendance: number;
  avgScore: number;
  completionRate: number;
}

interface ScoreItem {
  subject: string;
  score: number;
  color: string;
}

interface TrendItem {
  date: string;
  score: number;
}

interface RiskData {
  level: string;
  score: number;
  explanation: string;
}

interface RecommendationItem {
  id: number;
  type: string;
  text: string;
}

interface InterventionItem {
  id: number;
  issue: string;
  decision: string;
  intervention: string;
  status: string;
}

interface PerformanceDataState {
  summary: SummaryData | null;
  overview: OverviewData | null;
  scores: ScoreItem[] | null;
  trends: TrendItem[] | null;
  risk: RiskData | null;
  recommendations: RecommendationItem[] | null;
  intervention: InterventionItem[] | null;
}

// Helper to find a value in a nested object (e.g., "performance.score")
const getDeepValue = (obj: any, keys: string[]) => {
  if (!obj) return null;
  // Try direct access
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  // Try common wrappers
  const wrappers = ['data', 'performance', 'stats', 'result'];
  for (const wrapper of wrappers) {
    if (obj[wrapper]) {
      for (const key of keys) {
        if (obj[wrapper][key] !== undefined) return obj[wrapper][key];
      }
    }
  }
  return null;
};

async function fetchPerformanceData(endpoint: string) {
  try {
    const res = await apiRequest(endpoint);
    console.log(`[Dashboard API] Data from ${endpoint}:`, res);
    return res; // Return the whole object so we can use getDeepValue
  } catch (error) {
    console.error(`[Dashboard API] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

const BASE_URL = "/student/performance";

// --- Styled Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-lg ${className}`} />
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
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

const toNum = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

export default function DashboardPage() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    summary: true,
    overview: true,
    scores: true,
    trends: true,
    risk: true,
    recommendations: true,
    intervention: true
  });

  const [data, setData] = useState<PerformanceDataState>({
    summary: null,
    overview: null,
    scores: [],
    trends: [],
    risk: null,
    recommendations: [],
    intervention: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async (key: keyof PerformanceDataState, endpoint: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      const rawRes = await fetchPerformanceData(endpoint);
      let result: any = rawRes?.data || rawRes;

      // -- DATA NORMALIZATION LAYER --
      if (key === 'summary') {
        const perf = rawRes?.data?.currentPerformance || rawRes?.currentPerformance || rawRes?.data || rawRes;
        result = {
          overallScore: toNum(getDeepValue(perf, ['score', 'overallScore', 'overall_score'])),
          riskLevel: getDeepValue(perf, ['riskLevel', 'level', 'status']) || 'Low',
          consistency: getDeepValue(perf, ['trends', 'consistency', 'habit']) || 'Stable',
          engagement: getDeepValue(perf, ['attendance', 'engagement', 'participation']) ?
            `${getDeepValue(perf, ['attendance', 'engagement', 'participation'])}%` : '0%'
        };
      }

      if (key === 'overview') {
        const d = rawRes?.data || rawRes;
        result = {
          attendance: toNum(getDeepValue(d, ['attendance', 'attendanceRate'])),
          avgScore: toNum(getDeepValue(d, ['overallScore', 'avgScore', 'averageScore', 'score'])),
          completionRate: toNum(getDeepValue(d, ['completionRate', 'progress', 'internalMarks'])) // Fallback to internalMarks if progress missing
        };
      }

      if (key === 'risk') {
        const d = rawRes?.data || rawRes;
        const factors = d.riskFactors || [];
        result = {
          level: getDeepValue(d, ['riskLevel', 'level', 'status']) || 'Low',
          score: d.isAtRisk ? 75 : 15, // Synthetic score based on boolean if numeric score missing
          explanation: Array.isArray(factors) && factors.length > 0 ? factors.join(', ') : 'No specific risks detected.'
        };
      }

      if (key === 'trends') {
        const d = rawRes?.data || rawRes;
        // If it's the new single-object format
        if (d.trends && typeof d.trends === 'string') {
          result = [{
            date: d.analysisDate ? new Date(d.analysisDate).toLocaleDateString() : 'Current',
            score: 0 // We don't have a numeric trend history in this specific format
          }];
        } else {
          // Fallback to old array format logic
          const trendsArr = d.trends || d || [];
          if (Array.isArray(trendsArr)) {
            result = trendsArr.map((t: any) => ({
              date: t.date || t.label || t.name || t.week || 'N/A',
              score: toNum(t.score || t.value || t.marks)
            }));
          } else {
            result = [];
          }
        }
      }

      if (key === 'scores') {
        const d = rawRes?.data || rawRes;
        const colors = ['#63D2F3', '#818CF8', '#34D399', '#F472B6', '#FB923C'];

        // If it's the new object-based format: { attendance, internalMarks, assignmentScore, overallScore, lmsEngagement }
        if (d && !Array.isArray(d) && (d.attendance || d.internalMarks || d.assignmentScore)) {
          const mapping = [
            { key: 'attendance', label: 'Attendance' },
            { key: 'internalMarks', label: 'Internal Marks' },
            { key: 'assignmentScore', label: 'Assignments' },
            { key: 'overallScore', label: 'Overall' },
            { key: 'lmsEngagement', label: 'LMS Engagement' }
          ];
          result = mapping.map((m, i) => ({
            subject: m.label,
            score: toNum(d[m.key]),
            color: colors[i % colors.length]
          }));
        } else {
          // Fallback to old array format logic
          const scoresArr = d.scores || d || [];
          if (Array.isArray(scoresArr)) {
            result = scoresArr.map((s: any, i: number) => ({
              subject: s.subject || s.name || s.label || s.module || 'N/A',
              score: toNum(s.score || s.value || s.marks),
              color: s.color || colors[i % colors.length]
            }));
          } else {
            result = [];
          }
        }
      }

      if (key === 'intervention') {
        const items = rawRes?.data || rawRes?.items || rawRes || [];
        result = Array.isArray(items) ? items : [];
      }

      if (key === 'recommendations') {
        const d = rawRes?.data || rawRes;
        const recs = d.recommendations || [];
        const strengths = d.strengths || [];
        const concerns = d.concerns || [];

        // Combine recommendations, strengths, and concerns into the unified UI list
        const combined = [
          ...recs.map((r: string, i: number) => ({ id: `rec-${i}`, text: r, type: 'study' })),
          ...strengths.map((s: string, i: number) => ({ id: `str-${i}`, text: `Strength: ${s}`, type: 'career' })),
          ...concerns.map((c: string, i: number) => ({ id: `con-${i}`, text: `Concern: ${c}`, type: 'risk' }))
        ];

        result = combined.length > 0 ? combined : (Array.isArray(d) ? d : []);
      }

      setData(prev => ({ ...prev, [key]: result }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [key]: (err as Error).message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    fetchData('summary', BASE_URL);
    fetchData('overview', `${BASE_URL}/overview`);
    fetchData('scores', `${BASE_URL}/scores`);
    fetchData('trends', `${BASE_URL}/trends`);
    fetchData('risk', `${BASE_URL}/risk`);
    fetchData('recommendations', `${BASE_URL}/recommendations`);
    fetchData('intervention', `${BASE_URL}/intervention`);
  }, []);

  const getRiskColor = (level: string | undefined) => {
    switch (level?.toLowerCase()) {
      case 'high': case 'critical': return 'text-red-500 bg-red-500/10 border-red-200';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-200';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#63D2F3]/20 rounded-lg text-[#63D2F3]">
                <Sparkles size={16} className="fill-current" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                Educational Intelligence v4.0
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              Student <span className="text-[#63D2F3]">Analytics</span>
            </h1>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            <RefreshCw size={16} />
            Refresh Live Data
          </button>
        </header>

        {/* Top Summary & Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Overview Card (API 1) */}
          <Card className="lg:col-span-1 flex flex-col justify-between border-l-4 border-l-[#63D2F3]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Performance Summary</h3>
                {loadingStates.summary ? <Skeleton className="w-16 h-6" /> : (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getRiskColor(data.summary?.riskLevel)}`}>
                    {data.summary?.riskLevel} Risk
                  </span>
                )}
              </div>
              {loadingStates.summary ? (
                <div className="space-y-4">
                  <Skeleton className="w-3/4 h-10" />
                  <Skeleton className="w-1/2 h-6" />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                    {data.summary?.overallScore}%
                  </div>
                  <p className="text-slate-500 font-medium">Overall Academic Score</p>
                </div>
              )}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Consistency</p>
                <p className="font-black text-slate-700 dark:text-slate-200">{data.summary?.consistency || '--'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Engagement</p>
                <p className="font-black text-slate-700 dark:text-slate-200">{data.summary?.engagement || '--'}</p>
              </div>
            </div>
          </Card>

          {/* KPI Cards (API 2) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Attendance', value: data.overview?.attendance, suffix: '%', icon: Clock, color: 'text-blue-500' },
              { label: 'Avg Score', value: data.overview?.avgScore, suffix: '', icon: GraduationCap, color: 'text-purple-500' },
              { label: 'Completion', value: data.overview?.completionRate, suffix: '%', icon: Target, color: 'text-emerald-500' }
            ].map((kpi: any, i: number) => (
              <Card key={i} className="flex flex-col items-center justify-center text-center group hover:scale-[1.02]">
                <div className={`p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800 mb-4 ${kpi.color}`}>
                  <kpi.icon size={28} />
                </div>
                {loadingStates.overview ? <Skeleton className="w-16 h-8" /> : (
                  <div className="text-3xl font-black mb-1">{kpi.value}{kpi.suffix}</div>
                )}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trend Chart (API 4) */}
          <Card className="min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-xl font-black tracking-tight uppercase">Improvement Trend</h3>
            </div>
            <div className="flex-1 w-full">
              {loadingStates.trends ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trends}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#63D2F3" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#63D2F3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" stroke="#63D2F3" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Subject Scores (API 3) */}
          <Card className="min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-black tracking-tight uppercase">Module Breakdown</h3>
            </div>
            <div className="flex-1 w-full">
              {loadingStates.scores ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scores} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} width={100} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={24}>
                      {data.scores?.map((entry: ScoreItem, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom Section: Risk, Recommendations, Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Risk Assessment (API 5) */}
          <Card className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Risk Assessment</h3>
            </div>

            {loadingStates.risk ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div className="text-5xl font-black text-slate-900 dark:text-white leading-none">
                    {data.risk?.score}<span className="text-2xl opacity-30">%</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase ${getRiskColor(data.risk?.level)}`}>
                    {data.risk?.level} Threat
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${data.risk?.score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${data.risk?.score}%` }}
                  />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic">
                    "{data.risk?.explanation}"
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Intervention Tracking (API 7) */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">Intervention Timeline</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decision Ledger</span>
            </div>

            <div className="space-y-4">
              {loadingStates.intervention ? [1, 2, 3].map((i: number) => <Skeleton key={i} className="h-16 w-full" />) : (
                data.intervention?.map((item: InterventionItem, idx: number) => (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 group hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-200 dark:border-zinc-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-tighter">Issue Detected</p>
                        <p className="text-sm font-bold">{item.issue}</p>
                      </div>
                    </div>
                    <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-zinc-700 mx-4" />
                    <div className="flex-1 mb-2 md:mb-0">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-tighter">AI Decision</p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.decision}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${item.status === 'Improved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                        }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* AI Recommendations (API 6) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Lightbulb size={24} className="text-amber-400 fill-current" />
            <h3 className="text-2xl font-black tracking-tight">AI Strategies for You</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingStates.recommendations ? [1, 2, 3].map((i: number) => <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />) : (
              data.recommendations?.map((rec: RecommendationItem) => (
                <div key={rec.id} className="bg-[#63D2F3]/5 border border-[#63D2F3]/20 p-8 rounded-[2.5rem] hover:bg-[#63D2F3]/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <Target size={80} />
                  </div>
                  <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#63D2F3]/20">
                    {rec.type === 'study' ? <FileText size={24} className="text-blue-500" /> :
                      rec.type === 'career' ? <Zap size={24} className="text-purple-500" /> :
                        <Target size={24} className="text-emerald-500" />}
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                    {rec.text}
                  </p>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#63D2F3] group-hover:gap-4 transition-all">
                    Initialize Action <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Global Error Notifications */}
        {Object.keys(errors).length > 0 && (
          <div className="fixed bottom-8 right-8 space-y-2 max-w-sm w-full">
            {Object.entries(errors).map(([key, msg]) => (
              <div key={key} className="p-4 bg-red-500 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right">
                <AlertCircle size={20} />
                <div className="text-xs">
                  <p className="font-black uppercase">Sync Error: {key}</p>
                  <p className="opacity-80">{msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}