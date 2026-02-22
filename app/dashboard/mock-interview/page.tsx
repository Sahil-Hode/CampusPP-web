"use client";

/**
 * Mock Interview Room
 * ──────────────────────────────────────────────────────────────
 * Layout:
 *   ┌────────────────────────────┬──────────────────┐
 *   │  3D AI Avatar (active)     │  Candidate cam   │
 *   │  InterviewAvatar3D         │  video / photo   │
 *   └────────────────────────────┴──────────────────┘
 *   ┌──────────┬──────────┬──────────────────────────┐
 *   │ AI tile  │ AI tile  │  Question display         │
 *   │ 2D badge │ 2D badge │                           │
 *   └──────────┴──────────┴──────────────────────────┘
 *   [Controls bar]
 * ──────────────────────────────────────────────────────────────
 */

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  CameraOff,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Users,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import Image from "next/image";
import AnimatedAvatar from "@/components/AnimatedAvatar";

/*
 * Turbopack-safe lazy import.
 * Do NOT use next/dynamic here — it breaks in Next.js 16 + Turbopack.
 * React.lazy + Suspense is the correct pattern for client-only heavy modules.
 */
const InterviewAvatar3D = lazy(() => import("@/components/InterviewAvatar3D"));

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
type AIParticipant = {
  id: string;
  name: string;
  role: string;
  accentColor: string;
  pitch?: number;
};

const AI_PARTICIPANTS: AIParticipant[] = [
  { id: "ai-1", name: "Alex", role: "Technical Panel", accentColor: "#63D2F3", pitch: 0.92 },
  { id: "ai-2", name: "Jordan", role: "HR Panel", accentColor: "#a78bfa", pitch: 1.12 },
  { id: "ai-mentor", name: "Quinn", role: "Live Feedback", accentColor: "#34d399", pitch: 0.98 },
];

const DEMO_QUESTIONS = [
  "Tell me about yourself and walk me through your professional background.",
  "What is the difference between a process and a thread in an operating system?",
  "Can you explain the concept of RESTful APIs and their core principles?",
  "Describe the most challenging project you've worked on and how you navigated it.",
  "What are your greatest technical strengths, and where do you see room to grow?",
  "How do you approach debugging a critical issue in a live production environment?",
  "Where do you see yourself professionally in three to five years from now?",
  "Explain the difference between SQL and NoSQL databases with a real-world use case.",
  "How do you ensure code quality and maintainability in a fast-moving team?",
  "What is your experience with system design, and how would you design a URL shortener?",
];

/* ══════════════════════════════════════════
   HOOK — SpeechSynthesis
══════════════════════════════════════════ */
function useSpeechSynthesis() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    clearKeepAlive();
    setSpeakingId(null);
  }, [clearKeepAlive]);

  const speak = useCallback(
    (text: string, participantId: string, pitch = 1.0) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      clearKeepAlive();
      setSpeakingId(participantId);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93;
      utterance.pitch = pitch;
      utterance.volume = 1;

      // Chrome cuts utterances > ~15s — keep alive with pause/resume
      keepAliveRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearKeepAlive();
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 13_000);

      utterance.onend = () => { setSpeakingId(null); clearKeepAlive(); };
      utterance.onerror = () => { setSpeakingId(null); clearKeepAlive(); };

      window.speechSynthesis.speak(utterance);
    },
    [clearKeepAlive],
  );

  useEffect(() => () => stop(), [stop]);

  return { speakingId, speak, stop };
}

/* ══════════════════════════════════════════
   3D AVATAR LOADING PLACEHOLDER
══════════════════════════════════════════ */
function Avatar3DSkeleton({ accentColor }: { accentColor: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "linear-gradient(160deg, #0d1b2e 0%, #0a0f1e 100%)",
        borderRadius: "inherit",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: `3px solid ${accentColor}30`,
          borderTop: `3px solid ${accentColor}`,
          animation: "spin 0.85s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 11, color: accentColor, fontWeight: 700, letterSpacing: "0.07em" }}>
        Loading 3D Avatar…
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function MockInterviewPage() {
  /* Media state */
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [hasStream, setHasStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  /* Profile */
  const [profilePhoto, setProfilePhoto] = useState("");
  const [userName, setUserName] = useState("You");

  /* Interview state */
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeAiId, setActiveAiId] = useState("ai-1");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const { speakingId, speak, stop } = useSpeechSynthesis();

  const activeAI = AI_PARTICIPANTS.find((p) => p.id === activeAiId) ?? AI_PARTICIPANTS[0];
  const inactiveAIs = AI_PARTICIPANTS.filter((p) => p.id !== activeAiId);

  /* ── Media init ── */
  async function startLocalMedia() {
    try {
      setIsConnecting(true);
      setDeviceError("");
      streamRef.current = new MediaStream();
      setHasStream(true);
      setIsCamOn(false);
      setIsMicOn(false);
    } catch (error) {
      console.error("Failed to initialise media", error);
      setDeviceError("Please allow camera and microphone access to continue.");
      setHasStream(false);
    } finally {
      setIsConnecting(false);
    }
  }

  function stopLocalMedia() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setHasStream(false);
  }

  useEffect(() => {
    startLocalMedia();
    return () => stopLocalMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiRequest("/student/profile", { method: "GET" });
        const root = (res as Record<string, unknown>) ?? {};
        const data = ((root.data as Record<string, unknown>) ?? {}) as Record<string, unknown>;
        if (typeof data.profilePhoto === "string" && data.profilePhoto.trim())
          setProfilePhoto(data.profilePhoto);
        if (typeof data.name === "string" && data.name.trim())
          setUserName(data.name.trim());
      } catch { /* non-fatal */ }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!localVideoRef.current || !streamRef.current) return;
    localVideoRef.current.srcObject = streamRef.current;
  }, [hasStream]);

  /* ── Mic / Camera ── */
  async function toggleMic() {
    if (!streamRef.current) return;
    if (isMicOn) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.stop(); streamRef.current?.removeTrack(t);
      });
      setIsMicOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current.addTrack(s.getAudioTracks()[0]);
      setIsMicOn(true);
      setDeviceError("");
    } catch {
      setDeviceError("Microphone access denied.");
      setIsMicOn(false);
    }
  }

  async function toggleCamera() {
    if (!streamRef.current) return;
    if (isCamOn) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.stop(); streamRef.current?.removeTrack(t);
      });
      setIsCamOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current.addTrack(s.getVideoTracks()[0]);
      if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
      setIsCamOn(true);
      setDeviceError("");
    } catch {
      setDeviceError("Camera access denied.");
      setIsCamOn(false);
    }
  }

  function endCall() {
    stopLocalMedia();
    stop();
    setIsMicOn(false);
    setIsCamOn(false);
    setSessionStarted(false);
    setCurrentQuestion(null);
  }

  /* ── AI asks next question ── */
  function triggerAIQuestion() {
    if (speakingId) return;
    const q = DEMO_QUESTIONS[questionIndex % DEMO_QUESTIONS.length];
    setCurrentQuestion(q);
    setQuestionIndex((i) => i + 1);
    setSessionStarted(true);
    if (!isMuted) speak(q, activeAiId, activeAI.pitch ?? 1.0);
  }

  /* ── Switch active AI ── */
  function selectAI(id: string) {
    if (id === activeAiId) return;
    stop();
    setActiveAiId(id);
  }

  const totalQuestions = DEMO_QUESTIONS.length;
  const questionNum = Math.min(questionIndex, totalQuestions);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10">

      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Mock Interview Room
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mt-1">
          AI-powered panel with 3D interviewer avatar and live speech.
        </p>
      </div>

      {/* ── Main panel ── */}
      <section
        className="relative rounded-[2rem] border-2 border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0b1527 0%, #07090f 100%)" }}
      >
        {/* Status banner */}
        {(isConnecting || deviceError) && (
          <div className="m-4 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-semibold text-slate-200 flex items-center justify-between gap-3">
            <span>{isConnecting ? "Preparing interview room…" : deviceError}</span>
            {!isConnecting && (
              <button
                onClick={startLocalMedia}
                className="px-3 py-1.5 rounded-lg font-black uppercase tracking-wide text-[10px]"
                style={{ background: activeAI.accentColor, color: "#0f172a" }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* ── ROW 1: Main 3D avatar + Candidate tile ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">

          {/* ── 3D Avatar hero ── */}
          <div
            className="relative"
            style={{
              height: "clamp(280px, 42vw, 460px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Suspense fallback={<Avatar3DSkeleton accentColor={activeAI.accentColor} />}>
              <InterviewAvatar3D
                isSpeaking={speakingId === activeAI.id}
                modelPath="/model.glb"
                accentColor={activeAI.accentColor}
                name={activeAI.name}
                role={activeAI.role}
                height="100%"
              />
            </Suspense>
          </div>

          {/* ── Candidate tile ── */}
          <div
            className="relative border-l border-white/10 overflow-hidden"
            style={{
              height: "clamp(280px, 42vw, 460px)",
              background: "linear-gradient(135deg, #0f1c30 0%, #0a0f1e 100%)",
            }}
          >
            {/* Decorative radial */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(99,210,243,0.08), transparent 70%)" }}
            />

            {/* Role badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[10px] px-2 py-1 rounded-full bg-black/50 text-slate-100 font-bold uppercase tracking-wider">
                Candidate
              </span>
            </div>

            {/* Mic on indicator */}
            {isMicOn && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-green-300">Live</span>
              </div>
            )}

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCamOn ? "opacity-100" : "opacity-0"}`}
            />

            {!isCamOn && (
              <div className="relative h-full flex flex-col items-center justify-center gap-3">
                {profilePhoto ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                    <Image
                      src={profilePhoto}
                      alt={`${userName} profile`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 grid place-items-center"
                    style={{ background: "linear-gradient(135deg, #1e3a5f, #0f172a)" }}
                  >
                    <CameraOff size={28} className="text-slate-300" />
                  </div>
                )}
                <p className="text-base font-black text-white">{userName}</p>
                <p className="text-xs font-semibold text-slate-400">Camera is off</p>
              </div>
            )}

            {/* Name badge */}
            <div className="absolute bottom-3 left-3 z-10">
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-black/55 text-white font-bold">
                {userName}
              </span>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Inactive AI thumbnails + Question display ── */}
        <div
          className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] gap-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Inactive AI thumbnails */}
          {inactiveAIs.map((ai) => (
            <div
              key={ai.id}
              onClick={() => selectAI(ai.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && selectAI(ai.id)}
              className="relative flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:brightness-110"
              style={{
                padding: "16px 20px",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                background: activeAiId !== ai.id
                  ? "transparent"
                  : `${ai.accentColor}08`,
                minWidth: 130,
              }}
              aria-label={`Select ${ai.name} as active interviewer`}
            >
              <AnimatedAvatar
                name={ai.name}
                role={ai.role}
                accentColor={ai.accentColor}
                isSpeaking={speakingId === ai.id}
                size={56}
              />
              <div className="mt-2 text-center">
                <span
                  className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: `${ai.accentColor}25`,
                    color: ai.accentColor,
                    border: `1px solid ${ai.accentColor}40`,
                  }}
                >
                  Select
                </span>
              </div>
            </div>
          ))}

          {/* Question display pane */}
          <div className="flex flex-col justify-between p-5" style={{ minHeight: 140 }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2"
                style={{ color: activeAI.accentColor }}>
                {sessionStarted ? `Question ${questionNum} / ${totalQuestions}` : "Current Question"}
              </p>
              {currentQuestion ? (
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {currentQuestion}
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-500 italic">
                  Click &quot;Ask AI&quot; to begin the interview…
                </p>
              )}
            </div>

            {/* Progress bar */}
            {sessionStarted && (
              <div className="mt-3">
                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(questionNum / totalQuestions) * 100}%`,
                      background: `linear-gradient(90deg, ${activeAI.accentColor}, ${activeAI.accentColor}80)`,
                    }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 mt-1">
                  {totalQuestions - questionNum} question{totalQuestions - questionNum !== 1 ? "s" : ""} remaining
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: Controls ── */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.35)" }}
        >
          {/* Left: Active AI info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background: speakingId ? "#22c55e" : activeAI.accentColor,
                boxShadow: speakingId ? "0 0 8px #22c55e" : `0 0 6px ${activeAI.accentColor}80`,
                animation: speakingId ? "micPulse 1s ease-in-out infinite" : "none",
              }}
            />
            <span className="text-xs font-bold text-white truncate">
              {speakingId
                ? `${activeAI.name} is speaking…`
                : `${activeAI.name} · ${activeAI.role}`}
            </span>
          </div>

          {/* Center: Main action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center">

            {/* Ask AI */}
            <button
              onClick={triggerAIQuestion}
              disabled={!!speakingId || questionIndex >= totalQuestions}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full font-black text-xs uppercase tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${activeAI.accentColor}, #818cf8)`,
                color: "#0f172a",
              }}
              aria-label="Ask AI next question"
            >
              <Play size={14} />
              {speakingId ? "Speaking…" : questionIndex >= totalQuestions ? "Done" : "Ask AI"}
            </button>

            {/* Mic */}
            <button
              onClick={toggleMic}
              disabled={!hasStream}
              className={`w-10 h-10 rounded-full grid place-items-center transition ${isMicOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"
                } disabled:opacity-40`}
              aria-label={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              disabled={!hasStream}
              className={`w-10 h-10 rounded-full grid place-items-center transition ${isCamOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"
                } disabled:opacity-40`}
              aria-label={isCamOn ? "Camera off" : "Camera on"}
            >
              {isCamOn ? <Camera size={16} /> : <CameraOff size={16} />}
            </button>

            {/* Mute AI audio */}
            <button
              onClick={() => { setIsMuted((m) => !m); if (!isMuted) stop(); }}
              className={`w-10 h-10 rounded-full grid place-items-center transition ${isMuted ? "bg-amber-500 text-white" : "bg-slate-700 text-white"
                }`}
              aria-label={isMuted ? "Unmute AI" : "Mute AI"}
              title={isMuted ? "AI audio muted" : "Mute AI audio"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Chat */}
            <button
              className="w-10 h-10 rounded-full grid place-items-center bg-slate-700 text-white"
              aria-label="Chat"
            >
              <MessageSquareText size={16} />
            </button>

            {/* Participants */}
            <button
              onClick={() => setIsParticipantsOpen((o) => !o)}
              className={`w-10 h-10 rounded-full grid place-items-center text-white transition ${isParticipantsOpen ? "text-slate-900" : "bg-slate-700"
                }`}
              style={isParticipantsOpen ? { background: activeAI.accentColor } : {}}
              aria-label="Participants"
            >
              <Users size={16} />
            </button>

            {/* End */}
            <button
              onClick={endCall}
              className="px-4 h-10 rounded-full inline-flex items-center gap-2 bg-red-500 text-white font-black text-xs uppercase tracking-wide"
              aria-label="End call"
            >
              <PhoneOff size={15} />
              End
            </button>
          </div>

          {/* Right: next question hint */}
          {sessionStarted && !speakingId && questionIndex < totalQuestions && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <ChevronRight size={13} />
              <span className="text-[10px] font-semibold">Next ready</span>
            </div>
          )}
        </div>

        {/* ── Participants dropdown ── */}
        {isParticipantsOpen && (
          <div className="absolute right-4 top-4 z-30 w-64 rounded-2xl border border-slate-700 bg-slate-800/95 backdrop-blur-md shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-200">
                Participants
              </p>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
                aria-label="Close participants panel"
              >
                ×
              </button>
            </div>
            <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto">
              {/* Candidate */}
              <div className="rounded-xl px-3 py-2.5 border border-[#63D2F3]/40 bg-[#63D2F3]/08">
                <p className="text-sm font-bold text-white">You</p>
                <p className="text-[11px] font-semibold text-slate-400">{userName} · Candidate</p>
              </div>
              {/* AIs */}
              {AI_PARTICIPANTS.map((ai) => (
                <div
                  key={ai.id}
                  className="rounded-xl px-3 py-2.5 border border-slate-700/80 bg-slate-900/60 flex items-center gap-3 cursor-pointer hover:border-white/20 transition"
                  onClick={() => { selectAI(ai.id); setIsParticipantsOpen(false); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && (selectAI(ai.id), setIsParticipantsOpen(false))}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: speakingId === ai.id ? "#22c55e" : ai.accentColor,
                      boxShadow: speakingId === ai.id ? "0 0 8px #22c55e" : "none",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{ai.name}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{ai.role}</p>
                  </div>
                  {activeAiId === ai.id && (
                    <span className="text-[9px] font-black uppercase"
                      style={{ color: ai.accentColor }}>Active</span>
                  )}
                  {speakingId === ai.id && (
                    <span className="text-[9px] font-black uppercase text-green-400">Live</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Hint */}
      <p className="text-[11px] text-slate-500 dark:text-zinc-600 mt-3 text-center font-semibold">
        Click a thumbnail to switch the active 3D interviewer · Click &quot;Ask AI&quot; to hear the next question
      </p>
    </div>
  );
}
