"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    ArrowLeft,
    Map,
    CheckCircle2,
    Lock,
    Loader2,
    AlertTriangle,
    PlayCircle,
    Timer
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";

type LearningPathStep = {
    _id: string;
    title: string;
    desc?: string;
    status: string;
    courseIndex: number;
    stepIndex: number;
    moduleTitle?: string;
    cooldownUntil?: string | null;
    cooldownRemainingMinutes?: number | null;
    cooldownCapturedAt?: number | null;
};

type LearningPathCourse = {
    _id?: string;
    title?: string;
    status?: string;
    steps?: LearningPathStepRaw[];
};

type LearningPathStepRaw = {
    _id?: string;
    title?: string;
    name?: string;
    desc?: string;
    description?: string;
    quizStatus?: string;
    status?: string;
    cooldownUntil?: string | null;
    cooldownRemainingMinutes?: number | null;
};

type LearningPathApiData = {
    _id?: string;
    topic: string;
    courses?: LearningPathCourse[];
    path?: LearningPathStepRaw[];
};

type ApiResponse<T> = {
    data?: T;
} & T;

export default function LearningPathDetail() {
    const params = useParams();
    const id = params?.id as string;

    const [path, setPath] = useState<{ _id?: string; topic: string; courses: LearningPathStep[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const fetchPathDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res: any = await apiRequest(`/learning/${id}`, { method: "GET" });
            const data = res.data || res;
            const capturedAt = Date.now();

            const rawCourses = (data.courses || data.path || []) as LearningPathCourse[] | LearningPathStepRaw[];
            const hasNestedSteps = rawCourses.length > 0 && Array.isArray((rawCourses[0] as LearningPathCourse)?.steps);

            const normalizedSteps: LearningPathStep[] = hasNestedSteps
                ? (rawCourses as LearningPathCourse[]).flatMap((course, cIdx: number) =>
                    (course.steps || []).map((step, sIdx: number) => ({
                        _id: step._id || `${course._id || `course-${cIdx}`}-step-${sIdx}`,
                        title: step.title || step.name || "Untitled Step",
                        desc: step.desc || step.description,
                        status: step.quizStatus || step.status || "pending",
                        courseIndex: cIdx,
                        stepIndex: sIdx,
                        moduleTitle: course.title || `Module ${cIdx + 1}`,
                        cooldownUntil: step.cooldownUntil ?? null,
                        cooldownRemainingMinutes: step.cooldownRemainingMinutes ?? null,
                        cooldownCapturedAt: step.cooldownRemainingMinutes ? capturedAt : null
                    }))
                )
                : (rawCourses as LearningPathStepRaw[]).map((s, i: number) => ({
                    _id: s._id || `step-${i}`,
                    title: s.title || s.name || "Untitled Step",
                    desc: s.desc || s.description,
                    status: s.quizStatus || s.status || "pending",
                    courseIndex: 0,
                    stepIndex: i,
                    moduleTitle: "Module 1",
                    cooldownUntil: s.cooldownUntil ?? null,
                    cooldownRemainingMinutes: s.cooldownRemainingMinutes ?? null,
                    cooldownCapturedAt: s.cooldownRemainingMinutes ? capturedAt : null
                }));

            setPath({
                _id: data._id,
                topic: data.topic,
                courses: normalizedSteps
            });
            setError(null);
        } catch {
            setError("Could not load the learning path.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchPathDetail();
    }, [id, fetchPathDetail]);

    useEffect(() => {
        if (!path) return;
        const hasCooldown = path.courses.some((step) => step.status === "cooldown");
        if (!hasCooldown) return;
        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => window.clearInterval(intervalId);
    }, [path]);

    function getCooldownRemainingMs(step: LearningPathStep) {
        if (step.cooldownUntil) {
            const untilMs = Date.parse(step.cooldownUntil);
            if (!Number.isNaN(untilMs)) {
                return Math.max(0, untilMs - now);
            }
        }
        if (typeof step.cooldownRemainingMinutes === "number" && step.cooldownCapturedAt) {
            const remainingMs = step.cooldownRemainingMinutes * 60 * 1000 - (now - step.cooldownCapturedAt);
            return Math.max(0, remainingMs);
        }
        return null;
    }

    function formatCountdown(ms: number) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours} hr ${minutes} min ${seconds} sec`;
        if (minutes > 0) return `${minutes} min ${seconds} sec`;
        return `${seconds} sec`;
    }

    async function updateProgress(index: number, currentStatus: string) {
        if (!path) return;
        const step = path.courses[index];
        if (!step) return;
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        setUpdating(step._id);

        try {
            const completedSteps = newStatus === "completed" ? index + 1 : index;
            await apiRequest(`/learning/${id}/progress`, {
                method: "PUT",
                body: JSON.stringify({ completedSteps })
            });

            const updated = [...path.courses];
            updated[index].status = newStatus;
            setPath({ ...path, courses: updated });

            if (newStatus === "completed") {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        } finally {
            setUpdating(null);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#F6AD55] w-10 h-10" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-400 font-semibold">{error}</div>;
    if (!path) return <div className="min-h-screen flex items-center justify-center bg-black text-zinc-400 font-semibold">No learning path found.</div>;

    const steps: LearningPathStep[] = path.courses;
    const completedCount = steps.filter((s) => s.status === "completed" || s.status === "passed").length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="max-w-4xl mx-auto pb-24 px-6 pt-10">
            {/* Header */}
            <div className="mb-12 space-y-8">
                <Link href="/dashboard/learning-path" className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#F6AD55] transition-colors font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Back to Roadmap
                </Link>

                <div className="bg-zinc-950 p-8 md:p-12 rounded-[3rem] border-2 border-zinc-900 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#F6AD55]/10 rounded-xl text-[#F6AD55]"><Map size={24} /></div>
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Learning Path</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-8">
                            {path.topic}
                        </h1>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                <span>Progress</span>
                                <span>{progressPercent}% Complete</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-[#F6AD55]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Linear Timeline (Non-ZigZag) */}
            <div className="relative">
                {/* Single Left-Aligned Rail */}
                <div className="absolute left-5 top-0 bottom-0 w-1 bg-zinc-900 rounded-full" />

                <div className="space-y-10">
                    {steps.map((step, index: number) => {
                        const isCompleted = step.status === "completed" || step.status === "passed";
                        const prevCompleted = index === 0
                            ? true
                            : (steps[index - 1].status === "completed" || steps[index - 1].status === "passed");
                        const isInCooldown = step.status === "cooldown";
                        const isLocked = !prevCompleted || step.status === "locked" || isInCooldown;
                        const cooldownMs = getCooldownRemainingMs(step);
                        const cooldownLabel = cooldownMs !== null ? formatCountdown(cooldownMs) : "24 hr";

                        return (
                            <motion.div 
                                key={step._id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="relative flex gap-10"
                            >
                                {/* Milestone Dot */}
                                <div className={`relative z-10 w-10 h-10 rounded-full border-4 shrink-0 flex items-center justify-center bg-black transition-all duration-500
                                    ${isCompleted ? 'border-[#F6AD55] shadow-[0_0_15px_rgba(246,173,85,0.3)]' : isLocked ? 'border-zinc-800' : 'border-[#F6AD55] animate-pulse'}
                                `}>
                                    <span className={`text-[10px] font-black ${isCompleted ? 'text-[#F6AD55]' : 'text-zinc-600'}`}>{index + 1}</span>
                                </div>

                                {/* Step Card - Always Aligned to Right */}
                                <div className={`grow p-1 rounded-[2.5rem] transition-all
                                    ${isLocked ? 'opacity-50 grayscale pointer-events-none' : 'hover:bg-linear-to-br hover:from-[#F6AD55]/20 hover:to-transparent'}
                                    ${isInCooldown ? 'bg-linear-to-br from-red-500/20 via-transparent to-transparent' : ''}
                                `}>
                                    <div className={`bg-zinc-900 border p-8 rounded-[2.4rem] h-full flex flex-col md:flex-row justify-between gap-8
                                        ${isInCooldown ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-zinc-800'}
                                    `}>
                                        
                                        <div className="max-w-xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCompleted ? 'bg-[#F6AD55]/10 text-[#F6AD55]' : 'bg-zinc-800 text-zinc-500'}`}>
                                                    {step.moduleTitle || `Module 0${step.courseIndex + 1}`} · Step 0{step.stepIndex + 1}
                                                </span>
                                                {isInCooldown && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/15 text-red-300 flex items-center gap-2 border border-red-500/30">
                                                        <Timer size={12} /> Cooldown {cooldownLabel}
                                                    </span>
                                                )}
                                                {isLocked && <Lock size={14} className="text-zinc-600" />}
                                            </div>
                                            
                                            <h3 className="text-2xl font-black text-white tracking-tight">{step.title}</h3>
                                            <p className="text-zinc-500 font-medium leading-relaxed">{step.desc || "Master the core concepts of this module through interactive tasks and a final quiz evaluation."}</p>
                                            {isInCooldown && (
                                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-500">
                                                    <AlertTriangle size={16} />
                                                    Quiz locked due to cooldown. Unlocks in {cooldownLabel}.
                                                </div>
                                            )}
                                            
                                            {/* Action Button */}
                                                {!isLocked && (
                                                    <div className="pt-4 flex items-center gap-4">
                                                        <Link
                                                            href={`/dashboard/ai-quiz?learningPathId=${id}&courseIndex=${step.courseIndex}&stepIndex=${step.stepIndex}`}
                                                            className="grow md:grow-0 px-8 py-3 bg-[#F6AD55] hover:bg-[#e59b3d] text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-orange-500/10"
                                                        >
                                                            <PlayCircle size={18} strokeWidth={3} />
                                                            Start Task / Quiz
                                                        </Link>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Progress Toggle - Desktop Right Side */}
                                        <div className="flex items-start">
                                            {!isLocked && (
                                                <button
                                                    onClick={() => updateProgress(index, step.status)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all 
                                                        ${isCompleted ? 'bg-[#F6AD55] text-black shadow-xl shadow-orange-500/20' : 'bg-zinc-800 text-zinc-600 hover:text-white hover:bg-zinc-700'}
                                                    `}
                                                >
                                                    {updating === step._id ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={28} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
