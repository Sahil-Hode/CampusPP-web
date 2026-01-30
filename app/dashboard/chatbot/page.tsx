"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatbotPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm your Jnexia mentor. Ask me anything about your career path, skill gaps, or resume optimization!" }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chat]);

  function sendMessage() {
    if (!message.trim()) return;
    const userMsg = { role: "user" as const, text: message };
    setMessage("");
    setChat((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiMsg = { 
        role: "ai" as const, 
        text: "I've analyzed your career trajectory. Based on current industry trends, I recommend focusing on System Design patterns to reach your goal." 
      };
      setChat((prev) => [...prev, aiMsg]);
    }, 1000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto pb-6 transition-colors duration-500">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-2 gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            AI Mentor 
            <motion.span 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[10px] bg-[#D6BCFA]/20 text-[#9F7AEA] dark:text-[#D6BCFA] px-3 py-1 rounded-full tracking-widest uppercase border border-[#D6BCFA]/30"
            >
              v2.0
            </motion.span>
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 ml-1">Powered by Jnexia Intelligence</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-[#63D2F3]/10 border border-transparent dark:border-[#63D2F3]/20 rounded-2xl shadow-lg shadow-blue-500/5">
           <Zap size={14} className="text-[#63D2F3] fill-[#63D2F3]" />
           <span className="text-[10px] font-black text-white dark:text-[#63D2F3] uppercase tracking-widest">Quantum Engine Active</span>
        </div>
      </div>

      {/* 2. Main Chat Interface */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <div 
          ref={scrollRef}
          className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border-2 border-slate-50 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth relative"
        >
          {/* Subtle Neural Grid Background for Dark Mode */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: `radial-gradient(#63D2F3 1px, transparent 1px)`, backgroundSize: '30px 30px' }} 
          />

          <AnimatePresence initial={false}>
            {chat.map((c, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                key={i}
                className={`flex relative z-10 ${c.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${c.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar with 3D shadow */}
                  <div className={`
                    w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 transition-all duration-300
                    ${c.role === "user" 
                      ? "bg-slate-900 dark:bg-white border-slate-800 dark:border-white text-white dark:text-slate-900" 
                      : "bg-[#D6BCFA] border-[#D6BCFA] text-white shadow-[0_4px_0_0_#9F7AEA]"}
                  `}>
                    {c.role === "user" ? <User size={22} strokeWidth={2.5} /> : <Bot size={22} strokeWidth={2.5} />}
                  </div>
                  
                  {/* Bubble - Using dynamic gradients for AI responses */}
                  <div className={`p-6 rounded-[2.2rem] text-sm font-bold leading-relaxed shadow-sm transition-all
                    ${c.role === "user" 
                      ? "bg-[#63D2F3] text-white rounded-tr-none shadow-[0_4px_0_0_#48BBDB]" 
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-none border-2 border-slate-100 dark:border-slate-700"}`}>
                    {c.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Input Area */}
      <div className="mt-8 flex items-center gap-3">
        <div className="relative flex-1 group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#63D2F3] transition-colors">
            <Terminal size={18} strokeWidth={3} />
          </div>
          <input
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] py-6 pl-14 pr-6 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-[#63D2F3] dark:focus:border-[#63D2F3] focus:shadow-2xl focus:shadow-[#63D2F3]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a command or ask a question..."
          />
          {/* Sparkle Decoration */}
          <Sparkles className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-700 pointer-events-none" size={18} />
        </div>
        
        <button 
          onClick={sendMessage} 
          className="bg-slate-900 dark:bg-[#63D2F3] text-white dark:text-slate-900 h-[68px] px-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_6px_0_0_#1e293b] dark:shadow-[0_6px_0_0_#48BBDB] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#1e293b] dark:hover:shadow-[0_4px_0_0_#48BBDB] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-3"
        >
          Send <Send size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}