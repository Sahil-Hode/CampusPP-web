"use client";

import { useEffect, useState } from "react";
import { User, Mail, ShieldCheck } from "lucide-react";

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    goal: "Cloud Architecture",
    level: "intermediate",
  });

  useEffect(() => {
    // 🔥 Load data saved during login
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");

    setProfile((prev) => ({
      ...prev,
      name: name || "Student",
      email: email || "student@jnexia.ai",
    }));
  }, []);

  const inputBase =
    "w-full bg-slate-50 dark:bg-zinc-800/50 rounded-2xl py-4 px-5 text-sm font-bold";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] shadow-xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#F687B3] rounded-2xl flex items-center justify-center text-white">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black">My Profile</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Student Identity
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Full Name
          </label>
          <input
            className={inputBase}
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
          />
        </div>

        {/* Email (Read-only) */}
        <div className="opacity-80">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              System Email
            </label>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <input
            className={`${inputBase} cursor-not-allowed`}
            value={profile.email}
            disabled
          />
        </div>

        {/* Save */}
        <button className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em]">
          Save Changes
        </button>
      </div>
    </div>
  );
}
