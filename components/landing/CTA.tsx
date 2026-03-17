"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Building2, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="w-full py-32 bg-white relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#63D2F3]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border-2 border-slate-50 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.06)]"
        >
          {/* Top Badge */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <Sparkles size={16} className="text-[#63D2F3]" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Join the Ecosystem</span>
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
            Access the <br />
            <span className="text-[#63D2F3]">Campus++ Portal.</span>
          </h2>

          <p className="mt-6 text-slate-400 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Campus++ now supports institute operations only.
            Use faculty/admin access to manage students, risk, and interventions.
          </p>

          {/* Action Buttons */}
          <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              href="/institute-login"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-3 bg-[#63D2F3] text-white px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_8px_0_0_#48BBDB] hover:translate-y-[2px] hover:shadow-[0_6px_0_0_#48BBDB] active:translate-y-[8px] active:shadow-none transition-all"
            >
              <Building2 size={20} strokeWidth={2.5} />
              Faculty/Admin Login
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
            </Link>

            <Link
              href="/institute-register"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-800 px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
            >
              <Sparkles size={20} className="text-[#63D2F3]" strokeWidth={2.5} />
              Register Institute
            </Link>
          </div>

          {/* Verification Note */}
          <div className="mt-10 flex items-center justify-center gap-2 text-slate-300">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Official Academic Gateway</span>
          </div>

          {/* Decorative Corner Glows */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#D6BCFA]/10 blur-3xl rounded-full" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#63D2F3]/10 blur-3xl rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}