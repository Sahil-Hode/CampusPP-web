"use client";
import { useRef } from "react";
import { useChat } from "../hooks/useChat";
import { Mic, MicOff, Send, Maximize, Minimize, Video, RefreshCw } from "lucide-react";

interface UIProps {
  hidden?: boolean;
}

export const UI = ({ hidden }: UIProps) => {
  const input = useRef<HTMLInputElement>(null);
  const { chat, loading, cameraZoomed, setCameraZoomed, message, isMicOn, setIsMicOn, liveText, backendOnline } = useChat();

  const sendMessage = () => {
    if (input.current) {
      const text = input.current.value.trim();
      if (!loading && !message && text) {
        chat(text);
        input.current.value = "";
      }
    }
  };

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none select-none">
      {/* ── Top Bar ── */}
      <div className="flex items-start justify-between">
        <div className="backdrop-blur-xl bg-white/40 dark:bg-black/40 px-6 py-4 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col gap-0.5">
          <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            3D AI MENTOR
          </h1>
          <p className="text-xs font-bold text-gray-500/80 uppercase tracking-widest">Advanced Learning Assistant</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className={`backdrop-blur-xl px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20 ${backendOnline === null ? "bg-gray-200/50 text-gray-500" : backendOnline ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"
            }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${backendOnline === null ? "bg-gray-400" : backendOnline ? "bg-emerald-500" : "bg-amber-500"
              }`} />
            {backendOnline === null ? "READY" : backendOnline ? "LIVE AI MODE" : "DEMO MODE"}
          </div>
        </div>
      </div>

      {/* ── Center Subtitles ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 flex flex-col items-center gap-4">
        {liveText && (
          <div className="backdrop-blur-md bg-black/40 text-white px-6 py-3 rounded-2xl text-xl font-medium text-center shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
            {liveText}
          </div>
        )}
        {message?.text && !liveText && (
          <div className="backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-white px-8 py-4 rounded-3xl text-lg font-semibold text-center shadow-2xl border border-white/20 max-w-lg">
            {message.text}
          </div>
        )}
      </div>

      {/* ── Sidebar Controls ── */}
      <div className="self-end flex flex-col gap-4 mb-24 items-center">
        <button
          onClick={() => setCameraZoomed(!cameraZoomed)}
          className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-800 dark:text-white p-4 rounded-2xl shadow-2xl border border-white/20 group"
          title={cameraZoomed ? "Zoom Out" : "Zoom In"}
        >
          {cameraZoomed ? <Minimize className="w-6 h-6 group-hover:rotate-12 transition-transform" /> : <Maximize className="w-6 h-6 group-hover:scale-110 transition-transform" />}
        </button>

        <button
          onClick={() => {
            // Reset camera functionality is handled by Experience observing cameraZoomed
            setCameraZoomed(false);
          }}
          className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-800 dark:text-white p-4 rounded-2xl shadow-2xl border border-white/20 group"
          title="Reset View"
        >
          <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <button
          onClick={() => {
            document.body.classList.toggle("greenScreen");
          }}
          className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-800 dark:text-white p-4 rounded-2xl shadow-2xl border border-white/20 group"
          title="Toggle Green Screen"
        >
          <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* ── Bottom Input Bar ── */}
      <div className="pointer-events-auto w-full max-w-3xl mx-auto flex items-end gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative group">
            <input
              id="chat-input"
              className="w-full placeholder:text-zinc-500 p-5 pr-14 rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl border border-white/30 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-zinc-800 dark:text-white font-medium"
              placeholder={backendOnline === false ? "Type a message... (Demo Mode)" : "Ask your AI Mentor anything..."}
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !!message}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all disabled:opacity-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-5 rounded-[2rem] shadow-2xl transition-all active:scale-90 border border-white/20 ${isMicOn
            ? "bg-rose-500 text-white animate-pulse"
            : "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl text-zinc-800 dark:text-white hover:bg-white dark:hover:bg-zinc-800"
            }`}
          title={isMicOn ? "Turn Mic Off" : "Turn Mic On"}
        >
          {isMicOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
        </button>
      </div>

      <style jsx global>{`
        .greenScreen canvas {
          background: #00ff00 !important;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
