"use client";

/**
 * Mock Interview Room - Speech-to-Speech AI Interview
 * ──────────────────────────────────────────────────────────────
 * Flow:
 * 1. Check resume status (required for interview)
 * 2. Interview preparation and readiness check
 * 3. Real-time speech-to-speech communication
 * 4. Live transcription and audio processing
 * 5. AI feedback and scoring
 * ──────────────────────────────────────────────────────────────
 */

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
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
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  Square,
  Headphones,
} from "lucide-react";
import { BASE_URL, apiRequest } from "@/lib/api";
import Image from "next/image";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

/*
 * Turbopack-safe lazy import.
 * Do NOT use next/dynamic here — it breaks in Next.js 16 + Turbopack.
 * React.lazy + Suspense is the correct pattern for client-only heavy modules.
 */
const InterviewAvatar3D = lazy(() => import("@/components/InterviewAvatar3D"));

/* ══════════════════════════════════════════
   TYPES & INTERFACES
══════════════════════════════════════════ */
type AIParticipant = {
  id: string;
  name: string;
  role: string;
  accentColor: string;
  pitch?: number;
  gender: "MALE" | "FEMALE";
};

const AI_PARTICIPANTS: AIParticipant[] = [
  { 
    id: "1", 
    name: "Mr. Arjun", 
    role: "Behavioral & Personal Interviewer", 
    accentColor: "#38bdf8", 
    pitch: 0.98,
    gender: "MALE"
  },
  { 
    id: "2", 
    name: "Mr. Vikram", 
    role: "Technical & Logical Interviewer", 
    accentColor: "#f59e0b", 
    pitch: 0.94,
    gender: "MALE"
  },
  { 
    id: "3", 
    name: "Ms. Priya", 
    role: "Creative & Situational Interviewer", 
    accentColor: "#f472b6", 
    pitch: 1.05,
    gender: "FEMALE"
  },
];

// API Response Types
type ProfileResponse = {
  success: boolean;
  data?: {
    name?: string;
    profilePhoto?: string;
    resumeText?: string;
    resumeUploadedAt?: string;
  };
};

type StartInterviewResponse = {
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    interviewer: { 
      id: string; 
      name: string; 
      role: string; 
      gender?: string 
    };
    openingMessage: string;
    voiceConfig: {
      geminiVoice: string;
      googleVoice: {
        languageCode: string;
        name: string;
        ssmlGender: string;
      };
    };
  };
};

type EndInterviewResponse = {
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    status: string;
    feedback: InterviewFeedback;
    questionCount?: number;
    duration?: number;
  };
};

type InterviewFeedback = {
  overall: string;
  behavioral?: string;
  technical?: string;
  creative?: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
};

type InterviewMessage = {
  id: string;
  role: "interviewer" | "user" | "system";
  text: string;
  interviewerId?: string;
  timestamp?: Date;
};

// WebSocket Event Types
type WSInterviewMessage = {
  interviewer: { 
    id: string; 
    name: string; 
    role: string; 
    gender?: string 
  };
  message: string;
  questionCount?: number;
  userTranscription?: string;
};

type WSInterviewAudio = {
  audioBase64: string;
  mimeType: string;
  interviewer: { 
    id: string; 
    name: string; 
    role: string; 
    gender?: string 
  };
  provider: string;
};

type WSTranscription = {
  text: string;
  isFinal: boolean;
};

// Interview States
type InterviewPhase = "resume-check" | "preparation" | "readiness" | "active" | "ended";

/* ══════════════════════════════════════════
   AUDIO UTILITIES
══════════════════════════════════════════ */
// Downsample from 48kHz to 16kHz as required by API
function downsample(float32Array: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const length = Math.round(float32Array.length / ratio);
  const result = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    result[i] = float32Array[Math.round(i * ratio)];
  }
  
  return result;
}

// Convert Float32Array to Int16Array (LINEAR16 format)
function toInt16(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return int16;
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
   RESUME SELECT SCREEN
══════════════════════════════════════════ */
function ResumeSelectScreen({
  profileHasResume,
  resumeInfo,
  userName,
  profilePhoto,
  onContinue,
}: {
  profileHasResume: boolean;
  resumeInfo: { resumeUploadedAt: string; resumeTextLength?: number } | null;
  userName: string;
  profilePhoto: string;
  onContinue: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<"profile" | "new" | null>(
    profileHasResume ? "profile" : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<{ length: number; preview: string } | null>(null);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (file: File) => {
    setUploadError("");
    setIsUploading(true);
    const fd = new FormData();
    fd.append("resume", file);
    try {
      const res = await apiRequest("/student/profile/resume", { method: "POST", body: fd }) as {
        success: boolean; message?: string;
        data?: { resumeTextLength?: number; resumePreview?: string };
      };
      if (!res.success) throw new Error(res.message || "Upload failed");
      setUploaded(true);
      setUploadedInfo({ length: res.data?.resumeTextLength ?? 0, preview: res.data?.resumePreview ?? "" });
      setChoice("new");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const canContinue =
    (choice === "profile" && profileHasResume) ||
    (choice === "new" && uploaded);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #0b1527 0%, #07090f 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {profilePhoto ? (
            <img src={profilePhoto} alt={userName} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-white/20" />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/20 grid place-items-center bg-slate-800">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
          )}
          <h1 className="text-2xl font-black text-white">Choose Your Resume</h1>
          <p className="text-sm text-slate-400 mt-1">
            Hey <span className="text-white font-bold">{userName}</span> — select the resume you want to interview with
          </p>
        </div>

        <div className="space-y-3">
          {/* Option A — use profile resume */}
          {profileHasResume && resumeInfo && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setChoice("profile")}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                choice === "profile"
                  ? "border-sky-400/70 bg-sky-500/10"
                  : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  choice === "profile" ? "border-sky-400 bg-sky-400" : "border-slate-500"
                }`}>
                  {choice === "profile" && <span className="w-2 h-2 rounded-full bg-white block" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="font-bold text-white text-sm">Use resume from my profile</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded {new Date(resumeInfo.resumeUploadedAt).toLocaleDateString()}
                    {resumeInfo.resumeTextLength ? ` · ${resumeInfo.resumeTextLength.toLocaleString()} characters extracted` : ""}
                  </p>
                </div>
              </div>
            </motion.button>
          )}

          {/* Option B — upload new */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setChoice("new"); if (!uploaded) fileInputRef.current?.click(); }}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              choice === "new"
                ? "border-violet-400/70 bg-violet-500/10"
                : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                choice === "new" ? "border-violet-400 bg-violet-400" : "border-slate-500"
              }`}>
                {choice === "new" && <span className="w-2 h-2 rounded-full bg-white block" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {uploaded
                    ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    : <Upload className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                  <span className="font-bold text-white text-sm">
                    {uploaded ? "New resume uploaded" : "Upload a different resume"}
                  </span>
                </div>
                {uploaded && uploadedInfo ? (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {uploadedInfo.length.toLocaleString()} characters extracted
                    {uploadedInfo.preview && ` · "${uploadedInfo.preview.slice(0, 60)}…"`}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX · max 10 MB</p>
                )}
              </div>
              {!uploaded && (
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-300 bg-violet-500/20 rounded-full px-2 py-1 flex-shrink-0">
                  Browse
                </span>
              )}
              {uploaded && choice === "new" && (
                <button
                  onClick={(e) => { e.stopPropagation(); setUploaded(false); setUploadedInfo(null); fileInputRef.current?.click(); }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition flex-shrink-0"
                >
                  Change
                </button>
              )}
            </div>
          </motion.button>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />

          {/* uploading overlay */}
          {isUploading && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
              <span className="text-sm text-violet-200 font-semibold">Uploading &amp; parsing resume…</span>
            </div>
          )}

          {/* error */}
          {uploadError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-sm text-rose-200">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Continue */}
        <motion.button
          onClick={onContinue}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.97 } : {}}
          className="mt-7 w-full py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: canContinue
              ? "linear-gradient(135deg, #38bdf8, #818cf8)"
              : "#1e293b",
            color: canContinue ? "#0f172a" : "#64748b",
          }}
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className="text-center text-xs text-slate-600 mt-4">
          Resume text is used only to generate personalised interview questions
        </p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   READINESS / CHEER-UP SCREEN
══════════════════════════════════════════ */
function ReadinessScreen({
  userName,
  profilePhoto,
  onContinue,
  isStarting,
}: {
  userName: string;
  profilePhoto: string;
  onContinue: () => void;
  isStarting: boolean;
}) {
  const tips = [
    { icon: "🎤", text: "Speak clearly — real-time Google STT captures your voice" },
    { icon: "💡", text: "Use STAR format for behavioural questions" },
    { icon: "⚡", text: "3 AI interviewers take turns — stay sharp!" },
    { icon: "🧘", text: "Take a breath. You've prepared for this." },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #0b1527 0%, #07090f 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        {/* Glow ring + avatar */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, #38bdf850 0%, transparent 72%)",
              animation: "ripple 2s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes ripple { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.18);opacity:.3} }`}</style>
          {profilePhoto ? (
            <img src={profilePhoto} alt={userName} className="w-28 h-28 rounded-full object-cover border-4 border-sky-400/60 relative z-10" />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-sky-400/60 grid place-items-center bg-slate-800 relative z-10">
              <Headphones className="w-10 h-10 text-sky-400" />
            </div>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-black text-white mb-1">
          You've got this, {userName.split(" ")[0]}! 🚀
        </h1>
        <p className="text-slate-400 text-sm mb-7">
          Your AI panel is ready. Let's see what you're made of.
        </p>

        {/* Interviewers row */}
        <div className="flex items-center justify-center gap-4 mb-7">
          {AI_PARTICIPANTS.map((ai, i) => (
            <motion.div
              key={ai.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-12 h-12 rounded-full grid place-items-center font-black text-sm"
                style={{ background: `${ai.accentColor}25`, border: `2px solid ${ai.accentColor}60`, color: ai.accentColor }}
              >
                {ai.name.split(" ")[1]?.[0] ?? ai.name[0]}
              </div>
              <span className="text-[10px] font-bold text-slate-400">{ai.name.split(" ")[1] ?? ai.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <div className="space-y-2 mb-7 text-left">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
            >
              <span className="text-lg flex-shrink-0">{tip.icon}</span>
              <span className="text-sm text-slate-300 font-medium">{tip.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onContinue}
          disabled={isStarting}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-black text-base tracking-wide text-slate-900 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)" }}
        >
          {isStarting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Starting Interview…</>
          ) : (
            <>Let&apos;s Go! <ChevronRight className="w-5 h-5" /></>
          )}
        </motion.button>

        <p className="text-xs text-slate-600 mt-3">
          Make sure your microphone is allowed in the browser
        </p>
      </motion.div>
    </div>
  );
}
/* ══════════════════════════════════════════
   MAIN MOCK INTERVIEW COMPONENT
══════════════════════════════════════════ */
export default function MockInterviewPage() {
  // Interview Phase Management
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>("resume-check");
  const [resumeInfo, setResumeInfo] = useState<{ resumeUploadedAt: string; resumeTextLength?: number } | null>(null);
  
  // Media & Device State
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [hasStream, setHasStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Profile Information
  const [profilePhoto, setProfilePhoto] = useState("");
  const [userName, setUserName] = useState("You");
  
  // Interview Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeAiId, setActiveAiId] = useState("1");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  
  // Audio & Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [finalTranscription, setFinalTranscription] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  // Loading & Error States
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const transientMsgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Final Results
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  
  // UI State
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  
  // Refs for media and connections
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  // Sync ref — avoids stale closure inside onaudioprocess
  const isRecordingRef = useRef(false);
  
  const activeAI = AI_PARTICIPANTS.find((p) => p.id === activeAiId) ?? AI_PARTICIPANTS[0];
  const inactiveAIs = AI_PARTICIPANTS.filter((p) => p.id !== activeAiId);

  /* ══════════════════════════════════════════
     INITIALIZATION & PROFILE LOADING
  ══════════════════════════════════════════ */
  useEffect(() => {
    loadUserProfile();
    initializeMedia();
    
    return () => {
      cleanupResources();
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiRequest("/student/profile", { method: "GET" }) as ProfileResponse;
      
      if (response.success && response.data) {
        const { name, profilePhoto, resumeText, resumeUploadedAt } = response.data;
        
        if (name) setUserName(name);
        if (profilePhoto) setProfilePhoto(profilePhoto);
        
        // Check if resume exists — stay on resume-select; the screen will
        // show the profile resume as the pre-selected option
        if (resumeText && resumeUploadedAt) {
          setResumeInfo({
            resumeUploadedAt,
            resumeTextLength: resumeText.length
          });
        }
        // Always start at resume-check so user consciously picks their resume
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const initializeMedia = async () => {
    try {
      setIsConnecting(true);
      setDeviceError("");
      
      // Initialize empty stream
      streamRef.current = new MediaStream();
      setHasStream(true);
      setIsCamOn(false);
      setIsMicOn(false);
    } catch (error) {
      console.error("Failed to initialize media:", error);
      setDeviceError("Failed to initialize media devices");
      setHasStream(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const cleanupResources = () => {
    if (transientMsgTimeoutRef.current) {
      clearTimeout(transientMsgTimeoutRef.current);
      transientMsgTimeoutRef.current = null;
    }
    // Stop recording stream if active
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop all tracks
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    // Close audio context
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    processorRef.current = null;
    
    // Disconnect socket
    socketRef.current?.disconnect();
    socketRef.current = null;
    
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setHasStream(false);
  };

  /* ══════════════════════════════════════════
     AUDIO PROCESSING & SPEECH-TO-SPEECH
  ══════════════════════════════════════════ */
  const setupAudioProcessing = async () => {
    try {
      // Create AudioContext
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      
      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      const source = audioContextRef.current.createMediaStreamSource(micStream);
      
      // Create ScriptProcessor for real-time audio processing
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.addEventListener('audioprocess', (event) => {
        if (!isRecordingRef.current || !socketRef.current?.connected) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Downsample from 48kHz to 16kHz
        const downsampled = downsample(inputData, 48000, 16000);
        const int16Data = toInt16(downsampled);
        
        // Send audio data to server
        socketRef.current.emit('interviewAudioData', int16Data.buffer);
      });
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      processorRef.current = processor;
      
      // Add track to stream for video display
      streamRef.current?.addTrack(micStream.getAudioTracks()[0]);
      
      return true;
    } catch (error) {
      console.error("Failed to setup audio processing:", error);
      setDeviceError("Microphone access denied or not available");
      return false;
    }
  };

  const startRecording = async () => {
    if (!socketRef.current?.connected) {
      setInterviewError("Not connected to interview server");
      return;
    }

    if (!audioContextRef.current) {
      const success = await setupAudioProcessing();
      if (!success) return;
    }

    setCurrentTranscription("");
    setFinalTranscription("");

    // Set ref FIRST (sync) so onaudioprocess sees it immediately
    isRecordingRef.current = true;
    setIsRecording(true);

    // Emit AFTER ref is set
    socketRef.current.emit('interviewStartStream', {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US'
    });
  };

  const stopRecording = () => {
    // Set ref immediately so onaudioprocess stops sending
    isRecordingRef.current = false;
    setIsRecording(false);

    if (!socketRef.current?.connected) return;
    socketRef.current.emit('interviewStopStream');
  };

  /* ══════════════════════════════════════════
     MEDIA DEVICE CONTROLS
  ══════════════════════════════════════════ */
  const toggleMicrophone = async () => {
    if (!streamRef.current) return;

    if (isMicOn) {
      // If actively recording a session answer, stop the stream first
      if (isRecordingRef.current) stopRecording();

      streamRef.current.getAudioTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsMicOn(false);

      // Clean up audio processing
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        await audioContextRef.current.close();
        audioContextRef.current = null;
        processorRef.current = null;
      }
    } else {
      try {
        const success = await setupAudioProcessing();
        if (success) {
          setIsMicOn(true);
          setDeviceError("");
          // If interview is live, auto-start the stream so the user can speak immediately
          if (sessionStarted && socketRef.current?.connected) {
            await startRecording();
          }
        }
      } catch (error) {
        setDeviceError("Microphone access denied");
        setIsMicOn(false);
      }
    }
  };

  const toggleCamera = async () => {
    if (!streamRef.current) return;
    
    if (isCamOn) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsCamOn(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current.addTrack(videoStream.getVideoTracks()[0]);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = streamRef.current;
        }
        
        setIsCamOn(true);
        setDeviceError("");
      } catch (error) {
        setDeviceError("Camera access denied");
        setIsCamOn(false);
      }
    }
  };

  /* ══════════════════════════════════════════
     WEBSOCKET & INTERVIEW MANAGEMENT
  ══════════════════════════════════════════ */
  const getWebSocketUrl = () => {
    const baseUrl = BASE_URL.replace(/\/api\/?$/, "");
    const wsUrl = baseUrl.replace(/^https?:/, baseUrl.startsWith('https') ? 'wss:' : 'ws:');
    return `${wsUrl}/mock-interview`;
  };

  const connectWebSocket = (sessionId: string) => {
    if (socketRef.current) return;
    
    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
    
    const socket = io(getWebSocketUrl(), {
      transports: ["websocket"],
      auth: { token },
    });
    
    socketRef.current = socket;
    
    // Connection events
    socket.on("connect", () => {
      console.log("Connected to interview server");
      socket.emit("joinInterview", { sessionId });
    });
    
    socket.on("connected", (data) => {
      console.log("Server connected:", data.message);
    });
    
    socket.on("interviewJoined", (payload: { sessionId: string; questionCount?: number; currentInterviewer?: string }) => {
      console.log("Joined interview room:", payload);
      if (payload.questionCount) setQuestionIndex(payload.questionCount);
      if (payload.currentInterviewer) setActiveAiId(payload.currentInterviewer);
    });
    
    // Interview message events
    socket.on("interviewMessage", (payload: WSInterviewMessage) => {
      console.log("Interview message:", payload);
      setProcessingMessage(null);
      setCurrentQuestion(payload.message);
      
      if (payload.questionCount) setQuestionIndex(payload.questionCount);
      if (payload.interviewer?.id) setActiveAiId(payload.interviewer.id);
      
      addMessage({
        id: `ai-${Date.now()}`,
        role: "interviewer",
        text: payload.message,
        interviewerId: payload.interviewer?.id,
        timestamp: new Date(),
      });
    });
    
    // Audio playback
    socket.on("interviewAudio", (payload: WSInterviewAudio) => {
      console.log("Interview audio received");
      if (payload.interviewer?.id && payload.audioBase64 && payload.mimeType) {
        playInterviewerAudio(payload.interviewer.id, payload.audioBase64, payload.mimeType);
      }
    });
    
    // Real-time transcription
    socket.on("interviewTranscription", (payload: WSTranscription) => {
      console.log("Transcription:", payload);
      if (payload.isFinal) {
        setFinalTranscription(payload.text);
        setCurrentTranscription("");
        
        // Add user message to conversation
        addMessage({
          id: `user-${Date.now()}`,
          role: "user", 
          text: payload.text,
          timestamp: new Date(),
        });
      } else {
        setCurrentTranscription(payload.text);
      }
    });
    
    // Processing indicators
    socket.on("interviewProcessing", (payload: { message?: string }) => {
      setProcessingMessage(payload.message || "Processing your answer...");
    });
    
    socket.on("interviewStreamStarted", (payload: { message: string }) => {
      console.log("Stream started:", payload.message);
    });
    
    // Interview completion
    socket.on("interviewEnded", (payload: { feedback?: InterviewFeedback; questionCount?: number; sessionId?: string; duration?: number }) => {
      console.log("Interview ended:", payload);
      setProcessingMessage(null);
      setInterviewPhase("ended");
      
      if (payload.questionCount) setQuestionIndex(payload.questionCount);
      if (payload.feedback) setFeedback(payload.feedback);
    });
    
    // Error handling
    socket.on("interviewError", (payload: { message?: string }) => {
      console.error("Interview error:", payload);
      const message = payload.message || "Interview error occurred";
      if (message.toLowerCase().includes("no speech detected")) {
        setInterviewError(null);
        setProcessingMessage("No speech detected. Please try again.");
        if (transientMsgTimeoutRef.current) {
          clearTimeout(transientMsgTimeoutRef.current);
        }
        transientMsgTimeoutRef.current = setTimeout(() => {
          setProcessingMessage(null);
        }, 2500);
        return;
      }
      setInterviewError(message);
    });
    
    socket.on("interviewTTSError", (payload: { message?: string }) => {
      console.error("TTS error:", payload);
      setInterviewError(`Voice generation error: ${payload.message || "Unknown TTS error"}`);
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from interview server");
    });
  };

  const addMessage = (message: InterviewMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const playInterviewerAudio = (interviewerId: string, audioBase64: string, mimeType: string) => {
    if (isMuted) return;
    
    const audioSrc = `data:${mimeType};base64,${audioBase64}`;
    const audio = new Audio(audioSrc);
    
    audioRef.current = audio;
    setSpeakingId(interviewerId);
    
    audio.onended = () => setSpeakingId(null);
    audio.onerror = (error) => {
      console.error("Audio playback error:", error);
      setSpeakingId(null);
    };
    
    audio.play().catch(error => {
      console.error("Failed to play audio:", error);
      setSpeakingId(null);
    });
  };

  /* ══════════════════════════════════════════
     INTERVIEW FLOW HANDLERS
  ══════════════════════════════════════════ */
  const handleResumeUploadSuccess = () => {
    // Reload profile to get resume info
    loadUserProfile();
  };

  const handleInterviewReady = () => {
    setInterviewPhase("readiness");
  };

  const startInterview = async () => {
    if (isStarting || sessionStarted) return;
    
    setIsStarting(true);
    setInterviewError(null);
    setFeedback(null);
    setMessages([]);
    
    try {
      const response = await apiRequest("/mock-interview/start", { 
        method: "POST" 
      }) as StartInterviewResponse;
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to start interview");
      }
      
      const { sessionId: newSessionId, interviewer, openingMessage } = response.data;
      
      setSessionId(newSessionId);
      setSessionStarted(true);
      setInterviewPhase("active");
      setCurrentQuestion(openingMessage);
      setQuestionIndex(1);
      setActiveAiId(interviewer.id);
      
      // Add opening message
      addMessage({
        id: `system-${Date.now()}`,
        role: "system",
        text: openingMessage,
        interviewerId: interviewer.id,
        timestamp: new Date(),
      });
      
      // Connect WebSocket
      connectWebSocket(newSessionId);
      
    } catch (error) {
      console.error("Failed to start interview:", error);
      setInterviewError(
        error instanceof Error 
          ? error.message 
          : "Failed to start interview. Please make sure you have uploaded your resume."
      );
    } finally {
      setIsStarting(false);
    }
  };

  const endInterview = async () => {
    if (!sessionId) {
      cleanupResources();
      setInterviewPhase("ended");
      return;
    }
    
    setIsEnding(true);
    setInterviewError(null);
    
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("endInterview");
      } else {
        const response = await apiRequest("/mock-interview/end", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        }) as EndInterviewResponse;
        
        if (response.success && response.data?.feedback) {
          setFeedback(response.data.feedback);
        }
      }
    } catch (error) {
      console.error("Failed to end interview:", error);
      setInterviewError(
        error instanceof Error 
          ? error.message 
          : "Failed to end interview properly"
      );
    } finally {
      setIsEnding(false);
      cleanupResources();
      setSessionStarted(false);
      setInterviewPhase("ended");
      setSessionId(null);
      setIsRecording(false);
    }
  };

  const selectAI = (id: string) => {
    if (id === activeAiId || sessionStarted) return;
    setActiveAiId(id);
  };

  /* ══════════════════════════════════════════
     VIDEO STREAM EFFECT
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [hasStream, isCamOn]);

  const questionNum = Math.max(1, questionIndex);

  /* ── pre-interview phase screens (full-page replacements) ── */
  if (interviewPhase === "resume-check") {
    return (
      <ResumeSelectScreen
        profileHasResume={!!resumeInfo}
        resumeInfo={resumeInfo}
        userName={userName}
        profilePhoto={profilePhoto}
        onContinue={() => setInterviewPhase("readiness")}
      />
    );
  }

  if (interviewPhase === "readiness") {
    return (
      <ReadinessScreen
        userName={userName}
        profilePhoto={profilePhoto}
        onContinue={startInterview}
        isStarting={isStarting}
      />
    );
  }

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
        {interviewError && (
          <div className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200 flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{interviewError}</span>
          </div>
        )}
        {/* Status banner */}
        {(isConnecting || deviceError) && (
          <div className="m-4 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-semibold text-slate-200 flex items-center justify-between gap-3">
            <span>{isConnecting ? "Preparing interview room…" : deviceError}</span>
            {!isConnecting && (
              <button
                onClick={initializeMedia}
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
              {sessionStarted ? `Question ${questionNum}` : "Current Question"}
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

            {/* Live transcription / processing status */}
            {sessionStarted && (
              <div className="mt-4">
                {currentTranscription ? (
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">You (speaking…)</p>
                    <p className="text-sm text-white italic">{currentTranscription}</p>
                  </div>
                ) : processingMessage ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs">{processingMessage}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">Speak using your mic to answer…</p>
                )}
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
              onClick={startInterview}
              disabled={sessionStarted || isStarting}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full font-black text-xs uppercase tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${activeAI.accentColor}, #818cf8)`,
                color: "#0f172a",
              }}
              aria-label="Start mock interview"
            >
              <Play size={14} />
              {isStarting ? "Starting…" : sessionStarted ? "In Session" : "Start Interview"}
            </button>

            {/* Mic / Record toggle */}
            <button
              onClick={() => {
                if (sessionStarted) {
                  // During session: toggle the live recording stream
                  if (isRecording) {
                    stopRecording();
                  } else {
                    if (isMicOn) {
                      startRecording();
                    } else {
                      toggleMicrophone(); // will enable mic + auto-call startRecording
                    }
                  }
                } else {
                  toggleMicrophone();
                }
              }}
              disabled={!hasStream}
              className={`w-10 h-10 rounded-full grid place-items-center transition disabled:opacity-40 ${
                isRecording
                  ? "bg-green-500 text-white"
                  : isMicOn
                  ? "bg-slate-700 text-white"
                  : "bg-red-500 text-white"
              }`}
              style={isRecording ? { boxShadow: "0 0 10px #22c55e80", animation: "micPulse 1s ease-in-out infinite" } : {}}
              aria-label={isRecording ? "Stop speaking" : isMicOn ? "Mute" : "Unmute"}
              title={isRecording ? "Recording — click to stop" : isMicOn ? "Mic on — click to mute" : "Mic off — click to enable"}
            >
              {isRecording ? <Square size={14} fill="white" /> : isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
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
              onClick={() => { setIsMuted((m) => !m); if (!isMuted && audioRef.current) audioRef.current.pause(); }}
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
              onClick={endInterview}
              className="px-4 h-10 rounded-full inline-flex items-center gap-2 bg-red-500 text-white font-black text-xs uppercase tracking-wide"
              aria-label="End call"
            >
              <PhoneOff size={15} />
              {isEnding ? "Ending…" : "End"}
            </button>
          </div>

          {/* Right: next question hint */}
          {sessionStarted && !speakingId && (
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

      {/* Conversation */}
      {messages.length > 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-black/40 p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">
            Conversation
          </p>
          <div className="space-y-2">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const speaker = msg.interviewerId
                ? AI_PARTICIPANTS.find((ai) => ai.id === msg.interviewerId)?.name
                : msg.role === "system"
                  ? "System"
                  : "You";
              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl px-4 py-3 text-sm ${isUser
                    ? "bg-slate-900 text-white ml-auto max-w-[70%]"
                    : "bg-slate-100 text-slate-900 dark:bg-zinc-900 dark:text-white max-w-[80%]"
                    }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
                    {speaker}
                  </p>
                  <p className="font-medium leading-relaxed">{msg.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="mt-6 rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <p className="text-sm font-black uppercase tracking-widest">Interview Feedback</p>
            {typeof feedback.score === "number" && (
              <span className="ml-auto text-xs font-black bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-full">
                Score {feedback.score}%
              </span>
            )}
          </div>
          <p className="mt-3 text-sm font-medium">{feedback.overall}</p>
          <div className="mt-4 space-y-2 text-sm">
            {feedback.behavioral && <p><span className="font-semibold">Behavioral:</span> {feedback.behavioral}</p>}
            {feedback.technical && <p><span className="font-semibold">Technical:</span> {feedback.technical}</p>}
            {feedback.creative && <p><span className="font-semibold">Creative:</span> {feedback.creative}</p>}
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="text-[11px] text-slate-500 dark:text-zinc-600 mt-3 text-center font-semibold">
        Click a thumbnail to switch the active 3D interviewer · Start the interview, then send text answers to receive the next question
      </p>
    </div>
  );
}
