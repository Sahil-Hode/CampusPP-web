"use client";

import { Bell, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardTheme } from "../../../components/ThemeProvider";

type NotificationItem = {
  title: string;
  text: string;
  time: string;
  color: string;
};

export default function DashboardHeader({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const { toggleTheme } = useDashboardTheme();

  const relative = (iso?: string) => {
    if (!iso) return "now";
    const deltaMs = Date.now() - new Date(iso).getTime();
    const min = Math.max(1, Math.floor(deltaMs / 60000));
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  useEffect(() => {
    let active = true;
    async function fetchFacultyAnnotations() {
      const studentId = localStorage.getItem("student_id");
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!studentId || !token) {
        setNotes([]);
        return;
      }

      try {
        const res = await fetch(`/api/faculty-annotations/student/${studentId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) return;

        const mapped: NotificationItem[] = (json?.data || []).slice(0, 8).map((n: any) => ({
          title: "Faculty Annotation",
          text: `${n.facultyName}: ${n.note}`,
          time: relative(n.timestamp),
          color: "text-emerald-500",
        }));

        if (active) setNotes(mapped);
      } catch {
        if (active) setNotes([]);
      }
    }

    fetchFacultyAnnotations();
    const id = setInterval(fetchFacultyAnnotations, 20000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const notifications = useMemo(() => {
    const fallback = [
      {
        title: "System",
        text: "Your dashboard is active",
        time: "now",
        color: "text-[#63D2F3]",
      },
    ];

    return notes.length ? notes : fallback;
  }, [notes]);

  return (
    <header className="sticky top-0 z-100 bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-500 px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center justify-between lg:justify-end">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 rounded-xl border-2 bg-white dark:bg-zinc-800 border-slate-50 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:text-[#63D2F3] transition-all"
          aria-label="Open sidebar"
        >
          <Menu size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-2 md:gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 md:p-3 rounded-xl md:rounded-2xl border-2 bg-white dark:bg-zinc-800 border-slate-50 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:text-[#63D2F3] transition-all"
        >
          <Sun size={20} strokeWidth={3} className="hidden dark:block" />
          <Moon size={20} strokeWidth={3} className="block dark:hidden" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl relative transition-all border-2 ${
              open
                ? "bg-[#F6AD55] border-[#DD6B20] text-white shadow-lg"
                : "bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-300 border-slate-50 dark:border-zinc-700 hover:text-[#F6AD55]"
            }`}
          >
            <Bell size={20} strokeWidth={3} />
            {!open && notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-800 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                />

                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed left-4 right-4 md:absolute md:left-auto md:right-0 mt-4 md:w-80 z-50 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-4xl p-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Notifications
                    </h3>
                    <button onClick={() => setOpen(false)} className="md:hidden p-1">
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {notifications.map((note, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-transparent hover:border-[#F6AD55]/20 transition-all"
                      >
                        <div className="flex justify-between mb-1">
                          <span className={`text-[9px] font-black uppercase ${note.color}`}>
                            {note.title}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 dark:text-zinc-600">
                            {note.time}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </header>
  );
}
