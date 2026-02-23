"use client";

/**
 * 3D Mentor — Real-time Speech-to-Speech via Voice Chat API
 * ─────────────────────────────────────────────────────────
 * Flow:
 *   1. Connect Socket.IO to techxpression-hackathon.onrender.com (root namespace)
 *   2. Start Session → getUserMedia → AudioContext (16kHz) → ScriptProcessor
 *   3. Emit startStream → stream audioData chunks → silence detection auto-stops
 *   4. Server emits: transcription (live), aiResponse (text), ttsAudio (voice)
 *   5. Play AI audio; loop for next turn
 * ─────────────────────────────────────────────────────────
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Play,
  Square,
  Captions,
  Volume2,
  VolumeX,
  Loader2,
  Wifi,
  WifiOff,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, type Socket } from "socket.io-client";

const BACKEND_URL = "https://techxpression-hackathon.onrender.com";

// Silence detection constants (mirrors server docs)
const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION  = 2000; // 2 s
const MIN_SPEECH_DURATION = 1000; // 1 s

const MentorModel = lazy(() => import("./MentorModel"));

/* ── spinner ── */
function ModelSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.15)", borderTop: "4px solid #38bdf8", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── audio pulse bars (shown while mic is active) ── */
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
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </span>
  );
}

/* ── status dot ── */
function StatusDot({ color }: { color: "green" | "amber" | "red" | "sky" }) {
  const map = { green: "bg-emerald-400", amber: "bg-amber-400", red: "bg-rose-400", sky: "bg-sky-400" };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[color]} animate-pulse`} />;
}

/* ── chat message type ── */
type ChatMessage = { role: "user" | "mentor"; text: string; ts: number };

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════ */
export default function Mentor3DPage() {
  /* ── core state ── */
  const [isConnected,     setIsConnected]     = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRecording,     setIsRecording]     = useState(false);
  const [isProcessing,    setIsProcessing]    = useState(false);
  const [isMentorSpeaking,setIsMentorSpeaking]= useState(false);
  const [isMuted,         setIsMuted]         = useState(false);
  const [isSubtitleOn,    setIsSubtitleOn]    = useState(true);
  const [connectionError, setConnectionError] = useState("");

  /* ── text state ── */
  const [liveTranscript, setLiveTranscript] = useState("");   // interim from server
  const [chatHistory,    setChatHistory]    = useState<ChatMessage[]>([]);
  const [mentorReply,    setMentorReply]    = useState("");   // latest AI text

  /* ── refs ── */
  const socketRef       = useRef<Socket | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const processorRef    = useRef<ScriptProcessorNode | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const micStreamRef    = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef  = useRef<number>(0);
  const isRecordingRef  = useRef(false);
  const chatEndRef      = useRef<HTMLDivElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  /* keep ref in sync */
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  /* auto-scroll chat */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  /* ── helpers ── */
  const addMessage = useCallback((role: "user" | "mentor", text: string) => {
    setChatHistory(prev => [...prev, { role, text, ts: Date.now() }]);
  }, []);

  /* ── SOCKET SETUP ── */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnectionError("");
    const socket = io(BACKEND_URL, {
      transports:              ["websocket"],
      reconnection:            true,
      reconnectionDelay:       1000,
      reconnectionAttempts:    5,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError("");
    });

    socket.on("connected", () => {
      setIsConnected(true);
    });

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

    /* live transcription from Google STT */
    socket.on("transcription", (data: { text: string; isFinal: boolean }) => {
      setLiveTranscript(data.text);
      if (data.isFinal && data.text.trim()) {
        addMessage("user", data.text.trim());
        setLiveTranscript("");
      }
    });

    /* AI text response */
    socket.on("aiResponse", (data: { transcription?: string; response: string }) => {
      setIsProcessing(false);
      setMentorReply(data.response);
      addMessage("mentor", data.response);
    });

    /* AI voice audio */
    socket.on("ttsAudio", (data: { audioBase64: string; mimeType: string }) => {
      if (isMuted) return;
      setIsMentorSpeaking(true);
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsMentorSpeaking(false); currentAudioRef.current = null; };
      audio.onerror = () => { setIsMentorSpeaking(false); currentAudioRef.current = null; };
      audio.play().catch(() => setIsMentorSpeaking(false));
    });

    socket.on("ttsError", () => {
      setIsMentorSpeaking(false);
      setIsProcessing(false);
    });

    socket.on("error", (data: { message?: string }) => {
      setIsProcessing(false);
      setIsRecording(false);
      console.error("[VoiceChat error]", data.message);
    });

    socket.on("historyCleared", () => {
      setChatHistory([]);
      setMentorReply("");
    });

    socketRef.current = socket;
  }, [addMessage, isMuted]);

  /* ── STOP RECORDING ── */
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    // Set ref immediately so onaudioprocess stops sending before teardown
    isRecordingRef.current = false;

    /* tear down audio pipeline */
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    processorRef.current?.disconnect();
    analyserRef.current?.disconnect();
    processorRef.current = null;
    analyserRef.current  = null;

    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;

    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;

    setIsRecording(false);
    setLiveTranscript("");
    setIsProcessing(true);

    socketRef.current?.emit("stopStream", {
      languageCode: "en-US",
      systemPrompt:
        "You are a friendly and knowledgeable 3D AI mentor. Give clear, helpful, encouraging responses. Keep answers concise (2-4 sentences) unless asked for detail.",
    });
  }, []);

  /* ── START RECORDING ── */
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (!socketRef.current?.connected) return;

    /* stop any playing mentor audio */
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; setIsMentorSpeaking(false); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      /* create audio context at 16kHz */
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

        /* convert Float32 → Int16 and send */
        const f32  = e.inputBuffer.getChannelData(0);
        const i16  = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++) {
          const s = Math.max(-1, Math.min(1, f32[i]));
          i16[i]  = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        socketRef.current?.emit("audioData", i16.buffer);

        /* silence detection via RMS */
        analyser.getByteTimeDomainData(rmsData);
        let sum = 0;
        for (let i = 0; i < rmsData.length; i++) {
          const v = (rmsData[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / rmsData.length);

        const spokenLong = Date.now() - speechStartRef.current > MIN_SPEECH_DURATION;

        if (rms > SILENCE_THRESHOLD) {
          silenceStart = null; // user is speaking — reset
        } else {
          if (silenceStart === null) silenceStart = Date.now();
          if (spokenLong && Date.now() - silenceStart > SILENCE_DURATION) {
            stopRecording(); // auto-stop on silence
          }
        }
      };

      audioCtxRef.current  = ctx;
      processorRef.current = processor;
      analyserRef.current  = analyser;

      // Resume context (some browsers start it suspended)
      if (ctx.state === "suspended") await ctx.resume();

      // Set the ref DIRECTLY before emitting startStream so the first
      // onaudioprocess callback immediately sends audio — if we wait for
      // the useEffect that syncs isRecordingRef the server times out
      // waiting for audio after opening the STT stream.
      isRecordingRef.current = true;
      setIsRecording(true);

      // Emit startStream THEN connect the processor so audio flows
      // immediately after the server acknowledges the stream open.
      socketRef.current.emit("startStream", {
        encoding:        "LINEAR16",
        sampleRateHertz: 16000,
        languageCode:    "en-US",
      });

      mic.connect(analyser);
      analyser.connect(processor);
      processor.connect(ctx.destination);
    } catch (err) {
      console.error("Mic error:", err);
      isRecordingRef.current = false;
      setConnectionError("Microphone access denied. Please allow mic access.");
    }
  }, [stopRecording]);

  /* ── START SESSION ── */
  const startSession = useCallback(() => {
    connectSocket();
    setIsSessionActive(true);
    setChatHistory([]);
    setMentorReply("");
    setLiveTranscript("");
  }, [connectSocket]);

  /* ── END SESSION ── */
  const endSession = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
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
  }, [stopRecording]);

  /* cleanup on unmount */
  useEffect(() => () => { endSession(); }, []);   // eslint-disable-line

  /* auto-connect socket when session starts */
  useEffect(() => {
    if (isSessionActive) connectSocket();
  }, [isSessionActive, connectSocket]);

  /* ── derived status label ── */
  const statusLabel = (() => {
    if (!isSessionActive)    return { text: "Session idle",          color: "red"   as const };
    if (!isConnected)        return { text: "Connecting…",           color: "amber" as const };
    if (isRecording)         return { text: "Listening…",            color: "rose"  as const };
    if (isProcessing)        return { text: "Thinking…",             color: "amber" as const };
    if (isMentorSpeaking)    return { text: "Mentor speaking",       color: "sky"   as const };
    return                          { text: "Ready — tap mic",       color: "green" as const };
  })();

  /* ── subtitle text shown on the 3D canvas ── */
  const subtitleText = (() => {
    if (isRecording && liveTranscript) return liveTranscript;
    if (isProcessing)                  return "Processing…";
    if (isMentorSpeaking && mentorReply) return mentorReply;
    return "";
  })();

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

        {/* connection badge */}
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
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
            style={{ backgroundImage: "url('/3d mentor bg.jpeg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />

          <div className="absolute inset-0">
            <Suspense fallback={<ModelSpinner />}>
              <MentorModel />
            </Suspense>
          </div>

          {/* recording pulse ring */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                key="pulse-ring"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="text-white text-xs font-bold">Listening</span>
              </motion.div>
            )}
            {isMentorSpeaking && (
              <motion.div
                key="speaking-badge"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-sky-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-white text-xs font-bold">Mentor Speaking</span>
              </motion.div>
            )}
            {isProcessing && (
              <motion.div
                key="processing-badge"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span className="text-white text-xs font-bold">Thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* subtitle overlay */}
          {isSubtitleOn && subtitleText && (
            <div className="absolute left-3 right-3 bottom-4 z-20">
              <p className={`text-center text-white font-semibold text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] px-4 py-2 rounded-xl backdrop-blur-sm leading-snug ${isRecording ? "bg-rose-900/50" : "bg-black/50"}`}>
                {subtitleText}
              </p>
            </div>
          )}
        </div>

        {/* ── CONTROLS BAR ── */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">

          {/* error banner */}
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
                <Play className="w-4 h-4" />
                Start Session
              </button>
            ) : (
              <button
                onClick={endSession}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition"
              >
                <Square className="w-4 h-4" />
                End Session
              </button>
            )}

            {/* Mic toggle / press-to-record */}
            {isSessionActive && (
              <>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!isConnected || isProcessing || isMentorSpeaking}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition"
                  >
                    <Mic className="w-4 h-4 text-rose-500" />
                    Speak
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition"
                  >
                    <PulseBars active={isRecording} />
                    <MicOff className="w-4 h-4 ml-1" />
                    Stop
                  </button>
                )}

                {/* Mute AI audio */}
                <button
                  onClick={() => {
                    setIsMuted(m => !m);
                    if (!isMuted && currentAudioRef.current) { currentAudioRef.current.pause(); setIsMentorSpeaking(false); }
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border transition ${isMuted
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold border transition ${isSubtitleOn
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Captions className="w-4 h-4" />
                  {isSubtitleOn ? "CC On" : "CC Off"}
                </button>

                {/* Clear history */}
                <button
                  onClick={() => { socketRef.current?.emit("clearHistory"); setChatHistory([]); setMentorReply(""); }}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  title="Clear chat history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}

          </div>

          {/* status row */}
          <div className="mt-3 flex items-center gap-2">
            <StatusDot color={statusLabel.color === "rose" ? "red" : statusLabel.color} />
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

        {/* ── CHAT TRANSCRIPT PANEL ── */}
        <AnimatePresence>
          {isSessionActive && chatHistory.length > 0 && (
            <motion.div
              key="chat-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <div className="max-h-52 overflow-y-auto px-4 py-3 flex flex-col gap-2 scrollbar-thin">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.ts}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                        msg.role === "user"
                          ? "bg-rose-500 text-white rounded-br-sm"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-bl-sm"
                      }`}
                    >
                      <span className="block text-[10px] font-bold opacity-60 mb-0.5">
                        {msg.role === "user" ? "You" : "Mentor"}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* live interim transcript bubble */}
                {isRecording && liveTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm bg-rose-200 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 italic">
                      <span className="block text-[10px] font-bold opacity-60 mb-0.5">You (speaking…)</span>
                      {liveTranscript}
                    </div>
                  </div>
                )}

                {/* mentor thinking bubble */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 italic flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mentor is thinking…
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
