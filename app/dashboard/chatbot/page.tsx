"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          <div ref={scrollRef} className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 overflow-y-auto p-4 md:p-8 space-y-6 shadow-sm custom-scrollbar">
            <AnimatePresence>
              {chat.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-5 rounded-[2rem] text-sm font-medium leading-relaxed max-w-[90%] md:max-w-[80%] shadow-sm ${c.role === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700"}`}>

                    {c.role === 'ai' ? (
                      <div className="prose dark:prose-invert prose-slate max-w-none 
                        prose-p:mb-4 prose-p:last:mb-0 
                        prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-h3:text-lg prose-h3:mb-2
                        prose-strong:font-black prose-strong:text-cyan-600 dark:prose-strong:text-cyan-400
                        prose-ul:list-disc prose-ul:pl-4 prose-ul:mb-4
                        prose-ol:list-decimal prose-ol:pl-4 prose-ol:mb-4
                        prose-li:mb-1
                        prose-code:bg-slate-200 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[0.8em] prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-slate-900 prose-pre:text-cyan-400 prose-pre:p-4 prose-pre:rounded-2xl prose-pre:font-mono prose-pre:text-xs prose-pre:shadow-xl
                        prose-table:w-full prose-table:border-collapse prose-table:my-6
                        prose-th:bg-slate-200/50 dark:prose-th:bg-slate-700/50 prose-th:p-3 prose-th:text-left prose-th:text-[10px] prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-600
                        prose-td:p-3 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-600 prose-td:text-xs prose-td:font-bold
                        prose-hr:border-slate-200 dark:prose-hr:border-slate-700 prose-hr:my-8
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {c.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="font-bold">{c.text}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 px-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.1 }}
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    Neural Processing...
                  </span>
                </div>
              )}
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