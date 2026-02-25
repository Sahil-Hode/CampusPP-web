"use client";

import { lazy, Suspense } from "react";
import { motion } from "framer-motion";

const MentorModel = lazy(() => import("./MentorModel"));

/* ════════════════════════════════════════════════
   SMALL UI HELPERS (unchanged from your original)
════════════════════════════════════════════════ */
function ModelSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"
      />
    </div>
  );
}

export default function Mentor3DPage() {
  return (
    <div className="h-[calc(100vh-120px)] rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden relative shadow-2xl">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full h-full relative"
      >
        <Suspense fallback={<ModelSpinner />}>
          <MentorModel />
        </Suspense>
      </motion.section>
    </div>
  );
}
