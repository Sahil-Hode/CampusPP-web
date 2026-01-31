"use client";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface CardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: "blue" | "orange" | "purple" | "pink" | "emerald" | "sky" | "amber";
}

const colorStyles = {
  blue: {
    iconBg: "bg-[#63D2F3] shadow-[0_5px_0_0_#48BBDB]",
    hoverBorder: "hover:border-[#63D2F3]/30",
    accent: "bg-[#63D2F3]",
    glow: "shadow-[#63D2F3]/20"
  },
  orange: {
    iconBg: "bg-[#F6AD55] shadow-[0_5px_0_0_#DD6B20]",
    hoverBorder: "hover:border-[#F6AD55]/30",
    accent: "bg-[#F6AD55]",
    glow: "shadow-[#F6AD55]/20"
  },
  purple: {
    iconBg: "bg-[#D6BCFA] shadow-[0_5px_0_0_#9F7AEA]",
    hoverBorder: "hover:border-[#D6BCFA]/30",
    accent: "bg-[#D6BCFA]",
    glow: "shadow-[#D6BCFA]/20"
  },
  pink: {
    iconBg: "bg-[#FED7E2] dark:bg-[#F687B3] shadow-[0_5px_0_0_#F687B3] dark:shadow-[0_5px_0_0_#B83280]",
    hoverBorder: "hover:border-[#FED7E2]/30 dark:hover:border-[#F687B3]/30",
    accent: "bg-[#F687B3]",
    glow: "shadow-[#F687B3]/20"
  },
  // Mapping helpers
  emerald: { iconBg: "bg-[#10B981] shadow-[0_5px_0_0_#059669]", hoverBorder: "hover:border-[#10B981]/30", accent: "bg-[#10B981]", glow: "shadow-[#10B981]/20" },
  sky: { iconBg: "bg-[#0EA5E9] shadow-[0_5px_0_0_#0284C7]", hoverBorder: "hover:border-[#0EA5E9]/30", accent: "bg-[#0EA5E9]", glow: "shadow-[#0EA5E9]/20" },
  amber: { iconBg: "bg-[#F59E0B] shadow-[0_5px_0_0_#D97706]", hoverBorder: "hover:border-[#F59E0B]/30", accent: "bg-[#F59E0B]", glow: "shadow-[#F59E0B]/20" }
};

export default function DashboardCard({ title, description, href, icon: Icon, color }: CardProps) {
  const style = colorStyles[color] || colorStyles.blue;

  return (
    <Link href={href} className="group block h-full outline-none">
      <div className={`
        relative h-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 p-8 rounded-[3rem] 
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)]
        hover:-translate-y-2
        ${style.hoverBorder}
      `}>

        {/* 1. Icon Container */}
        <div className={`
          relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 
          ${style.iconBg} text-white transition-all duration-500 z-10
          group-hover:rotate-[-8deg] group-hover:scale-110
        `}>
          <Icon size={30} strokeWidth={2.5} />
        </div>

        {/* 2. Text Content */}
        <div className="space-y-3 relative z-10">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter transition-colors group-hover:text-slate-900 dark:group-hover:text-[#63D2F3]">
            {title}
          </h3>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-relaxed group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
            {description}
          </p>
        </div>

        {/* 3. Footer / CTA */}
        <div className="mt-10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${style.accent} shadow-lg ${style.glow} animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-all">
              Launch Module
            </span>
          </div>

          <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 
                text-slate-400 dark:text-slate-600 border border-transparent
                group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 
                group-hover:rotate-[-45deg] transition-all duration-500
            `}>
            <ArrowRight size={20} strokeWidth={3} />
          </div>
        </div>

        {/* 4. Large Background Decorative Icon */}
        <div className="absolute top-8 right-8 text-slate-100 dark:text-slate-800/30 opacity-40 dark:opacity-20 group-hover:opacity-100 group-hover:text-[#63D2F3]/10 dark:group-hover:text-[#63D2F3]/5 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
          <Icon size={120} strokeWidth={1.5} />
        </div>

        {/* Bottom Inner Glow Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-50/50 dark:from-slate-800/10 to-transparent rounded-b-[3rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
}