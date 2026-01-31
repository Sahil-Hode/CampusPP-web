"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import AIAvatar from "../components/AIAvatar"; // ✅ Corrected path

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

export default function ChatbotPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "ai", text: "Hello! I’m your Jnexia AI Trainer — here to guide you through learning, career planning, and problem-solving.How can I assist you today?" },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage() {
    if (!message.trim() || loading) return;
    const userText = message;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const data = await apiRequest("/mistral-bot/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText, systemPrompt: "You are an AI mentor..." }),
      });
      const reply = data.reply || data.data?.reply || "I couldn't generate a response.";
      setChat((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (err) {
      setChat((prev) => [...prev, { role: "ai", text: "⚠️ Backend connection failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto pb-6 px-4">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            AI Mentor
            <span className="text-[10px] bg-cyan-100 text-cyan-600 px-3 py-1 rounded-full uppercase tracking-widest">LIVE</span>
          </h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* AVATAR PANEL */}
        <div className="lg:w-1/3 bg-slate-900 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 shadow-2xl relative">
          <div className="absolute top-6 z-10 text-center">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
              {loading ? "Neural Core Processing" : "System Standby"}
            </p>
          </div>
          <AIAvatar isTyping={message.length > 0} isResponding={loading} />
        </div>

        {/* CHAT PANEL */}
        <div className="lg:w-2/3 flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 overflow-y-auto p-8 space-y-6 shadow-sm">
            <AnimatePresence>
              {chat.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-5 rounded-[2rem] text-sm font-bold max-w-[80%] ${c.role === "user" ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {c.text}
                  </div>
                </motion.div>
              ))}
              {loading && <div className="text-slate-400 text-xs font-bold animate-pulse px-4">Thinking...</div>}
            </AnimatePresence>
          </div>

          {/* INPUT AREA */}
          <div className="mt-4 flex gap-3">
            <div className="relative flex-1">
              <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full py-5 pl-14 pr-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
            </div>
            <button onClick={sendMessage} className="px-10 rounded-[2.5rem] bg-slate-900 text-white font-black hover:bg-slate-800 transition-colors">
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}