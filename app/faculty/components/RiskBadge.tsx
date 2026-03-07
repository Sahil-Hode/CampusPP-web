"use client";

import { AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface RiskBadgeProps {
  level: "High" | "Medium" | "Low" | string;
}

interface RiskConfig {
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  dot: string;
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  // Define styles based on Campus++'s premium palette
  const config: Record<string, RiskConfig> = {
    High: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
      icon: AlertTriangle,
      dot: "bg-red-500"
    },
    Medium: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
      icon: Activity,
      dot: "bg-amber-500"
    },
    Low: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
      icon: ShieldCheck,
      dot: "bg-emerald-500"
    },
  };

  const style = config[level] || config.Low;
  const Icon = style.icon;

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 
      rounded-xl border-2 ${style.bg} ${style.border} 
      ${style.text} transition-all duration-300
    `}>
      {/* Animated Status Dot */}
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-40`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`}></span>
      </span>

      {/* Label */}
      <span className="text-[10px] font-[1000] uppercase tracking-widest">
        {level} Risk
      </span>

      {/* Icon */}
      <Icon size={12} strokeWidth={3} className="opacity-70" />
    </div>
  );
}