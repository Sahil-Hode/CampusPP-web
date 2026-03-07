"use client";

import React, { useState, useEffect } from 'react';
import {
  Zap, Sparkles, TrendingUp, Activity, Shield, Clock,
  Target, ArrowRight, GraduationCap, BarChart3, RefreshCw, AlertCircle, Lightbulb, CheckCircle2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- DASHBOARD THEME CONSTANTS ---
const BORDER = "border-2 border-[#DCE4EE] dark:border-zinc-800";
const HOVER = "transition-colors duration-300 hover:border-[#61C6EA]/45 dark:hover:border-[#61C6EA]/45";

// --- Styled Components ---
const Card = ({ children, className = "", variant = "default" }: { children: React.ReactNode; className?: string; variant?: string }) => {
  const variants = {
    default: "bg-white/95 dark:bg-zinc-900",
    mint: "bg-[#61C6EA]/10 dark:bg-[#61C6EA]/12",
    purple: "bg-[#B7A4EA]/12 dark:bg-[#B7A4EA]/12",
    orange: "bg-[#8EB8E8]/12 dark:bg-[#8EB8E8]/12",
    blue: "bg-[#61C6EA]/14 dark:bg-[#61C6EA]/14"
  };
  const bg = variants[variant as keyof typeof variants] || variants.default;

  return (
    <div className={`${bg} ${BORDER} ${HOVER} rounded-[2rem] p-6 ${className}`}>
      {children}
    </div>
  );
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-black/10 dark:bg-white/10 rounded-xl ${className}`} />
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`bg-white dark:bg-zinc-900 ${BORDER} p-3 rounded-xl`}>
        <p className="font-black text-[10px] uppercase text-[#8799B5] dark:text-slate-500 mb-1">{label}</p>
        <p className="font-black text-lg text-[#0D1833] dark:text-white">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

// --- TypeScript Types ---
interface SummaryData { overallScore: number; riskLevel: string; consistency: string; engagement: string; }
interface OverviewData { attendance: number; avgScore: number; completionRate: number; }
interface ScoreItem { subject: string; score: number; color: string; }
interface TrendItem { date: string; score: number; }
interface RiskData { level: string; score: number; explanation: string; }
interface RecommendationItem { id: string | number; type: string; text: string; }
interface InterventionItem { id: number; issue: string; decision: string; intervention: string; status: string; }
interface PerformanceDataState {
  summary: SummaryData | null; overview: OverviewData | null; scores: ScoreItem[] | null;
  trends: TrendItem[] | null; risk: RiskData; recommendations: RecommendationItem[] | null;
  intervention: InterventionItem[] | null;
}
interface QuizScoreSummary {
  overallScore: number;
  highestScore: number;
  totalAttempts: number;
  quizzesPassed: number;
  totalQuizzes: number;
  totalPossibleQuizzes: number;
  completionRate: number;
  completedPaths: number;
  totalPaths: number;
}
interface QuizOverview {
  summary: {
    overallScore: number;
    highestScore: number;
    passRate: number;
    completionRate: number;
    avgAttemptsPerQuiz: number;
    totalPaths: number;
    completedPaths: number;
    inProgressPaths: number;
    notStartedPaths: number;
    totalQuizzesAttempted: number;
    totalQuizzesPassed: number;
    totalQuizzesFailed: number;
    totalAttempts: number;
    totalPossibleQuizzes: number;
  };
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  recentActivity: {
    quizId: string;
    topic: string;
    stepTitle: string;
    moduleTitle: string;
    bestScore: number;
    status: string;
    attemptCount: number;
    lastActivityAt: string;
  }[];
  learningPaths: {
    learningPathId: string;
    topic: string;
    pathStatus: string;
    pathProgress: number;
    quizStats: {
      quizzesAttempted: number;
      quizzesPassed: number;
      averageBestScore: number;
      passRate: number;
      completionRate: number;
    };
  }[];
}

// --- API Helpers (Restored) ---
const getDeepValue = (obj: any, keys: string[]) => {
  if (!obj) return null;
  for (const key of keys) { if (obj[key] !== undefined) return obj[key]; }
  const wrappers = ['data', 'performance', 'stats', 'result'];
  for (const wrapper of wrappers) {
    if (obj[wrapper]) {
      for (const key of keys) { if (obj[wrapper][key] !== undefined) return obj[wrapper][key]; }
    }
  }
  return null;
};

const toNum = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

async function fetchPerformanceData(endpoint: string): Promise<any> {
  try {
    const res = await apiRequest(endpoint);
    return res;
  } catch (error) {
    console.error(`[Dashboard API] Error fetching ${endpoint}:`, error);
    throw error;
  }
}

const BASE_URL = "/student/performance";

export default function DashboardPage() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    summary: true, overview: true, scores: true, trends: true, risk: true, recommendations: true, intervention: true
  });

  const [data, setData] = useState<PerformanceDataState>({
    summary: null, overview: null, scores: [], trends: [], risk: { level: 'Low', score: 0, explanation: 'Awaiting analysis...' },
    recommendations: [], intervention: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<QuizScoreSummary | null>(null);
  const [quizOverview, setQuizOverview] = useState<QuizOverview | null>(null);
  const [quizLoading, setQuizLoading] = useState({ score: true, overview: true });
  const [quizError, setQuizError] = useState({ score: "", overview: "" });

  const fetchData = async (key: keyof PerformanceDataState, endpoint: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      const rawRes = await fetchPerformanceData(endpoint);
      let result: any = rawRes?.data || rawRes;

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
          completionRate: toNum(getDeepValue(d, ['completionRate', 'progress', 'internalMarks']))
        };
      }

      if (key === 'risk') {
        const d = rawRes?.data || rawRes;
        const factors = d.riskFactors || [];
        result = {
          level: getDeepValue(d, ['riskLevel', 'level', 'status']) || 'Low',
          score: d.isAtRisk ? 75 : 15,
          explanation: Array.isArray(factors) && factors.length > 0 ? factors.join(', ') : 'No specific risks detected.'
        };
      }

      if (key === 'trends') {
        const d = rawRes?.data || rawRes;
        if (d.trends && typeof d.trends === 'string') {
          result = [{ date: d.analysisDate ? new Date(d.analysisDate).toLocaleDateString() : 'Current', score: 0 }];
        } else {
          const trendsArr = d.trends || d || [];
          result = Array.isArray(trendsArr) ? trendsArr.map((t: any) => ({
            date: t.date || t.label || t.name || t.week || 'N/A',
            score: toNum(t.score || t.value || t.marks)
          })) : [];
        }
      }

      if (key === 'scores') {
        const d = rawRes?.data || rawRes;
        const colors = ['#61C6EA', '#8DB6E8', '#B7A4EA', '#91BFEF', '#76CFEE'];
        if (d && !Array.isArray(d) && (d.attendance || d.internalMarks || d.assignmentScore)) {
          const mapping = [
            { key: 'attendance', label: 'Attendance' },
            { key: 'internalMarks', label: 'Internal Marks' },
            { key: 'assignmentScore', label: 'Assignments' },
            { key: 'overallScore', label: 'Overall' },
            { key: 'lmsEngagement', label: 'LMS Engagement' }
          ];
          result = mapping.map((m, i) => ({
            subject: m.label, score: toNum(d[m.key]), color: colors[i % colors.length]
          }));
        } else {
          const scoresArr = d.scores || d || [];
          result = Array.isArray(scoresArr) ? scoresArr.map((s: any, i: number) => ({
            subject: s.subject || s.name || s.label || s.module || 'N/A',
            score: toNum(s.score || s.value || s.marks),
            color: s.color || colors[i % colors.length]
          })) : [];
        }
      }

      if (key === 'intervention') {
        const items = rawRes?.data || rawRes?.items || rawRes || [];
        result = Array.isArray(items) ? items : [];
      }

      if (key === 'recommendations') {
        const d = rawRes?.data || rawRes;
        const combined = [
          ...(d.recommendations || []).map((r: string, i: number) => ({ id: `rec-${i}`, text: r, type: 'study' })),
          ...(d.strengths || []).map((s: string, i: number) => ({ id: `str-${i}`, text: `Strength: ${s}`, type: 'career' })),
          ...(d.concerns || []).map((c: string, i: number) => ({ id: `con-${i}`, text: `Concern: ${c}`, type: 'risk' }))
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
    fetchQuizScore();
    fetchQuizOverview();
  }, []);

  const fetchQuizScore = async () => {
    try {
      setQuizLoading(prev => ({ ...prev, score: true }));
      const res: any = await apiRequest("/quiz/score");
      const payload = res?.data || res;
      setQuizScore({
        overallScore: toNum(payload.overallScore),
        highestScore: toNum(payload.highestScore),
        totalAttempts: toNum(payload.totalAttempts),
        quizzesPassed: toNum(payload.quizzesPassed),
        totalQuizzes: toNum(payload.totalQuizzes),
        totalPossibleQuizzes: toNum(payload.totalPossibleQuizzes),
        completionRate: toNum(payload.completionRate),
        completedPaths: toNum(payload.completedPaths),
        totalPaths: toNum(payload.totalPaths),
      });
      setQuizError(prev => ({ ...prev, score: "" }));
    } catch (err: any) {
      setQuizError(prev => ({ ...prev, score: err?.message || "Failed to load quiz score." }));
    } finally {
      setQuizLoading(prev => ({ ...prev, score: false }));
    }
  };

  const fetchQuizOverview = async () => {
    try {
      setQuizLoading(prev => ({ ...prev, overview: true }));
      const res: any = await apiRequest("/quiz/overview");
      const payload = res?.data || res;
      setQuizOverview(payload as QuizOverview);
      setQuizError(prev => ({ ...prev, overview: "" }));
    } catch (err: any) {
      setQuizError(prev => ({ ...prev, overview: err?.message || "Failed to load quiz overview." }));
    } finally {
      setQuizLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const getRiskColor = (level: string | undefined) => {
    switch (level?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-[#E96D7C] text-white';
      case 'medium': return 'bg-[#91BFEF] text-[#0D1833]';
      default: return 'bg-[#61C6EA] text-white';
    }
  };

  return (
    <div className="space-y-8 pb-12 text-[#0D1833] dark:text-white transition-colors duration-300 bg-[radial-gradient(circle_at_top,rgba(97,198,234,0.12),rgba(183,164,234,0.08)_38%,rgba(255,255,255,0)_72%)]">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 bg-[#61C6EA]/10 text-[#61C6EA] ${BORDER} rounded-lg`}>
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-black text-[#8799B5] uppercase tracking-[0.4em]">
              Campus++ Intelligence v4.0
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-[1000] tracking-tighter uppercase italic text-[#0D1833] dark:text-white">
            Student <span className="text-transparent bg-gradient-to-r from-[#61C6EA] to-[#B7A4EA] bg-clip-text">Analytics</span>
          </h1>
        </div>

        <button
          onClick={() => window.location.reload()}
          className={`flex items-center gap-2 px-8 py-4 bg-[#61C6EA] text-white ${BORDER} rounded-2xl font-black text-sm uppercase hover:bg-[#49b8df] transition-colors`}
        >
          <RefreshCw size={18} strokeWidth={3} />
          Sync Data
        </button>
      </header>

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-l-[12px] border-l-[#61C6EA]">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-black uppercase tracking-widest text-xs text-[#8799B5]">Power Level</h3>
            {loadingStates.summary ? <Skeleton className="w-16 h-6" /> : (
              <span className={`px-4 py-1 rounded-lg ${BORDER} text-[10px] font-black uppercase ${getRiskColor(data.summary?.riskLevel)}`}>
                {data.summary?.riskLevel || 'Low'} Risk
              </span>
            )}
          </div>
          <div className="text-8xl font-[1000] tracking-tighter leading-none mb-8">
            {data.summary?.overallScore || 0}%
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 bg-[#B7A4EA]/12 dark:bg-[#B7A4EA]/12 ${BORDER} rounded-2xl`}>
              <p className="text-[10px] font-black uppercase text-[#8799B5]">Consistency</p>
              <p className="font-black text-lg">{data.summary?.consistency || '--'}</p>
            </div>
            <div className={`p-4 bg-[#61C6EA]/12 dark:bg-[#61C6EA]/12 ${BORDER} rounded-2xl`}>
              <p className="text-[10px] font-black uppercase text-[#8799B5]">Engagement</p>
              <p className="font-black text-lg">{data.summary?.engagement || '--'}</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Attendance', value: data.overview?.attendance, icon: Clock, variant: 'mint' },
            { label: 'Avg Score', value: data.overview?.avgScore, icon: GraduationCap, variant: 'purple' },
            { label: 'Completion', value: data.overview?.completionRate, icon: Target, variant: 'orange' }
          ].map((kpi, i) => (
            <Card key={i} variant={kpi.variant} className="flex flex-col items-center justify-center text-center">
              <div className={`p-4 bg-white dark:bg-zinc-900 ${BORDER} rounded-2xl mb-4`}>
                <kpi.icon size={28} strokeWidth={3} className="text-[#0D1833] dark:text-slate-200" />
              </div>
              <div className="text-5xl font-[1000] mb-1">{kpi.value || 0}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#8799B5]">{kpi.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* QUIZ GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-l-[12px] border-l-[#E96D7C]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase tracking-widest text-xs text-[#8799B5]">Quiz Score</h3>
            {quizLoading.score ? (
              <Skeleton className="w-16 h-6" />
            ) : (
              <span className={`px-4 py-1 rounded-lg ${BORDER} text-[10px] font-black uppercase bg-[#E96D7C]/15 text-[#E96D7C]`}>
                Live
              </span>
            )}
          </div>
          {quizError.score && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E96D7C] mb-3">
              <AlertCircle size={14} /> {quizError.score}
            </div>
          )}
          <div className="text-7xl font-[1000] tracking-tighter leading-none mb-6">
            {quizScore?.overallScore ?? 0}%
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 bg-[#E96D7C]/10 ${BORDER} rounded-2xl`}>
              <p className="text-[10px] font-black uppercase text-[#8799B5]">Highest</p>
              <p className="font-black text-lg">{quizScore?.highestScore ?? 0}%</p>
            </div>
            <div className={`p-4 bg-[#61C6EA]/10 ${BORDER} rounded-2xl`}>
              <p className="text-[10px] font-black uppercase text-[#8799B5]">Completion</p>
              <p className="font-black text-lg">{quizScore?.completionRate ?? 0}%</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Attempts', value: quizScore?.totalAttempts ?? 0, icon: Activity, variant: 'mint' },
            { label: 'Quizzes Passed', value: quizScore?.quizzesPassed ?? 0, icon: CheckCircle2, variant: 'purple' },
            { label: 'Total Quizzes', value: quizScore?.totalPossibleQuizzes ?? 0, icon: Target, variant: 'orange' }
          ].map((kpi, i) => (
            <Card key={i} variant={kpi.variant} className="flex flex-col items-center justify-center text-center">
              <div className={`p-4 bg-white dark:bg-zinc-900 ${BORDER} rounded-2xl mb-4`}>
                <kpi.icon size={28} strokeWidth={3} className="text-[#0D1833] dark:text-slate-200" />
              </div>
              <div className="text-5xl font-[1000] mb-1">{kpi.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#8799B5]">{kpi.label}</div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6 font-black uppercase italic">
            <BarChart3 size={22} strokeWidth={3} /> Difficulty Split
          </div>
          {quizLoading.overview ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Easy", value: quizOverview?.difficultyBreakdown?.easy ?? 0, color: "#61C6EA" },
                { label: "Medium", value: quizOverview?.difficultyBreakdown?.medium ?? 0, color: "#B7A4EA" },
                { label: "Hard", value: quizOverview?.difficultyBreakdown?.hard ?? 0, color: "#E96D7C" },
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-[#8799B5]">{row.label}</span>
                  <span className="text-sm font-black" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 font-black uppercase italic">
              <Zap size={22} strokeWidth={3} /> Recent Quiz Activity
            </div>
            <span className="text-[10px] font-black text-[#8799B5] uppercase tracking-widest">Last 5</span>
          </div>
          {quizLoading.overview ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {(quizOverview?.recentActivity || []).map((item) => (
                <div key={item.quizId} className={`flex flex-col md:flex-row md:items-center justify-between p-4 ${BORDER} bg-white/70 dark:bg-zinc-900 rounded-2xl`}>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#8799B5]">{item.moduleTitle}</p>
                    <p className="font-black text-lg">{item.stepTitle}</p>
                    <p className="text-xs text-[#8799B5]">Topic: {item.topic}</p>
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${item.status === "passed" ? "bg-[#61C6EA]/15 text-[#61C6EA]" : "bg-[#E96D7C]/15 text-[#E96D7C]"}`}>
                      {item.status}
                    </span>
                    <span className="text-sm font-black">{item.bestScore}%</span>
                  </div>
                </div>
              ))}
              {quizOverview?.recentActivity?.length === 0 && (
                <div className="text-sm text-[#8799B5]">No recent quiz activity yet.</div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[400px]">
          <div className="flex items-center gap-3 mb-8 font-black uppercase italic">
            <TrendingUp size={24} strokeWidth={3} /> Improvement Trend
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer>
              <AreaChart data={data.trends ?? undefined}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#AAB8CC" strokeOpacity={0.35} />
                <XAxis dataKey="date" tick={{ fontWeight: 900, fontSize: 10, fill: 'currentColor' }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="step" dataKey="score" stroke="#0D1833" dark-stroke="#fff" strokeWidth={3} fill="#61C6EA" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="min-h-[400px]">
          <div className="flex items-center gap-3 mb-8 font-black uppercase italic">
            <BarChart3 size={24} strokeWidth={3} /> Module Breakdown
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer>
              <BarChart data={data.scores ?? undefined} layout="vertical">
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" tick={{ fontWeight: 900, fontSize: 10, fill: 'currentColor' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} stroke="#B8C6D8" strokeWidth={1}>
                  {data.scores?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* RISK & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-[#EFF7FC] dark:bg-zinc-900 hover:border-[#61C6EA]/45">
          <div className="flex items-center gap-3 mb-6 font-black uppercase italic">
            <Shield size={24} strokeWidth={3} className="text-[#61C6EA]" /> Risk Radar
          </div>
          <div className="text-7xl font-[1000] mb-2">{data.risk.score}%</div>
          <div className={`inline-block px-4 py-1.5 rounded-xl ${BORDER} text-[10px] font-black uppercase mb-6 ${getRiskColor(data.risk.level)}`}>
            {data.risk.level} Criticality
          </div>
          <div className={`p-4 bg-white dark:bg-zinc-900 ${BORDER} rounded-2xl italic font-bold text-sm`}>
            &quot;{data.risk.explanation}&quot;
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 font-black uppercase italic text-xl">
              <Activity size={24} strokeWidth={3} className="text-[#61C6EA]" /> Intervention Log
            </div>
            <span className="text-[10px] font-black text-[#8799B5] uppercase tracking-widest">Decision Ledger</span>
          </div>
          <div className="space-y-4">
            {data.intervention?.map((item, idx) => (
              <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 ${BORDER} bg-[#F7FAFD] dark:bg-zinc-800/40 rounded-[24px]`}>
                <div className="flex items-center gap-5">
                  <span className="font-[1000] text-3xl opacity-10">0{idx + 1}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#8799B5]">Issue</p>
                    <p className="font-black text-lg">{item.issue}</p>
                  </div>
                </div>
                <div className={`mt-3 md:mt-0 px-4 py-2 rounded-xl ${BORDER} text-xs font-black uppercase bg-white dark:bg-zinc-900`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECOMMENDATIONS */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <Lightbulb size={32} className="text-[#61C6EA] fill-current" />
          <h3 className="text-4xl font-[1000] uppercase italic tracking-tighter">Growth Hacks</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.recommendations?.map((rec) => (
            <div key={rec.id} className={`p-8 bg-white dark:bg-zinc-900 ${BORDER} rounded-[32px] group relative overflow-hidden transition-colors hover:border-[#61C6EA]/45`}>
              <div className={`w-14 h-14 ${BORDER} bg-[#61C6EA]/12 dark:bg-[#61C6EA]/10 rounded-2xl flex items-center justify-center mb-6`}>
                <Zap size={24} strokeWidth={3} className="text-[#61C6EA]" />
              </div>
              <p className="font-black text-xl leading-tight mb-8 dark:text-white/90">{rec.text}</p>
              <button className="flex items-center gap-2 text-xs font-[1000] uppercase tracking-tighter text-[#61C6EA] group-hover:gap-4 transition-all">
                Execute Protocol <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ERRORS */}
      {Object.keys(errors).length > 0 && (
        <div className="fixed bottom-6 right-6 z-[999] space-y-3">
          {Object.entries(errors).map(([k, v]) => (
            <div key={k} className={`p-5 bg-red-500 ${BORDER} rounded-2xl text-[10px] font-black uppercase flex items-center gap-4 animate-in slide-in-from-right text-white`}>
              <AlertCircle size={20} /> <div><p className="opacity-70">Sync Error: {k}</p><p>{v}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
