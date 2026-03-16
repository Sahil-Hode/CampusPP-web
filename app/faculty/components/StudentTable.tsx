"use client";

import { useState } from "react";
import Link from "next/link";
import RiskBadge from "./RiskBadge";
import { ChevronRight, User, BrainCircuit, MessageCircleMore, X } from "lucide-react";
import { motion } from "framer-motion";

type Student = {
  _id: string;
  email: string;
  name: string;
  studentId: string;
  Course: string;
  attendance: string;
  classes: string;
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

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onSendNote: (studentId: string, note: string) => Promise<{ notificationSent?: boolean; notificationMessage?: string }>;
}

export default function StudentTable({ students, loading, onSendNote }: StudentTableProps) {
  const [noteStudent, setNoteStudent] = useState<Student | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submitNote = async () => {
    if (!noteStudent) return;
    const clean = note.trim();
    if (clean.length < 2 || clean.length > 1000) {
      alert("Note must be between 2 and 1000 characters.");
      return;
    }

    try {
      setSending(true);
      const result = await onSendNote(noteStudent.studentId, clean);
      if (result?.notificationSent === false) {
        alert(`Annotation sent, but push notification failed${result.notificationMessage ? `: ${result.notificationMessage}` : "."}`);
      } else {
        alert("Faculty annotation and notification sent successfully.");
      }
      setNote("");
      setNoteStudent(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send note";
      alert(message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 dark:bg-zinc-800 rounded"></div>
          <div className="h-12 bg-slate-50 dark:bg-zinc-900 rounded"></div>
          <div className="h-12 bg-slate-50 dark:bg-zinc-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm p-12 text-center">
        <p className="text-slate-400 font-bold">No students found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-800/50">
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Student Profile</th>
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Academic Risk</th>
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Performance</th>
              <th className="px-6 py-5 text-right text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
            {students.map((s, index) => (
              <motion.tr
                key={s._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {/* NAME & AVATAR */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#63D2F3] group-hover:text-white transition-all">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{s.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.studentId} • {s.Course}</p>
                    </div>
                  </div>
                </td>

                {/* RISK BADGE */}
                <td className="px-6 py-5">
                  <RiskBadge level={s.performance?.riskLevel || "Low"} />
                </td>

                {/* PERFORMANCE SCORE */}
                <td className="px-6 py-5 hidden md:table-cell">
                  <div className="w-32">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Score: {s.performance?.score || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.performance?.score || 0}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${(s.performance?.score || 0) < 50 ? 'bg-red-500' : (s.performance?.score || 0) < 80 ? 'bg-amber-500' : 'bg-[#63D2F3]'
                          }`}
                      />
                    </div>
                  </div>
                </td>

                {/* ACTION BUTTON */}
                <td className="px-6 py-5 text-right">
                  <div className="inline-flex items-center gap-2">
                    {["High", "Medium"].includes(s.performance?.riskLevel || "") && (
                      <button
                        onClick={() => {
                          setNoteStudent(s);
                          setNote("");
                        }}
                        className="inline-flex items-center gap-2 bg-[#63D2F3] text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                        title="Send faculty annotation"
                      >
                        <MessageCircleMore size={14} />
                        Chat
                      </button>
                    )}

                    <Link href={`/faculty/students/${s.studentId}`}>
                    <button className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-all">
                      <BrainCircuit size={14} className="text-[#63D2F3]" />
                      View AI
                      <ChevronRight size={12} strokeWidth={3} />
                    </button>
                  </Link>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {noteStudent && (
        <div className="fixed inset-0 z-100 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-4xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                Faculty Annotation
              </h3>
              <button onClick={() => setNoteStudent(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-1">
              {noteStudent.name}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
              {noteStudent.studentId} • {noteStudent.Course}
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="Type note for student risk alert..."
              className="w-full rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#63D2F3]"
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {note.trim().length}/1000
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNoteStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={sending}
                  onClick={submitNote}
                  className="px-4 py-2 rounded-xl bg-[#63D2F3] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
