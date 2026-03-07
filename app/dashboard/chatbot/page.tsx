"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, History, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, BASE_URL } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

const DEFAULT_GREETING: ChatMessage = {
  role: "ai",
  text: "Hello! I'm your Campus++ AI Trainer — here to guide you through learning, career planning, and problem-solving.How can I assist you today?",
};

function getHistoryRouteId() {
  if (typeof window === "undefined") return "session";
  return (
    localStorage.getItem("student_id") ||
    localStorage.getItem("user_id") ||
    localStorage.getItem("institute_id") ||
    "session"
  );
}

function getHistoryEndpointCandidates(userId: string) {
  const configuredBase = process.env.NEXT_PUBLIC_CHAT_HISTORY_ENDPOINT?.trim() || "";
  if (!configuredBase) return [];

  const safeId = encodeURIComponent(userId || "session");
  const hasParam = configuredBase.includes(":userId");
  const base = configuredBase.replace(/\/+$/, "");
  const endpoint = hasParam ? configuredBase.replace(":userId", safeId) : `${base}/${safeId}`;
  return [endpoint];
}

async function requestHistory(method: "GET" | "DELETE", userId: string) {
  const endpoints = getHistoryEndpointCandidates(userId);
  if (endpoints.length === 0) {
    throw { statusCode: 400, message: "History API not configured" };
  }
  let last404: unknown = null;

  for (const endpoint of endpoints) {
    try {
      return await requestHistoryCandidate(endpoint, method);
    } catch (err) {
      const statusCode =
        typeof err === "object" && err !== null && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode)
          : undefined;

      if (statusCode === 404) {
        last404 = err;
        continue;
      }

      throw err;
    }
  }

  throw last404 || new Error("History endpoint not found");
}

async function requestHistoryCandidate(endpoint: string, method: "GET" | "DELETE") {
  const token =
    (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("access_token"))) ||
    "";

  const isAbsolute = /^https?:\/\//i.test(endpoint);
  const url = isAbsolute ? endpoint : `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const rawText = await res.text();
  let data: unknown = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    if (typeof data === "object" && data !== null) {
      throw { statusCode: res.status, ...(data as object) };
    }
    throw { statusCode: res.status, message: `Request failed with status ${res.status}` };
  }

  return data;
}

function normalizeHistory(data: unknown): ChatMessage[] {
  if (!data) return [];

  const container = data as Record<string, unknown>;
  const historySource =
    (Array.isArray(data) && data) ||
    (Array.isArray(container.history) && container.history) ||
    (Array.isArray(container.messages) && container.messages) ||
    (Array.isArray(container.data) && container.data) ||
    (container.data &&
      typeof container.data === "object" &&
      Array.isArray((container.data as Record<string, unknown>).history) &&
      (container.data as Record<string, unknown>).history) ||
    [];

  return (historySource as unknown[])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const roleVal = String(
        row.role ?? row.sender ?? row.type ?? row.author ?? ""
      ).toLowerCase();
      const partText =
        Array.isArray(row.parts) && row.parts.length > 0
          ? (row.parts as unknown[])
            .map((p) =>
              typeof p === "object" && p !== null && typeof (p as Record<string, unknown>).text === "string"
                ? (p as Record<string, unknown>).text
                : ""
            )
            .join(" ")
            .trim()
          : "";

      const textVal =
        row.text ??
        row.message ??
        row.content ??
        row.reply ??
        row.userMessage ??
        row.botReply ??
        partText;

      if (typeof textVal !== "string" || !textVal.trim()) return null;

      const role: "user" | "ai" =
        roleVal === "user" || roleVal === "human" || roleVal === "student"
          ? "user"
          : "ai";

      return { role, text: textVal };
    })
    .filter((m): m is ChatMessage => Boolean(m));
}

export default function ChatbotPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([DEFAULT_GREETING]);
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const userId = getHistoryRouteId();
      const hasConfiguredHistory = getHistoryEndpointCandidates(userId).length > 0;
      if (!hasConfiguredHistory) return;

      setHistoryLoading(true);
      setHistoryError("");
      try {
        const data = await requestHistory("GET", userId);
        if (!active) return;

        const normalized = normalizeHistory(data);
        setChat(normalized.length > 0 ? normalized : [DEFAULT_GREETING]);
      } catch (err) {
        if (!active) return;
        setHistoryError("Failed to load chat history.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  async function sendMessage() {
    if (!message.trim() || loading) return;
    const userText = message;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const data: any = await apiRequest("/mistral-bot/chat", {
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

  async function clearHistory() {
    const userId = getHistoryRouteId();
    const hasConfiguredHistory = getHistoryEndpointCandidates(userId).length > 0;
    if (!hasConfiguredHistory) {
      setHistoryError("History API is not configured.");
      return;
    }
    if (clearingHistory || loading) return;

    setClearingHistory(true);
    setHistoryError("");
    try {
      await requestHistory("DELETE", userId);
      setChat([DEFAULT_GREETING]);
    } catch (err) {
      setHistoryError("Failed to clear chat history.");
    } finally {
      setClearingHistory(false);
    }
  }

  function removeHistoryItem(chatIndex: number) {
    setChat((prev) => {
      const updated = prev.filter((_, index) => index !== chatIndex);
      return updated.length > 0 ? updated : [DEFAULT_GREETING];
    });
  }

  const historyItems = chat
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        !(index === 0 && item.role === DEFAULT_GREETING.role && item.text === DEFAULT_GREETING.text)
    );

  return (
    <div className="h-[calc(100dvh-88px)] md:h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-3 md:pb-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center gap-2 mb-3 md:mb-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 md:gap-3">
            AI Assistant
            <span className="text-[9px] md:text-[10px] bg-cyan-100 text-cyan-600 px-2.5 md:px-3 py-1 rounded-full uppercase tracking-widest">Chat</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryList((prev) => !prev)}
            className={`h-10 px-3 md:px-4 rounded-xl border text-xs md:text-sm font-bold inline-flex items-center gap-2 transition-colors ${showHistoryList
              ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            aria-label="Toggle chat history"
          >
            <History size={14} />
            <span className="hidden sm:inline">Chat History</span>
          </button>
          <button
            onClick={clearHistory}
            disabled={clearingHistory || loading || historyLoading}
            className="h-10 px-3 md:px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-200 inline-flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear chat history"
          >
            {clearingHistory ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-40px)] md:h-[calc(100%-52px)] flex flex-col min-h-0">
        <div className="flex flex-col min-h-0 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[2rem] shadow-sm overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 custom-scrollbar">
            {(historyLoading || historyError) && (
              <div className="mb-2 flex items-center justify-between gap-2">
                {historyLoading ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Loading history...
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                    {historyError}
                  </span>
                )}
              </div>
            )}
            {showHistoryList ? (
              <div className="space-y-2 md:space-y-3">
                {historyItems.length > 0 ? (
                  historyItems.map(({ item, index }, listIndex) => (
                    <motion.div
                      key={`${index}-${listIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-3 md:p-4 flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        <MessageSquare size={15} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full ${item.role === "user" ? "bg-cyan-100 text-cyan-700" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                            {item.role === "user" ? "You" : "AI"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            #{listIndex + 1}
                          </span>
                        </div>
                        <p className="text-sm md:text-[15px] font-semibold text-slate-700 dark:text-slate-100 line-clamp-2 break-words pr-2">
                          {item.text}
                        </p>
                      </div>
                      <button
                        onClick={() => removeHistoryItem(index)}
                        aria-label={`Delete history item ${listIndex + 1}`}
                        className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors grid place-items-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full min-h-[180px] grid place-items-center text-center">
                    <div>
                      <p className="text-sm font-black text-slate-500 uppercase tracking-wider">
                        No chat history
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Start chatting to build your history list.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 md:space-y-5">
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
            )}
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
                  disabled={showHistoryList}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!message.trim() || loading || showHistoryList}
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
