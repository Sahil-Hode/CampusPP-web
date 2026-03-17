"use client";

import Link from "next/link";
import { GraduationCap, Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="w-full bg-[#F8FAFC] relative overflow-hidden">
      {/* Decorative Top Border Gradient */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#63D2F3]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-8 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">

          {/* Brand & Mission Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-10 w-10 bg-[#63D2F3] rounded-[1rem] shadow-[0_4px_0_0_#48BBDB] flex items-center justify-center transition-transform group-hover:rotate-6">
                <GraduationCap className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <span className="font-black tracking-tighter text-slate-800 text-2xl uppercase">
                Campus++
              </span>
            </div>
            <p className="max-w-xs text-[13px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
              Empowering the next generation of professionals with high-intelligence career tools and AI roadmaps.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -4 }}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#63D2F3] transition-all shadow-sm hover:shadow-md"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Portals</h4>
              <ul className="space-y-4">
                <FooterLink href="/institute-login" label="Faculty/Admin Portal" />
                <FooterLink href="/institute-register" label="Register Institute" />
                <FooterLink href="/faculty" label="Faculty Dashboard" />
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Company</h4>
              <ul className="space-y-4">
                <FooterLink href="#" label="Our Vision" />
                <FooterLink href="#" label="Privacy Policy" />
                <FooterLink href="#" label="Terms of Service" />
              </ul>
            </div>

            <div className="space-y-6 col-span-2 md:col-span-1">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Support</h4>
              <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed">
                  Have a question or need assistance?
                </p>
                <a
                  href="mailto:support@campuspp.com"
                  className="flex items-center gap-2 text-[10px] font-black text-[#63D2F3] uppercase tracking-widest hover:underline"
                >
                  <Mail size={14} />
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
              © 2026 Campus++ Core
            </p>
            <div className="h-1 w-1 bg-slate-200 rounded-full" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              v1.0.4
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
      >
        <span className="group-hover:mr-1 transition-all">{label}</span>
        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-all text-[#63D2F3]" />
      </Link>
    </li>
  );
}