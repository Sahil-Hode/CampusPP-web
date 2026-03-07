"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Timer,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

type QuizQuestion = {
  index: number;
  question: string;
  options: string[];
  difficulty?: string;
};

type QuizPayload = {
  _id: string;
  topic: string;
  stepTitle: string;
  moduleTitle: string;
  status: string;
  passThreshold: number;
  attemptCount: number;
  bestScore: number;
  cooldownUntil?: string | null;
  cooldownRemainingMinutes?: number;
  passedAt?: string | null;
  questions: QuizQuestion[];
};

type QuizSubmitResult = {
  success: boolean;
  passed: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  message: string;
  cooldownUntil?: string;
  cooldownHours?: number;
  remainingMinutes?: number;
  moduleCompleted?: boolean;
  nextModule?: {
    title: string;
    courseIndex: number;
    unlockedAt: string;
    deadline: string;
  } | null;
  details?: { questionIndex: number; selectedAnswer: number; isCorrect: boolean }[];
  explanations?: {
    questionIndex: number;
    question: string;
    yourAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
};

type GenerateQuizResponse = {
  quiz: QuizPayload;
  message?: string;
  alreadyPassed?: boolean;
};

type ApiError = {
  statusCode?: number;
  message?: string;
  remainingMinutes?: number;
};

function formatMinutes(totalMinutes?: number) {
  if (!totalMinutes || totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export default function AIQuizPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" size={32} /></div>}>
      <AIQuizContent />
    </Suspense>
  );
}

function AIQuizContent() {
  const searchParams = useSearchParams();
  const learningPathId = searchParams.get("learningPathId") || "";
  const courseIndexRaw = searchParams.get("courseIndex") || "";
  const stepIndexRaw = searchParams.get("stepIndex") || "";

  const courseIndex = Number(courseIndexRaw);
  const stepIndex = Number(stepIndexRaw);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(null);
  const [cooldownMinutes, setCooldownMinutes] = useState<number | null>(null);

  const hasValidParams = useMemo(() => {
    if (!learningPathId) return false;
    if (!Number.isInteger(courseIndex) || courseIndex < 0) return false;
    if (!Number.isInteger(stepIndex) || stepIndex < 0) return false;
    return true;
  }, [learningPathId, courseIndex, stepIndex]);

  const generateQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSubmitResult(null);
      setCooldownMinutes(null);

      const res = (await apiRequest(
        `/quiz/generate/${learningPathId}/${courseIndex}/${stepIndex}`,
        { method: "POST" }
      )) as GenerateQuizResponse;

      setQuiz(res.quiz);
      setError(null);
      setMessage(res.message || null);
      setAlreadyPassed(Boolean(res.alreadyPassed));
      const initialAnswers = new Array(5).fill(-1);
      setAnswers(initialAnswers);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const status = apiError?.statusCode;
      if (status === 403 && apiError?.remainingMinutes) {
        setCooldownMinutes(Number(apiError.remainingMinutes));
      }
      setError(apiError?.message || "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [learningPathId, courseIndex, stepIndex]);

  useEffect(() => {
    if (!hasValidParams) {
      setLoading(false);
      setError("Missing or invalid quiz parameters.");
      return;
    }
    void generateQuiz();
  }, [hasValidParams, generateQuiz]);

  function setAnswer(questionIndex: number, selectedIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = selectedIndex;
      return next;
    });
  }

  async function submitQuiz() {
    if (!quiz) return;
    if (alreadyPassed) return;

    const hasAllAnswers = answers.length === 5 && answers.every((a) => a >= 0);
    if (!hasAllAnswers) {
      setError("Please answer all 5 questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        answers: answers.map((selectedAnswer, questionIndex) => ({
          questionIndex,
          selectedAnswer,
        })),
      };

      const res = (await apiRequest(`/quiz/submit/${quiz._id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      })) as QuizSubmitResult;

      setSubmitResult(res);
      setError(null);
      if (!res.passed && res.remainingMinutes) {
        setCooldownMinutes(Number(res.remainingMinutes));
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const status = apiError?.statusCode;
      if (status === 403 && apiError?.remainingMinutes) {
        setCooldownMinutes(Number(apiError.remainingMinutes));
      }
      setError(apiError?.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  const scoreTone = submitResult?.passed ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-24">
        <div className="mb-10">
          <Link
            href="/dashboard/learning-path"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#F6AD55] transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Back to Roadmap
          </Link>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 md:p-10 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-500">
              <span className="px-3 py-1 rounded-full bg-zinc-900">AI Quiz</span>
              {quiz?.moduleTitle && (
                <span className="px-3 py-1 rounded-full bg-[#F6AD55]/10 text-[#F6AD55]">
                  {quiz.moduleTitle}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {quiz?.stepTitle || "Quiz"}
            </h1>
            <p className="text-zinc-500 font-medium">
              {quiz?.topic ? `Topic: ${quiz.topic}` : "Generate and complete the quiz to unlock progress."}
            </p>

            {message && (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F6AD55]">
                <CheckCircle2 size={16} /> {message}
              </div>
            )}
            {alreadyPassed && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 size={16} /> You already passed this quiz.
              </div>
            )}
            {cooldownMinutes !== null && cooldownMinutes > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Timer size={16} /> Quiz in cooldown for {formatMinutes(cooldownMinutes)}.
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="min-h-65 flex items-center justify-center text-zinc-500">
            <Loader2 className="animate-spin text-[#F6AD55]" size={36} />
          </div>
        )}

        {!loading && error && quiz && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-amber-300 flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5" />
            <div>
              <p className="font-semibold">We hit a server hiccup, but your quiz is ready.</p>
              <p className="text-xs text-zinc-500 mt-1">Try again if anything doesn’t load correctly.</p>
            </div>
          </div>
        )}

        {!loading && error && !quiz && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-rose-300 flex items-start gap-3">
            <AlertTriangle size={20} className="mt-1" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-xs text-zinc-500 mt-1">Check your quiz parameters and try again.</p>
            </div>
          </div>
        )}

        {!loading && quiz && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-4xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-widest font-bold text-zinc-500">
                <span>Pass Threshold: {quiz.passThreshold}%</span>
                <span>Attempts: {quiz.attemptCount}</span>
                <span>Best Score: {quiz.bestScore}%</span>
              </div>
            </div>

            <div className="space-y-6">
              {quiz.questions.map((q, idx) => (
                <motion.div
                  key={q.index}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-zinc-900 border border-zinc-800 rounded-4xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Q{idx + 1}. {q.question}</h3>
                    {q.difficulty && (
                      <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500">
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {q.options.map((option, optIdx) => {
                      const isSelected = answers[idx] === optIdx;
                      return (
                        <button
                          key={`${idx}-${optIdx}`}
                          onClick={() => setAnswer(idx, optIdx)}
                          disabled={alreadyPassed || submitResult?.passed}
                          className={`text-left px-4 py-3 rounded-xl border transition-all font-semibold
                            ${isSelected
                              ? "border-[#F6AD55] bg-[#F6AD55]/10 text-[#F6AD55]"
                              : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-[#F6AD55]/60"
                            }`}
                        >
                          <span className="text-xs font-black mr-3 text-zinc-500">{String.fromCharCode(65 + optIdx)}</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={submitQuiz}
                disabled={submitting || alreadyPassed || !quiz || cooldownMinutes !== null}
                className="flex-1 px-6 py-4 rounded-2xl bg-[#F6AD55] text-black font-black uppercase tracking-[0.2em] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Answers"}
              </button>
              <button
                onClick={generateQuiz}
                disabled={submitting}
                className="px-6 py-4 rounded-2xl border border-zinc-800 text-zinc-200 font-bold uppercase tracking-[0.2em] hover:border-[#F6AD55]/70"
              >
                Refresh Quiz
              </button>
            </div>

            {submitResult && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-4xl p-6 space-y-4">
                {submitResult.passed && submitResult.score >= 70 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-400" size={26} />
                      <div>
                        <p className="text-lg font-black text-emerald-300 uppercase tracking-widest">
                          Congratulations
                        </p>
                        <p className="text-sm text-emerald-200">
                          You passed with a score of <span className="font-black">{submitResult.score}%</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-emerald-100">
                      Completed: <span className="font-semibold">{quiz?.moduleTitle || "Module"}</span>
                      {quiz?.stepTitle ? ` · ${quiz.stepTitle}` : ""}
                    </div>
                  </div>
                )}
                {(!submitResult.passed || submitResult.score < 70) && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <XCircle className="text-rose-400" size={26} />
                      <div>
                        <p className="text-lg font-black text-rose-300 uppercase tracking-widest">
                          Try Again
                        </p>
                        <p className="text-sm text-rose-200">
                          You scored <span className="font-black">{submitResult.score}%</span>. Minimum required is 70%.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-rose-100">
                      {submitResult.message || "Review the material and attempt the quiz again."}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {submitResult.passed ? (
                    <CheckCircle2 className="text-emerald-400" size={22} />
                  ) : (
                    <XCircle className="text-rose-400" size={22} />
                  )}
                  <div>
                    <p className={`text-2xl font-black ${scoreTone}`}>
                      {submitResult.score}%
                    </p>
                    <p className="text-sm text-zinc-400">{submitResult.message}</p>
                  </div>
                </div>

                {submitResult.nextModule && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300">
                    <p className="font-semibold">Next module unlocked: {submitResult.nextModule.title}</p>
                    <p className="text-xs text-zinc-500">
                      Unlocks at {new Date(submitResult.nextModule.unlockedAt).toLocaleString()} · Deadline {new Date(submitResult.nextModule.deadline).toLocaleString()}
                    </p>
                  </div>
                )}

                {submitResult.explanations && submitResult.explanations.length > 0 && (
                  <div className="space-y-4">
                    {submitResult.explanations.map((exp) => (
                      <div key={exp.questionIndex} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-sm font-bold mb-2">
                          Q{exp.questionIndex + 1}: {exp.question}
                        </p>
                        <p className={`text-sm ${exp.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                          Your answer: {exp.yourAnswer || "No answer"}
                        </p>
                        <p className="text-sm text-zinc-300">
                          Correct answer: {exp.correctAnswer}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">{exp.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

