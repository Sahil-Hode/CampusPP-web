"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { Cpu, Rocket, UserPlus, Sparkles } from "lucide-react";
import { useRef } from "react";

export default function HowItWorks() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section ref={containerRef} className="w-full py-32 bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#63D2F3]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#D6BCFA]/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
            <Sparkles size={12} className="text-[#63D2F3]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">The Roadmap</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
            Three Step to <span className="text-[#63D2F3]">Mastery.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Animated Curly Path SVG */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-full hidden md:block h-full pointer-events-none">
            <svg
              viewBox="0 0 400 1000"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <motion.path
                d="M 200 0 C 450 150, -50 350, 200 500 C 450 650, -50 850, 200 1000"
                stroke="#63D2F3"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="12 12"
                style={{ pathLength }}
                className="opacity-20"
              />
              <motion.path
                d="M 200 0 C 450 150, -50 350, 200 500 C 450 650, -50 850, 200 1000"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                style={{ pathLength }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1000" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#63D2F3" />
                  <stop offset="0.5" stopColor="#D6BCFA" />
                  <stop offset="1" stopColor="#FED7E2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-24 md:space-y-32">
            <Step
              step="01"
              title="Onboarding"
              text="Create your digital profile and define your dream career goals. We set the foundation for your evolution."
              icon={<UserPlus size={24} />}
              align="left"
              color="#63D2F3"
              shadowColor="#48BBDB"
            />
            <Step
              step="02"
              title="AI Analysis"
              text="Our engine generates a personalized learning roadmap based on industry gaps and your unique potential."
              icon={<Cpu size={24} />}
              align="right"
              color="#D6BCFA"
              shadowColor="#9F7AEA"
            />
            <Step
              step="03"
              title="Execution"
              text="Optimize your resume and skills with real-time AI mentoring. Forge your path to the top."
              icon={<Rocket size={24} />}
              align="left"
              color="#FED7E2"
              shadowColor="#F687B3"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ step, title, text, icon, align, color, shadowColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col md:flex-row items-center justify-between gap-12 ${align === "right" ? "md:flex-row-reverse" : ""
        }`}
    >
      {/* Content Card */}
      <div className="w-full md:w-[45%] z-20">
        <div className="group bg-white/70 backdrop-blur-md border-2 border-white p-10 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-300 tracking-[0.2em]">
              {step}
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-[#63D2F3] transition-colors">
              {title}
            </h3>
          </div>
          <p className="text-slate-400 font-bold text-base leading-relaxed">{text}</p>
        </div>
      </div>

      {/* Center Icon Block */}
      <div className="relative z-30">
        <div
          style={{
            backgroundColor: color,
            boxShadow: `0 8px 0 0 ${shadowColor}`
          }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white transform rotate-12 hover:rotate-0 transition-transform duration-500 cursor-default"
        >
          {icon}
        </div>
      </div>

      <div className="hidden md:block w-[45%]" />
    </motion.div>
  );
}