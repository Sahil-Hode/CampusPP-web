"use client";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className="h-[calc(100dvh-88px)] md:h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-3 md:pb-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 md:gap-3">
            AI Assistant
            <span className="text-[9px] md:text-[10px] bg-cyan-100 text-cyan-600 px-2.5 md:px-3 py-1 rounded-full uppercase tracking-widest">Chat</span>
          </h2>
        </div>
      </div>

      <div className="h-[calc(100%-40px)] md:h-[calc(100%-52px)] flex flex-col min-h-0">
        <div className="flex flex-col min-h-0 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[2rem] shadow-sm overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5 custom-scrollbar">
            <AnimatePresence>
              {chat.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-4 py-3.5 md:px-5 md:py-4 rounded-2xl md:rounded-3xl text-sm md:text-[15px] font-medium leading-relaxed max-w-[88%] sm:max-w-[80%] md:max-w-[75%] shadow-sm ${c.role === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700"}`}>

                    {c.role === 'ai' ? (
                      <div className="prose dark:prose-invert prose-slate max-w-none overflow-x-auto
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
                <div className="flex items-center gap-3 px-2">
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
          <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 sm:p-3">
            <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1">
              <input
                className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-sm md:text-[15px] font-semibold outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 dark:focus:border-cyan-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              aria-label="Send message"
              className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-xl md:rounded-2xl bg-slate-900 text-white grid place-items-center hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
