"use client";

/**
 * 3D Mentor — Real-time Speech-to-Speech via Voice Chat API
 * ─────────────────────────────────────────────────────────
 * Flow:
 *   1. Connect Socket.IO to techxpression-hackathon.onrender.com
 *   2. Start Session → getUserMedia → AudioContext (16kHz) → ScriptProcessor
 *   3. Emit startStream → stream audioData chunks → silence detection auto-stops
 *   4. Server emits: transcription (live), aiResponse (text), ttsAudio (voice)
 *   5. ttsAudio → <audio> element → AudioContext analyser → lipSyncRef → 3D mouth
 * ─────────────────────────────────────────────────────────
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Play, Square, Captions,
  Volume2, VolumeX, Loader2, Wifi, WifiOff, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, type Socket } from "socket.io-client";

// Import the hook + types from MentorModel (adjust path to match your project)
import {
  useAudioLipSync,
  type LipSyncAnalysis,
  type LipSyncRef,
} from "./MentorModel";

const BACKEND_URL        = "https://techxpression-hackathon.onrender.com";
const SILENCE_THRESHOLD  = 0.01;
const SILENCE_DURATION   = 2000;
const MIN_SPEECH_DURATION = 1000;

/* ── Lazy-load the heavy 3D component ── */
const MentorModel = lazy(() => import("./MentorModel"));

/* ════════════════════════════════════════════════
   SMALL UI HELPERS (unchanged from your original)
════════════════════════════════════════════════ */
function ModelSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div style={{
        width: 48, height: 48,
        border: "4px solid rgba(255,255,255,0.15)",
        borderTop: "4px solid #38bdf8",
        borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PulseBars({ active }: { active: boolean }) {
  const heights = [12, 20, 28, 20, 12, 24, 16, 30, 20, 14];
  return (
    <span className="flex items-end gap-[2px] h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-rose-400"
          style={{
            height: active ? h : 4,
            transition: `height ${0.18 + i * 0.04}s ease`,
          }}
        />
      ))}
    </span>
  );
}

function StatusDot({ color }: { color: "green" | "amber" | "red" | "sky" }) {
  const map = {
    green: "bg-emerald-400", amber: "bg-amber-400",
    red:   "bg-rose-400",    sky:   "bg-sky-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[color]} animate-pulse`} />;
}

type ChatMessage = { role: "user" | "mentor"; text: string; ts: number };

/* ════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════ */
export default function Mentor3DPage() {

  /* ── Core state ─────────────────────────────────────────────────── */
  const [isConnected,      setIsConnected]      = useState(false);
  const [isSessionActive,  setIsSessionActive]  = useState(false);
  const [isRecording,      setIsRecording]      = useState(false);
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [isMentorSpeaking, setIsMentorSpeaking] = useState(false);
  const [isMuted,          setIsMuted]          = useState(false);
  const [isSubtitleOn,     setIsSubtitleOn]     = useState(true);
  const [connectionError,  setConnectionError]  = useState("");

  /* ── Text state ─────────────────────────────────────────────────── */
  const [liveTranscript, setLiveTranscript] = useState("");
  const [chatHistory,    setChatHistory]    = useState<ChatMessage[]>([]);
  const [mentorReply,    setMentorReply]    = useState("");

  /* ── Refs ───────────────────────────────────────────────────────── */
  const socketRef        = useRef<Socket | null>(null);
  const micCtxRef        = useRef<AudioContext | null>(null);     // mic AudioContext (16kHz)
  const processorRef     = useRef<ScriptProcessorNode | null>(null);
  const micAnalyserRef   = useRef<AnalyserNode | null>(null);
  const micStreamRef     = useRef<MediaStream | null>(null);
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef   = useRef<number>(0);
  const isRecordingRef   = useRef(false);
  const chatEndRef       = useRef<HTMLDivElement | null>(null);

  /* ── TTS <audio> element ref — this is what drives lip sync ──────── */
  const ttsAudioRef      = useRef<HTMLAudioElement | null>(null);

  /* ── LipSync ref — written by AudioContext analyser, read by Model ── */
  const lipSyncRef = useRef<LipSyncAnalysis>({
    mouthOpen: 0,
    visemeId:  0,
  }) as LipSyncRef;

  /* ── Hook that manages the AudioContext analyser on ttsAudioRef ───── */
  const { connectAudio, disconnectAudio } = useAudioLipSync(lipSyncRef);

  /* keep isRecordingRef in sync */
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  /* auto-scroll chat */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const addMessage = useCallback((role: "user" | "mentor", text: string) => {
    setChatHistory(prev => [...prev, { role, text, ts: Date.now() }]);
  }, []);

  /* ════════════════════════════════════════════════
     SOCKET SETUP
  ════════════════════════════════════════════════ */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;
    setConnectionError("");

    const socket = io(BACKEND_URL, {
      transports:           ["websocket"],
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect",    () => { setIsConnected(true);  setConnectionError(""); });
    socket.on("connected",  () =>   setIsConnected(true));
    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsRecording(false);
      setIsProcessing(false);
      setIsMentorSpeaking(false);
    });
    socket.on("connect_error", (err) => {
      setConnectionError(`Cannot reach server: ${err.message}`);
      setIsConnected(false);
    });

    /* ── Live transcription ── */
    socket.on("transcription", (data: { text: string; isFinal: boolean }) => {
      setLiveTranscript(data.text);
      if (data.isFinal && data.text.trim()) {
        addMessage("user", data.text.trim());
        setLiveTranscript("");
      }
    });

    /* ── AI text response ── */
    socket.on("aiResponse", (data: { transcription?: string; response: string }) => {
      setIsProcessing(false);
      setMentorReply(data.response);
      addMessage("mentor", data.response);
    });

    /* ════════════════════════════════════════════════
       TTS AUDIO — the lip sync entry point
       1. Build a blob URL from the base64 payload
       2. Assign it to ttsAudioRef (an <audio> element)
       3. Call connectAudio() to start the analyser RAF loop
       4. Play — the analyser writes lipSyncRef each frame
       5. On end/error — disconnectAudio() closes context
    ════════════════════════════════════════════════ */
    socket.on("ttsAudio", (data: { audioBase64: string; mimeType: string }) => {
      if (isMuted) return;

      /* Stop any currently playing TTS */
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = "";
      }
      disconnectAudio();
      setIsMentorSpeaking(false);

      /* Build audio element */
      const audio = new Audio();
      // crossOrigin must be set BEFORE src for AudioContext to work
      audio.crossOrigin = "anonymous";
      audio.src = `data:${data.mimeType};base64,${data.audioBase64}`;
      ttsAudioRef.current = audio;

      /* Wire up the AudioContext analyser */
      connectAudio(audio);

      audio.onplay = () => setIsMentorSpeaking(true);

      audio.onended = () => {
        disconnectAudio();
        setIsMentorSpeaking(false);
        ttsAudioRef.current = null;
      };

      audio.onerror = () => {
        disconnectAudio();
        setIsMentorSpeaking(false);
        ttsAudioRef.current = null;
      };

      audio.play().catch((e) => {
        console.warn("[TTS] play() rejected:", e);
        disconnectAudio();
        setIsMentorSpeaking(false);
      });
    });

    socket.on("ttsError",  () => { setIsMentorSpeaking(false); setIsProcessing(false); });
    socket.on("error",     (data: { message?: string }) => {
      setIsProcessing(false);
      setIsRecording(false);
      console.error("[VoiceChat error]", data.message);
    });
    socket.on("historyCleared", () => { setChatHistory([]); setMentorReply(""); });

    socketRef.current = socket;
  }, [addMessage, isMuted, connectAudio, disconnectAudio]);

  /* ════════════════════════════════════════════════
     STOP RECORDING
  ════════════════════════════════════════════════ */
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    processorRef.current?.disconnect();
    micAnalyserRef.current?.disconnect();
    processorRef.current  = null;
    micAnalyserRef.current = null;

    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;

    micCtxRef.current?.close().catch(() => {});
    micCtxRef.current = null;

    setIsRecording(false);
    setLiveTranscript("");
    setIsProcessing(true);

    socketRef.current?.emit("stopStream", {
      languageCode: "en-US",
      systemPrompt:
        "You are a friendly and knowledgeable 3D AI mentor. Give clear, helpful, encouraging responses. Keep answers concise (2-4 sentences) unless asked for detail.",
    });
  }, []);

  /* ════════════════════════════════════════════════
     START RECORDING
  ════════════════════════════════════════════════ */
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (!socketRef.current?.connected) return;

    /* Stop any playing mentor audio */
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = "";
      ttsAudioRef.current = null;
    }
    disconnectAudio();
    setIsMentorSpeaking(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, sampleRate: 16000,
          echoCancellation: true, noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;

      const ctx       = new AudioContext({ sampleRate: 16000 });
      const mic       = ctx.createMediaStreamSource(stream);
      const analyser  = ctx.createAnalyser();
      analyser.fftSize = 512;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      speechStartRef.current = Date.now();

      const rmsData = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart: number | null = null;

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;

        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++) {
          const s = Math.max(-1, Math.min(1, f32[i]));
          i16[i]  = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        socketRef.current?.emit("audioData", i16.buffer);

        analyser.getByteTimeDomainData(rmsData);
        let sum = 0;
        for (let i = 0; i < rmsData.length; i++) {
          const v = (rmsData[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / rmsData.length);
        const spokenLong = Date.now() - speechStartRef.current > MIN_SPEECH_DURATION;

        if (rms > SILENCE_THRESHOLD) {
          silenceStart = null;
        } else {
          if (silenceStart === null) silenceStart = Date.now();
          if (spokenLong && Date.now() - silenceStart > SILENCE_DURATION) stopRecording();
        }
      };

      micCtxRef.current   = ctx;
      processorRef.current = processor;
      micAnalyserRef.current = analyser;

      if (ctx.state === "suspended") await ctx.resume();

      isRecordingRef.current = true;
      setIsRecording(true);

      socketRef.current.emit("startStream", {
        encoding: "LINEAR16", sampleRateHertz: 16000, languageCode: "en-US",
      });

      mic.connect(analyser);
      analyser.connect(processor);
      processor.connect(ctx.destination);

    } catch (err) {
      console.error("Mic error:", err);
      isRecordingRef.current = false;
      setConnectionError("Microphone access denied. Please allow mic access.");
    }
  }, [stopRecording, disconnectAudio]);

  /* ════════════════════════════════════════════════
     SESSION CONTROL
  ════════════════════════════════════════════════ */
  const startSession = useCallback(() => {
    connectSocket();
    setIsSessionActive(true);
    setChatHistory([]);
    setMentorReply("");
    setLiveTranscript("");
  }, [connectSocket]);

  const endSession = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    disconnectAudio();
    socketRef.current?.emit("clearHistory");
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsSessionActive(false);
    setIsConnected(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsMentorSpeaking(false);
    setChatHistory([]);
    setMentorReply("");
    setLiveTranscript("");
  }, [stopRecording, disconnectAudio]);

  /* cleanup on unmount */
  useEffect(() => () => { endSession(); }, []); // eslint-disable-line

  /* auto-connect when session starts */
  useEffect(() => {
    if (isSessionActive) connectSocket();
  }, [isSessionActive, connectSocket]);

  /* ── Derived status ─────────────────────────────────────────────── */
  const statusLabel = (() => {
    if (!isSessionActive)  return { text: "Session idle",    color: "red"   as const };
    if (!isConnected)      return { text: "Connecting…",     color: "amber" as const };
    if (isRecording)       return { text: "Listening…",      color: "red"   as const };
    if (isProcessing)      return { text: "Thinking…",       color: "amber" as const };
    if (isMentorSpeaking)  return { text: "Mentor speaking", color: "sky"   as const };
    return                        { text: "Ready — tap mic", color: "green" as const };
  })();

  const subtitleText = (() => {
    if (isRecording && liveTranscript) return liveTranscript;
    if (isProcessing)                  return "Processing…";
    if (isMentorSpeaking && mentorReply) return mentorReply;
    return "";
  })();

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="min-h-full rounded-[2rem] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            3D Live Mentor Bot
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            AI-powered speech-to-speech mentor · speak naturally
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
          {isConnected
            ? <><Wifi className="w-3.5 h-3.5 text-emerald-400" /> Connected</>
            : <><WifiOff className="w-3.5 h-3.5 text-slate-400" /> Disconnected</>}
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* ── 3D CANVAS ── */}
        <div className="h-[360px] md:h-[430px] relative bg-black">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/3d mentor bg.jpeg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />

          <div className="absolute inset-0">
            <Suspense fallback={<ModelSpinner />}>
              {/*
                ─── KEY CHANGE ───────────────────────────────────────────────
                Pass isSpeaking + lipSyncRef so the 3D mouth moves with audio.
                The lipSyncRef is written every frame by the AudioContext
                analyser that's connected to the TTS <audio> element.
              ─────────────────────────────────────────────────────────────── */}
              <MentorModel
                isSpeaking={isMentorSpeaking}
                lipSyncRef={lipSyncRef}
              />
            </Suspense>
          </div>

          {/* ── Status badges ── */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                key="listening-badge"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{   opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="text-white text-xs font-bold">Listening</span>
              </motion.div>
            )}
            {isMentorSpeaking && !isRecording && (
              <motion.div
                key="speaking-badge"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{   opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-sky-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                {/* Animated audio bars */}
                <span className="flex items-end gap-[2px] h-3.5">
                  {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
                    <span
                      key={i}
                      className="w-[2px] bg-white rounded-full animate-bounce"
                      style={{
                        height: `${h * 14}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.55s",
                      }}
                    />
                  ))}
                </span>
                <span className="text-white text-xs font-bold">Mentor Speaking</span>
              </motion.div>
            )}
            {isProcessing && !isRecording && (
              <motion.div
                key="processing-badge"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{   opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span className="text-white text-xs font-bold">Thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Subtitle overlay ── */}
          {isSubtitleOn && subtitleText && (
            <div className="absolute left-3 right-3 bottom-4 z-20">
              <p className={`
                text-center text-white font-semibold text-base
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]
                px-4 py-2 rounded-xl backdrop-blur-sm leading-snug
                ${isRecording ? "bg-rose-900/50" : "bg-black/55"}
              `}>
                {subtitleText}
              </p>
            </div>
          )}
        </div>

        {/* ── CONTROLS BAR ── */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">

          {connectionError && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <span className="flex-1">{connectionError}</span>
              <button
                onClick={() => { setConnectionError(""); connectSocket(); }}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">

            {/* Start / End session */}
            {!isSessionActive ? (
              <button
                onClick={startSession}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 transition"
              >
                <Play className="w-4 h-4" /> Start Session
              </button>
            ) : (
              <button
                onClick={endSession}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition"
              >
                <Square className="w-4 h-4" /> End Session
              </button>
            )}

            {isSessionActive && (
              <>
                {/* Mic button */}
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!isConnected || isProcessing || isMentorSpeaking}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition"
                  >
                    <Mic className="w-4 h-4 text-rose-500" /> Speak
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition"
                  >
                    <PulseBars active={isRecording} />
                    <MicOff className="w-4 h-4 ml-1" /> Stop
                  </button>
                )}

                {/* Mute */}
                <button
                  onClick={() => {
                    setIsMuted(m => !m);
                    if (!isMuted && ttsAudioRef.current) {
                      ttsAudioRef.current.pause();
                      disconnectAudio();
                      setIsMentorSpeaking(false);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border transition ${
                    isMuted
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                  title={isMuted ? "Unmute mentor" : "Mute mentor"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* CC toggle */}
                <button
                  onClick={() => setIsSubtitleOn(p => !p)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border transition ${
                    isSubtitleOn
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Captions className="w-4 h-4" />
                  {isSubtitleOn ? "CC On" : "CC Off"}
                </button>

                {/* Clear history */}
                <button
                  onClick={() => {
                    socketRef.current?.emit("clearHistory");
                    setChatHistory([]);
                    setMentorReply("");
                  }}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  title="Clear chat history"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </>
            )}
          </div>

          {/* Status row */}
          <div className="mt-3 flex items-center gap-2">
            <StatusDot color={statusLabel.color} />
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Status:{" "}
              <span className="text-slate-700 dark:text-zinc-200">{statusLabel.text}</span>
            </p>
            {isSessionActive && (
              <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">
                · Silence auto-stops mic after 2 s
              </span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SPEECH & ANSWER PANEL
            Always visible once session starts.
            Left  — Your speech (live STT + last finalised)
            Right — Mentor AI answer (latest + speaking state)
        ══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isSessionActive && (
            <motion.div
              key="speech-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{   height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800">

                {/* ── LEFT: Your speech ───────────────────────── */}
                <div className="p-4 bg-white dark:bg-zinc-900 flex flex-col gap-2 min-h-[120px]">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                      isRecording ? "bg-rose-500 animate-pulse" : "bg-slate-300 dark:bg-zinc-600"
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Your Speech
                    </span>
                    {isRecording && (
                      <span className="ml-auto text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <Mic className="w-3 h-3" /> Live
                      </span>
                    )}
                  </div>

                  {/* Live interim transcript (typing effect) */}
                  {isRecording && liveTranscript ? (
                    <p className="text-sm text-rose-600 dark:text-rose-400 font-medium italic leading-relaxed">
                      "{liveTranscript}"
                      <span className="inline-block w-0.5 h-4 bg-rose-400 ml-0.5 animate-pulse align-middle" />
                    </p>
                  ) : isRecording ? (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 italic flex items-center gap-1.5">
                      <span className="flex gap-0.5">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1 h-1 rounded-full bg-rose-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                      Listening…
                    </p>
                  ) : null}

                  {/* Last finalised user message */}
                  {!isRecording && (() => {
                    const lastUser = [...chatHistory].reverse().find(m => m.role === "user");
                    return lastUser ? (
                      <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed">
                        "{lastUser.text}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300 dark:text-zinc-600 italic mt-auto">
                        Press <span className="font-bold">Speak</span> and ask anything…
                      </p>
                    );
                  })()}
                </div>

                {/* ── RIGHT: Mentor AI answer ──────────────────── */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 flex flex-col gap-2 min-h-[120px]">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                      isMentorSpeaking ? "bg-sky-500 animate-pulse"
                      : isProcessing   ? "bg-amber-400 animate-pulse"
                      : "bg-slate-300 dark:bg-zinc-600"
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Mentor Answer
                    </span>
                    {isMentorSpeaking && (
                      <span className="ml-auto flex items-end gap-[2px] h-3">
                        {[0.5,1,0.7,0.9,0.6].map((h, i) => (
                          <span key={i} className="w-[2px] bg-sky-400 rounded-full animate-bounce"
                            style={{ height: `${h * 12}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.55s" }} />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Processing state */}
                  {isProcessing && !mentorReply && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 italic flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating response…
                    </p>
                  )}

                  {/* Mentor reply text */}
                  {mentorReply ? (
                    <p className={`text-sm leading-relaxed transition-colors ${
                      isMentorSpeaking
                        ? "text-sky-700 dark:text-sky-300 font-medium"
                        : "text-slate-700 dark:text-zinc-200"
                    }`}>
                      {mentorReply}
                    </p>
                  ) : !isProcessing ? (
                    <p className="text-xs text-slate-300 dark:text-zinc-600 italic mt-auto">
                      Mentor's response will appear here…
                    </p>
                  ) : null}
                </div>
              </div>

              {/* ── Scrollable full chat history (collapsed by default) ── */}
              {chatHistory.length > 2 && (
                <details className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <summary className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 select-none list-none flex items-center gap-2">
                    <span className="flex-1">Full Conversation ({chatHistory.length} messages)</span>
                    <span className="text-slate-300 dark:text-zinc-600">▾</span>
                  </summary>
                  <div className="max-h-64 overflow-y-auto px-4 pb-3 pt-1 flex flex-col gap-2">
                    {chatHistory.map((msg) => (
                      <div key={msg.ts} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                          msg.role === "user"
                            ? "bg-rose-500 text-white rounded-br-sm"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-bl-sm"
                        }`}>
                          <span className="block text-[10px] font-black opacity-50 mb-0.5">
                            {msg.role === "user" ? "You" : "Mentor"}
                          </span>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}