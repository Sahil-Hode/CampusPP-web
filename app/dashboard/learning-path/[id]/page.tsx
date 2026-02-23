"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    ArrowLeft,
    Map,
    CheckCircle2,
    Lock,
    Loader2,
    AlertTriangle,
    PlayCircle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function LearningPathDetail() {
    const params = useParams();
    const id = params?.id as string;

    const [path, setPath] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchPathDetail();
    }, [id]);

    async function fetchPathDetail() {
        try {
            setLoading(true);
            const res = await apiRequest(`/learning/${id}`, { method: "GET" });
            const data = res.data || res;
            
            const rawSteps = data.courses || data.path || [];
            const normalizedSteps = rawSteps.map((s: any, i: number) => ({
                _id: s._id || `step-${i}`,
                title: s.title || s.name || "Untitled Step",
                desc: s.desc || s.description,
                status: s.status || "pending"
            }));

            setPath({ ...data, courses: normalizedSteps });
        } catch (err) {
            setError("Could not load the learning path.");
        } finally {
            setLoading(false);
        }
    }

    async function updateProgress(index: number, currentStatus: string) {
        if (!path) return;
        const step = path.courses[index];
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        setUpdating(step._id);

        try {
            let completedSteps = newStatus === "completed" ? index + 1 : index;
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

    const steps = path?.courses || [];
    const completedCount = steps.filter((s: any) => s.status === "completed").length;
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
                <div className="absolute left-[20px] top-0 bottom-0 w-1 bg-zinc-900 rounded-full" />

                <div className="space-y-10">
                    {steps.map((step: any, index: number) => {
                        const isCompleted = step.status === "completed";
                        const isLocked = index > 0 && steps[index - 1].status !== "completed";

                        return (
                            <motion.div 
                                key={step._id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="relative flex gap-10"
                            >
                                {/* Milestone Dot */}
                                <div className={`relative z-10 w-10 h-10 rounded-full border-4 flex-shrink-0 flex items-center justify-center bg-black transition-all duration-500
                                    ${isCompleted ? 'border-[#F6AD55] shadow-[0_0_15px_rgba(246,173,85,0.3)]' : isLocked ? 'border-zinc-800' : 'border-[#F6AD55] animate-pulse'}
                                `}>
                                    <span className={`text-[10px] font-black ${isCompleted ? 'text-[#F6AD55]' : 'text-zinc-600'}`}>{index + 1}</span>
                                </div>

                                {/* Step Card - Always Aligned to Right */}
                                <div className={`flex-grow p-1 rounded-[2.5rem] transition-all
                                    ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-gradient-to-br hover:from-[#F6AD55]/20 hover:to-transparent'}
                                `}>
                                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.4rem] h-full flex flex-col md:flex-row justify-between gap-8">
                                        
                                        <div className="max-w-xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCompleted ? 'bg-[#F6AD55]/10 text-[#F6AD55]' : 'bg-zinc-800 text-zinc-500'}`}>
                                                    Module 0{index + 1}
                                                </span>
                                                {isLocked && <Lock size={14} className="text-zinc-600" />}
                                            </div>
                                            
                                            <h3 className="text-2xl font-black text-white tracking-tight">{step.title}</h3>
                                            <p className="text-zinc-500 font-medium leading-relaxed">{step.desc || "Master the core concepts of this module through interactive tasks and a final quiz evaluation."}</p>
                                            
                                            {/* Action Button */}
                                            {!isLocked && (
                                                <div className="pt-4 flex items-center gap-4">
                                                    <button className="flex-grow md:flex-grow-0 px-8 py-3 bg-[#F6AD55] hover:bg-[#e59b3d] text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-orange-500/10">
                                                        <PlayCircle size={18} strokeWidth={3} />
                                                        Start Task / Quiz
                                                    </button>
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