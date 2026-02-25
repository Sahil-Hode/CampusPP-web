"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Sparkles,
  Map,
  ChevronRight,
  LayoutGrid,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Type for a Learning Path Summary in the list
type LearningPathSummary = {
  _id: string;
  topic: string;
  status: string;
  createdAt: string;
  totalSteps?: number; // Optional if API returns it
  completedSteps?: number;
};

export default function LearningPathList() {
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [loading, setLoading] = useState(true); // Initial load

  // Generation State
  const [goal, setGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeletePath, setConfirmDeletePath] = useState<LearningPathSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------
      GET all learning paths
  ---------------------------- */
  async function fetchPaths() {
    try {
      setLoading(true);
      const res: any = await apiRequest("/learning", { method: "GET" });

      let data = res.data;
      // Handle various response wrappers
      if (data && !Array.isArray(data) && data.data) {
        data = data.data;
      } else if (data && !Array.isArray(data) && (data.paths || data.courses)) {
        data = data.paths || data.courses;
      }

      if (Array.isArray(data)) {
        setPaths(data);
      } else {
        setPaths([]);
      }
    } catch (err) {
      console.error("Failed to fetch paths", err);
      // Don't show critical error to user, just empty list
      setPaths([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPaths();
  }, []);

  /* ---------------------------
      POST generate learning path
  ---------------------------- */
  async function generatePath() {
    if (!goal.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res: any = await apiRequest("/learning/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: goal,
        }),
      });

      const newPath = res.data;

      // If success, user probably wants to see it immediately
      // Option A: Link to it
      if (newPath?._id) {
        router.push(`/dashboard/learning-path/${newPath._id}`);
      } else {
        // Option B: Refresh list
        await fetchPaths();
        setGoal("");
      }

    } catch (err: unknown) {
      console.error(err);
      setError("Failed to generate learning path. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  /* ---------------------------
      DELETE learning path
  ---------------------------- */
  async function deletePath(learningPathId: string) {
    if (!learningPathId || deletingId) return;

    setDeletingId(learningPathId);
    setError(null);

    try {
      await apiRequest(`/learning/${learningPathId}`, {
        method: "DELETE",
      });

      setPaths((prev) => prev.filter((p) => p._id !== learningPathId));
      setConfirmDeletePath(null);
    } catch (err) {
      console.error("Failed to delete learning path", err);
      setError("Failed to delete learning path. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="p-1.5 bg-[#F6AD55]/10 rounded-lg text-[#F6AD55]">
              <Map size={16} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Strategy Engine
            </span>
          </motion.div>

          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Start a New <span className="text-[#F6AD55]">Journey</span>
          </h2>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Generate AI-powered roadmaps or continue your existing ones.
          </p>
        </div>
      </div>

      {/* Generator Section */}
      <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-zinc-900 shadow-sm flex flex-col md:flex-row gap-4 items-end relative overflow-hidden">
        <div className="flex-1 w-full space-y-2 z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            What do you want to learn?
          </label>

          <div className="relative">
            <Brain
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F6AD55]"
              size={20}
            />
            <input
              className="w-full bg-slate-50 dark:bg-zinc-900 border-2 border-transparent focus:border-[#F6AD55] rounded-2xl py-4 pl-14 pr-5 text-sm font-bold outline-none transition-all dark:text-white"
              placeholder="e.g. Quantum Physics, React Development, Machine Learning"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generatePath()}
            />
          </div>
        </div>

        <button
          onClick={generatePath}
          disabled={generating || !goal.trim()}
          className="bg-[#F6AD55] hover:bg-[#ed9a3d] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-all z-10 whitespace-nowrap"
        >
          {generating ? "Generating..." : "Create Roadmap"}
          <Sparkles size={16} className={generating ? "animate-spin" : ""} />
        </button>

        <Zap
          size={120}
          className="absolute -right-8 -bottom-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 justify-center p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 text-xs font-bold"
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-slate-200 dark:bg-zinc-800 w-full" />

      {/* My Learning Paths Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LayoutGrid size={20} className="text-slate-400" />
          <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tight">
            My Learning Paths
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8 opacity-50" />
          </div>
        ) : paths.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
            <p className="text-slate-400 font-bold text-sm">No learning paths found. Create one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path, i) => (
              <motion.div
                key={path._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between hover:border-[#F6AD55] dark:hover:border-[#F6AD55] transition-colors group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="bg-[#F6AD55]/10 text-[#F6AD55] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {path.status || "In Progress"}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-full text-slate-400">
                        <Brain size={18} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePath(path)}
                        disabled={deletingId === path._id}
                        className="p-2 bg-red-50 dark:bg-red-500/10 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-60 cursor-pointer"
                        aria-label={`Delete ${path.topic}`}
                        title="Delete learning path"
                      >
                        {deletingId === path._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-[1000] text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
                    {path.topic}
                  </h4>

                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-6">
                    <Calendar size={14} />
                    {path.createdAt ? new Date(path.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>

                <Link href={`/dashboard/learning-path/${path._id}`} className="w-full">
                  <button className="w-full py-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:bg-[#F6AD55] group-hover:text-white transition-all">
                    Continue Path
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmDeletePath && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-slate-900/50 backdrop-blur-sm"
              onClick={() => (deletingId ? null : setConfirmDeletePath(null))}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="fixed left-4 right-4 md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 z-[260] max-w-md rounded-[1.75rem] border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl"
            >
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Confirm Deletion
              </h4>
              <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-slate-800 dark:text-zinc-100">&quot;{confirmDeletePath.topic}&quot;</span>?
                This action cannot be undone.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeletePath(null)}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deletePath(confirmDeletePath._id)}
                  disabled={deletingId === confirmDeletePath._id}
                  className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
                >
                  {deletingId === confirmDeletePath._id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
