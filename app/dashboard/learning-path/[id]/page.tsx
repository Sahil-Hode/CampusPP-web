"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    ArrowLeft,
    Map,
    CheckCircle2,
    Lock,
    Circle,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";

type Step = {
    _id?: string;
    title: string;
    desc?: string; // Optional description
    status: "pending" | "in-progress" | "completed";
};

type LearningPath = {
    _id: string;
    topic: string;
    status: string;
    courses: Step[] | string[]; // Can be strings or objects
};

export default function LearningPathDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null); // Step ID being updated

    useEffect(() => {
        if (id) fetchPathDetail();
    }, [id]);

    async function fetchPathDetail() {
        try {
            setLoading(true);
            const res = await apiRequest(`/learning/${id}`, { method: "GET" });
            const data = res.data || res;

            // Normalize 'courses' or 'path' to 'courses'
            const rawSteps = data.courses || data.path || [];

            // Ensure steps are objects
            const normalizedSteps = rawSteps.map((s: any, i: number) => {
                if (typeof s === 'string') {
                    return { _id: `step-${i}`, title: s, status: "pending" };
                }
                return {
                    _id: s._id || `step-${i}`,
                    title: s.title || s.name || "Untitled Step",
                    desc: s.desc || s.description,
                    status: s.status || "pending"
                };
            });

            setPath({
                ...data,
                courses: normalizedSteps
            });

        } catch (err) {
            console.error("Failed to fetch path", err);
            setError("Could not load the learning path.");
        } finally {
            setLoading(false);
        }
    }

    async function updateProgress(stepIndex: number, currentStatus: string) {
        if (!path) return;

        // Optimistic Update
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        const step = path.courses[stepIndex] as Step;
        const stepId = step._id;

        if (!stepId) return;

        setUpdating(stepId);

        try {
            // Calculate new completed count for API Spec: { "completedSteps": 5 }
            // If marking as completed, count = index + 1
            // If marking as pending (undo), count = index
            let completedSteps = newStatus === "completed" ? stepIndex + 1 : stepIndex;

            // Ensure we don't go below 0 or above max
            if (completedSteps < 0) completedSteps = 0;

            const payload = {
                completedSteps: completedSteps,
                studentId: localStorage.getItem("student_id") || undefined
            };

            await apiRequest(`/learning/${id}/progress`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            // Update Local State
            const updatedCourses = [...(path.courses as Step[])];
            updatedCourses[stepIndex] = { ...step, status: newStatus };

            setPath({ ...path, courses: updatedCourses });

            if (newStatus === "completed") {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

        } catch (err) {
            console.error("Failed to update progress", err);
            // Revert optimization would go here ideally
        } finally {
            setUpdating(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-black">
                <Loader2 className="animate-spin text-[#F6AD55] w-10 h-10" />
            </div>
        );
    }

    if (error || !path) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="p-6 bg-red-50 dark:bg-red-500/10 rounded-3xl inline-flex flex-col items-center gap-4 text-red-500">
                    <AlertTriangle size={32} />
                    <p className="font-bold">{error || "Path not found"}</p>
                    <Link href="/dashboard/learning-path">
                        <button className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase">
                            Go Back
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const steps = path.courses as Step[];
    const completedCount = steps.filter(s => s.status === "completed").length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 space-y-8">

            {/* 1. Header & Nav */}
            <div className="flex flex-col gap-6">
                <Link
                    href="/dashboard/learning-path"
                    className="self-start px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#F6AD55] transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={14} strokeWidth={3} />
                    Back to List
                </Link>

                <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-zinc-900 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#F6AD55]/10 rounded-xl text-[#F6AD55]">
                                <Map size={20} strokeWidth={3} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                Current Roadmap
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
                            {path.topic}
                        </h1>

                        {/* Progress Bar */}
                        <div className="w-full h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-[#F6AD55]"
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                            <span>{progressPercent}% Completed</span>
                            <span>{completedCount} / {steps.length} Steps</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Timeline Steps */}
            <div className="relative pl-4 md:pl-0">

                {/* Vertical Guide Line */}
                <div className="absolute left-[27px] md:left-1/2 md:-translate-x-1/2 top-4 bottom-10 w-1 bg-slate-100 dark:bg-zinc-800 rounded-full md:block hidden" />
                <div className="absolute left-[19px] top-4 bottom-10 w-1 bg-slate-100 dark:bg-zinc-800 rounded-full md:hidden" />

                <div className="space-y-8">
                    {steps.map((step, index) => {
                        const isCompleted = step.status === "completed";
                        const isPreviousCompleted = index === 0 || steps[index - 1].status === "completed";
                        const isLocked = !isPreviousCompleted && !isCompleted;
                        const isNextToComplete = isPreviousCompleted && !isCompleted;

                        return (
                            <motion.div
                                key={step._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative flex md:items-center gap-6 md:gap-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                            >
                                {/* Center Marker */}
                                <div className={`absolute left-[10px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 rounded-full border-4 z-20 bg-white dark:bg-zinc-950
                            ${isCompleted ? 'border-[#F6AD55]' : isLocked ? 'border-slate-200 dark:border-zinc-700' : 'border-[#F6AD55] animate-pulse'}
                        `} />

                                {/* Content Card Side */}
                                <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'} pl-10 md:pl-0`}>
                                    <div className={`
                                p-6 rounded-[2rem] border-2 transition-all group
                                ${isLocked
                                            ? 'bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 grayscale opacity-60'
                                            : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-[#F6AD55] shadow-sm hover:shadow-md'
                                        }
                            `}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                                                ${isCompleted ? 'bg-[#F6AD55]/10 text-[#F6AD55]' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}
                                            `}>
                                                        Step {index + 1}
                                                    </span>
                                                    {isLocked && <Lock size={12} className="text-slate-400" />}
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                                    {step.title}
                                                </h3>
                                                {step.desc && (
                                                    <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            {!isLocked && (
                                                <button
                                                    onClick={() => updateProgress(index, step.status)}
                                                    disabled={updating === step._id}
                                                    className={`
                                                w-10 h-10 rounded-full flex items-center justify-center transition-all
                                                ${isCompleted
                                                            ? 'bg-[#F6AD55] text-white shadow-lg shadow-orange-200 dark:shadow-none'
                                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 hover:bg-[#F6AD55] hover:text-white'
                                                        }
                                            `}
                                                >
                                                    {updating === step._id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : isCompleted ? (
                                                        <CheckCircle2 size={20} strokeWidth={3} />
                                                    ) : (
                                                        <Circle size={20} strokeWidth={3} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Spacer for other side (desktop only) */}
                                <div className="hidden md:block w-1/2" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
