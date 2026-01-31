"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Mail,
  BookOpen,
  Calendar,
  Target,
  Zap,
  Shield,
  Activity,
  Edit2,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";

type StudentPerformance = {
  studentProfile: {
    _id?: string;
    studentId?: string;
    name: string;
    email: string;
    classes: string;
    Course?: string;
    attendance?: string;
    marks?: string;
    language?: string;
  };
  performance: {
    score: number;
    riskLevel: "High" | "Medium" | "Low";
    trend: string;
    strengths?: string[];
    concerns?: string[];
    intervention: {
      required: boolean;
      priority?: string;
      triggeredBy?: string;
      actions?: Array<{
        type: string;
        description: string;
        status: string;
        initiatedAt?: string;
      }>;
      nextReviewDate?: string;
      interventionHistory?: Array<{
        date: string;
        action: string;
        outcome: string;
        performedBy: string;
      }>;
    };
    riskScore?: number;
    interventionStatus?: string;
    daysUntilReview?: number;
  };
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    classes: "",
    language: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchStudentPerformance() {
      try {
        const res = await apiRequest(`/faculty/student/${studentId}/performance`, {
          method: "GET",
        });
        setData(res.data);
        // Initialize edit form with fetched data
        if (res.data?.studentProfile) {
          setEditForm({
            name: res.data.studentProfile.name || "",
            classes: res.data.studentProfile.classes || "",
            language: res.data.studentProfile.language || ""
          });
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch student performance:", err);
        setError("Unable to load student data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchStudentPerformance();
    }
  }, [studentId]);

  const handleUpdateStudent = async () => {
    if (!data?.studentProfile?._id) return;

    setIsSaving(true);
    try {
      const res = await apiRequest(`/faculty/student/${data.studentProfile._id}`, {
        method: "PUT",
        body: JSON.stringify(editForm)
      });

      // Update local state with new data
      setData(prev => prev ? ({
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          ...editForm
        }
      }) : null);

      setIsEditOpen(false);
    } catch (err) {
      console.error("Failed to update student:", err);
      // Ideally show a toast here
      alert("Failed to update student details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-zinc-800 rounded-2xl w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-3xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 mb-6 hover:text-[#63D2F3] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Students
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-3xl p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 font-bold text-lg">{error || "Student not found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { studentProfile, performance } = data;
  const riskColor =
    performance.riskLevel === "High"
      ? "red"
      : performance.riskLevel === "Medium"
        ? "amber"
        : "emerald";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 relative">
      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsEditOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] p-8 z-50 shadow-2xl border-2 border-slate-100 dark:border-zinc-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-[1000] uppercase tracking-tighter text-slate-900 dark:text-white">
                  Edit Student Profile
                </h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Full Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#63D2F3] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Class / Section
                  </label>
                  <input
                    value={editForm.classes}
                    onChange={(e) => setEditForm({ ...editForm, classes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#63D2F3] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Language Preference
                  </label>
                  <input
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#63D2F3] transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStudent}
                  disabled={isSaving}
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-[#63D2F3] text-white hover:bg-[#4FBADD] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#63D2F3] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {/* STUDENT HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-900 p-8 shadow-sm relative overflow-hidden group"
      >
        {/* Edit Button */}
        <button
          onClick={() => setIsEditOpen(true)}
          className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-slate-400 hover:text-[#63D2F3] hover:bg-[#63D2F3]/10 transition-all z-10"
        >
          <Edit2 size={20} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-12">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 bg-gradient-to-br from-[#63D2F3] to-[#D6BCFA] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <User size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase">
                {studentProfile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Mail size={12} />
                  {studentProfile.email}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <BookOpen size={12} />
                  {studentProfile.classes}
                </span>
              </div>
            </div>
          </div>

          {/* RISK BADGE */}
          <div className={`hidden md:block px-6 py-3 bg-${riskColor}-500/10 border-2 border-${riskColor}-500/20 rounded-2xl`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Level</p>
            <p className={`text-2xl font-[1000] text-${riskColor}-500`}>{performance.riskLevel}</p>
          </div>
        </div>
      </motion.div>

      {/* PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={Target}
          label="Performance Score"
          value={performance.score}
          suffix="/100"
          color="blue"
        />
        <MetricCard
          icon={Activity}
          label="Trend"
          value={performance.trend}
          color="purple"
          iconComponent={performance.trend === "Improving" ? TrendingUp : performance.trend === "Declining" ? TrendingDown : Activity}
        />
        <MetricCard
          icon={Shield}
          label="Risk Score"
          value={performance.riskScore || 0}
          suffix="/5"
          color="orange"
        />
        <MetricCard
          icon={Clock}
          label="Review In"
          value={performance.daysUntilReview || 0}
          suffix=" days"
          color="green"
        />
      </div>

      {/* STRENGTHS & CONCERNS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* STRENGTHS */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[2.5rem] p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-emerald-500" size={24} strokeWidth={2.5} />
            <h2 className="text-xl font-[1000] uppercase tracking-tighter text-emerald-700 dark:text-emerald-400">
              Strengths
            </h2>
          </div>
          <ul className="space-y-3">
            {performance.strengths && performance.strengths.length > 0 ? (
              performance.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Zap size={16} className="text-emerald-500 mt-1 shrink-0" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{strength}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500">No strengths recorded yet.</p>
            )}
          </ul>
        </motion.div>

        {/* CONCERNS */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-500" size={24} strokeWidth={2.5} />
            <h2 className="text-xl font-[1000] uppercase tracking-tighter text-red-700 dark:text-red-400">
              Concerns
            </h2>
          </div>
          <ul className="space-y-3">
            {performance.concerns && performance.concerns.length > 0 ? (
              performance.concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 mt-1 shrink-0" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{concern}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500">No concerns recorded.</p>
            )}
          </ul>
        </motion.div>
      </div>

      {/* INTERVENTION STATUS */}
      {performance.intervention.required && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-900/30 rounded-[2.5rem] p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="text-amber-500" size={24} strokeWidth={2.5} />
              <h2 className="text-xl font-[1000] uppercase tracking-tighter text-amber-700 dark:text-amber-400">
                Intervention Required
              </h2>
            </div>
            {performance.intervention.priority && (
              <span className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase">
                {performance.intervention.priority}
              </span>
            )}
          </div>

          {/* ACTIONS */}
          {performance.intervention.actions && performance.intervention.actions.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Action Items</h3>
              {performance.intervention.actions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                      {action.type.replace(/_/g, " ")}
                    </p>
                    <span className="text-[9px] font-bold px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg uppercase">
                      {action.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{action.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* NEXT REVIEW */}
          {performance.intervention.nextReviewDate && (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
              <Calendar size={16} />
              Next Review: {new Date(performance.intervention.nextReviewDate).toLocaleDateString()}
            </div>
          )}
        </motion.div>
      )}

      {/* INTERVENTION HISTORY */}
      {performance.intervention.interventionHistory && performance.intervention.interventionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-900 p-8"
        >
          <h2 className="text-xl font-[1000] uppercase tracking-tighter text-slate-900 dark:text-white mb-6">
            Intervention History
          </h2>
          <div className="space-y-4">
            {performance.intervention.interventionHistory.map((entry, idx) => (
              <div
                key={idx}
                className="border-l-4 border-[#63D2F3] pl-6 py-3 bg-slate-50 dark:bg-zinc-900 rounded-r-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black uppercase text-[#63D2F3]">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{entry.outcome}</p>
                <p className="text-xs text-slate-500">By: {entry.performedBy}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string | number;
  suffix?: string;
  color: "blue" | "purple" | "orange" | "green";
  iconComponent?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

function MetricCard({ icon: Icon, label, value, suffix = "", color, iconComponent }: MetricCardProps) {
  const DisplayIcon = iconComponent || Icon;
  const colorClasses = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border-2 border-slate-50 dark:border-zinc-900 p-6 shadow-sm">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center text-white mb-4`}>
        <DisplayIcon size={24} strokeWidth={2.5} />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-[1000] text-slate-900 dark:text-white">
        {value}
        <span className="text-sm text-slate-400 ml-1">{suffix}</span>
      </p>
    </div>
  );
}