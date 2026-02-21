"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Languages, Volume2, Bot, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export default function Mentor3DPage() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isSpeechSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const micOnRef = useRef(false);
  const sessionRef = useRef(false);

  useEffect(() => {
    micOnRef.current = isMicOn;
    sessionRef.current = isSessionActive;
  }, [isMicOn, isSessionActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    const localeMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
    };
    recognition.lang = localeMap[language] || "en-IN";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalChunk += transcript;
        } else {
          interim += transcript;
        }
      }

      setLiveText(interim.trim());
      if (finalChunk.trim()) {
        setFinalText((prev) => `${prev} ${finalChunk.trim()}`.trim());
      }
    };

    recognition.onend = () => {
      if (micOnRef.current && sessionRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore repeated start attempts.
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // No-op.
      }
    };
  }, [language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isSessionActive && isMicOn) {
      try {
        recognition.start();
      } catch {
        // Ignore repeated start attempts.
      }
      return;
    }

    try {
      recognition.stop();
    } catch {
      // No-op.
    }
  }, [isSessionActive, isMicOn]);

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

      <div>
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 overflow-hidden"
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

            {(liveText || finalText || (isMicOn && isSessionActive)) && (
              <p className="absolute left-4 right-4 bottom-4 z-20 text-center text-white font-semibold text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                {liveText || finalText || "Speak now..."}
              </p>
            )}
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
            {!isSpeechSupported && (
              <p className="mt-2 text-xs font-semibold text-rose-500">
                Live speech recognition is not supported in this browser.
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
