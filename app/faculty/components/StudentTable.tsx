"use client";

import Link from "next/link";
import RiskBadge from "./RiskBadge";
import { ChevronRight, User, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

const students = [
  { id: 1, name: "Rahul Sharma", risk: "High", gpa: 2.4, progress: 45 },
  { id: 2, name: "Aditi Verma", risk: "Medium", gpa: 3.2, progress: 72 },
  { id: 3, name: "Aman Gupta", risk: "Low", gpa: 3.9, progress: 91 },
];

export default function StudentTable() {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-800/50">
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Student Profile</th>
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Academic Risk</th>
              <th className="px-6 py-5 text-left text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">Engagement</th>
              <th className="px-6 py-5 text-right text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400">Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
            {students.map((s, index) => (
              <motion.tr 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GPA: {s.gpa}</p>
                    </div>
                  </div>
                </td>

                {/* RISK BADGE */}
                <td className="px-6 py-5">
                  <RiskBadge level={s.risk} />
                </td>

                {/* PROGRESS BAR (Engagement) */}
                <td className="px-6 py-5 hidden md:table-cell">
                  <div className="w-32">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">{s.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${
                          s.progress < 50 ? 'bg-red-500' : s.progress < 80 ? 'bg-amber-500' : 'bg-[#63D2F3]'
                        }`}
                      />
                    </div>
                  </div>
                </td>

                {/* ACTION BUTTON */}
                <td className="px-6 py-5 text-right">
                  <Link href={`/faculty/students/${s.id}`}>
                    <button className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-all">
                      <BrainCircuit size={14} className="text-[#63D2F3]" />
                      View AI
                      <ChevronRight size={12} strokeWidth={3} />
                    </button>
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}