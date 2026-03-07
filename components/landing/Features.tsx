"use client";

import React from "react";
import {
  Brain,
  FileText,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";

/* =========================
   Framer Motion Variants
========================= */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      // ✅ FIX: type-safe easing (replaces "easeOut")
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/* =========================
   Component
========================= */

export default function Features() {
  return (
    <section className="w-full py-32 bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#63D2F3]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D6BCFA]/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm text-[#63D2F3]"
          >
            <Sparkles size={14} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Core Intelligence
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            The Power of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63D2F3] via-[#48BBDB] to-[#D6BCFA]">
              Next-Gen Learning
            </span>
          </h2>

          <p className="text-slate-400 font-bold text-lg max-w-2xl mx-auto leading-relaxed">
            Campus++ isn&apos;t just a platform; it&apos;s a high-performance engine designed to
            propel your career into the future.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10"
        >
          <Feature
            icon={<Brain size={36} />}
            title="AI Learning Path"
            desc="A data-driven roadmap that evolves with your progress, ensuring you're always on the fastest route to mastery."
            color="#D6BCFA"
            shadowColor="#9F7AEA"
          />

          <Feature
            icon={<FileText size={36} />}
            title="Resume Analyzer"
            desc="Instantly score your resume against real-world job descriptions to crush the ATS and get the interview."
            color="#63D2F3"
            shadowColor="#48BBDB"
          />

          <Feature
            icon={<MessageCircle size={36} />}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* =========================
   Feature Card
========================= */

function Feature({
  icon,
  title = "AI Career Chatbot",
  desc = "Your personal 24/7 mentor. Real-time advice on networking, negotiations, and technical roadmaps.",
  color = "#FED7E2",
  shadowColor = "#F687B3",
}: {
  icon: React.ReactNode;
  title?: string;
  desc?: string;
  color?: string;
  shadowColor?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -15 }}
      className="group relative bg-white/60 backdrop-blur-xl border-2 border-white p-10 rounded-[3.5rem] transition-all hover:bg-white hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      {/* Hover Glow */}
      <div
        style={{ backgroundColor: color }}
        className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity"
      />

      {/* Icon */}
      <div
        style={{
          backgroundColor: color,
          boxShadow: `0 8px 0 0 ${shadowColor}`,
        }}
        className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white mb-10 transform group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ease-out"
      >
        {icon}
      </div>

      <div className="space-y-4">
        <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none group-hover:text-[#63D2F3] transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 font-bold text-[15px] leading-relaxed">
          {desc}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-[#63D2F3] transition-colors">
          Initialize Module
        </span>
        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-[#63D2F3] group-hover:text-white transition-all">
          <ArrowUpRight size={16} strokeWidth={3} />
        </div>
      </div>
    </motion.div>
  );
}
