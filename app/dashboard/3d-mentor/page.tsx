"use client";

import { useMemo, useState } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Volume2,
  Bot,
  User,
  Play,
  Pause,
  Captions,
} from "lucide-react";
import { motion } from "framer-motion";

type SubtitleLine = {
  id: number;
  speaker: "mentor" | "you";
  text: string;
  timestamp: string;
};

const demoSubtitles: SubtitleLine[] = [
  { id: 1, speaker: "mentor", text: "Welcome back. Ready for your mock discussion?", timestamp: "00:02" },
  { id: 2, speaker: "you", text: "Yes, please ask me one interview question.", timestamp: "00:06" },
  { id: 3, speaker: "mentor", text: "Tell me about a project where you solved a hard problem.", timestamp: "00:11" },
];

export default function Mentor3DPage() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSubtitleOn, setIsSubtitleOn] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [language, setLanguage] = useState("en");

  const statusText = useMemo(() => {
    if (!isSessionActive) return "Session idle";
    return isMicOn ? "Listening..." : "Mic paused";
  }, [isSessionActive, isMicOn]);

  return (
    <div className="min-h-full rounded-[2rem] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          3D Live Mentor Bot
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400">
          Speech-to-speech mentor interface with real-time subtitles.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 overflow-hidden"
        >
          <div className="h-[360px] md:h-[430px] bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(99,210,243,0.22),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(79,209,197,0.24),transparent_45%)]" />
            <div className="relative z-10 text-center px-6">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-white/40 dark:border-zinc-800 flex items-center justify-center shadow-lg">
                <Bot className="w-10 h-10 text-sky-500" />
              </div>
              <p className="mt-4 text-sm md:text-base font-bold text-slate-700 dark:text-zinc-200">
                3D Mentor Model Area
              </p>
              <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-zinc-400">
                Replace this container with your 3D model component.
              </p>
            </div>
          </div>

          <div className="p-4 md:p-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const next = !isSessionActive;
                  setIsSessionActive(next);
                  if (!next) setIsMicOn(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm"
              >
                {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isSessionActive ? "End Session" : "Start Session"}
              </button>

              <button
                onClick={() => setIsMicOn((prev) => !prev)}
                disabled={!isSessionActive}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm transition ${
                  isMicOn
                    ? "bg-rose-500 text-white"
                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {isMicOn ? "Mic On" : "Mic Off"}
              </button>

              <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm">
                <Languages className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600 dark:text-zinc-300">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 outline-none font-semibold text-slate-900 dark:text-zinc-100"
                >
                  <option value="en" className="text-slate-900 bg-white">English</option>
                  <option value="hi" className="text-slate-900 bg-white">Hindi</option>
                  <option value="mr" className="text-slate-900 bg-white">Marathi</option>
                </select>
              </label>

              <button
                onClick={() => setIsAudioOn((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border ${
                  isAudioOn
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-100"
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {isAudioOn ? "Voice On" : "Voice Off"}
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Status: <span className="text-slate-700 dark:text-zinc-200">{statusText}</span>
            </p>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
        >
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Captions className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-zinc-100">
                Live Subtitles
              </h2>
            </div>
            <button
              onClick={() => setIsSubtitleOn((prev) => !prev)}
              className="text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
            >
              {isSubtitleOn ? "Hide" : "Show"}
            </button>
          </div>

          <div className="p-4 h-[360px] md:h-[430px] overflow-y-auto space-y-3">
            {!isSubtitleOn && (
              <div className="h-full rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 grid place-items-center">
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Subtitles are hidden</p>
              </div>
            )}

            {isSubtitleOn &&
              demoSubtitles.map((line) => (
                <div
                  key={line.id}
                  className={`rounded-xl p-3 border ${
                    line.speaker === "mentor"
                      ? "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-900"
                      : "bg-slate-100 border-slate-200 dark:bg-zinc-900 dark:border-zinc-700"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide font-black mb-1 text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    {line.speaker === "mentor" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {line.speaker === "mentor" ? "Mentor" : "You"} • {line.timestamp}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-relaxed">
                    {line.text}
                  </p>
                </div>
              ))}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
