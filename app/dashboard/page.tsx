"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Volume2,
  Play,
  Pause,
  Captions,
} from "lucide-react";
import { motion } from "framer-motion";

// Three.js/WebGL — must be lazy-loaded (browser only).
const MentorModel = lazy(() => import("./3d-mentor/MentorModel"));

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
  const [isSubtitleOn, setIsSubtitleOn] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [language, setLanguage] = useState("en");

  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const micOnRef = useRef(false);
  const sessionRef = useRef(false);

  const [isSpeechSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });

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

    const SpeechRecognition =
      w.SpeechRecognition || w.webkitSpeechRecognition;

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

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalChunk += transcript;
        } else {
          interim += transcript;
        }
      }

      setLiveText(interim.trim());

      if (finalChunk.trim()) {
        setFinalText((prev) =>
          `${prev} ${finalChunk.trim()}`.trim()
        );
      }
    };

    recognition.onend = () => {
      if (micOnRef.current && sessionRef.current) {
        try {
          recognition.start();
        } catch { }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch { }
    };
  }, [language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isSessionActive && isMicOn) {
      try {
        recognition.start();
      } catch { }
    } else {
      try {
        recognition.stop();
      } catch { }
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

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* 3D MODEL AREA */}
        <div className="h-[360px] md:h-[430px] bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 relative">

          <div className="absolute inset-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      border: "4px solid rgba(255,255,255,0.15)",
                      borderTop: "4px solid #38bdf8",
                      borderRadius: "50%",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              }
            >
              <MentorModel />
            </Suspense>
          </div>

          {isSubtitleOn &&
            (liveText ||
              finalText ||
              (isMicOn && isSessionActive)) && (
              <p className="absolute left-4 right-4 bottom-4 z-20 text-center text-white font-semibold text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                {liveText || finalText || "Speak now..."}
              </p>
            )}
        </div>

        {/* CONTROLS */}
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
              {isSessionActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isSessionActive ? "End Session" : "Start Session"}
            </button>

            <button
              onClick={() => setIsMicOn((prev) => !prev)}
              disabled={!isSessionActive}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm transition ${isMicOn
                ? "bg-rose-500 text-white"
                : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isMicOn ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              {isMicOn ? "Mic On" : "Mic Off"}
            </button>

            <button
              onClick={() => setIsSubtitleOn((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border ${isSubtitleOn
                ? "bg-sky-500 border-sky-500 text-white"
                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-100"
                }`}
            >
              <Captions className="w-4 h-4" />
              {isSubtitleOn ? "CC On" : "CC Off"}
            </button>

          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Status:{" "}
            <span className="text-slate-700 dark:text-zinc-200">
              {statusText}
            </span>
          </p>

          {!isSpeechSupported && (
            <p className="mt-2 text-xs font-semibold text-rose-500">
              Live speech recognition is not supported in this browser.
            </p>
          )}
        </div>
      </motion.section>
    </div>
  );
}