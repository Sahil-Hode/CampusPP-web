"use client";

import { useEffect, useState } from "react";
import {
  User, Mail, School, BookOpen,
  ShieldCheck, Check, Award, Loader2
} from "lucide-react";

export default function FacultyProfile() {
  const [profile, setProfile] = useState({
    name: "Faculty Member",
    email: "faculty@campuspp.edu",
    department: "Computer Science & Engineering",
    designation: "Senior Lecturer",
    cabin: "A-402, Tech Block"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load data from localStorage after hydration
    const storedName = localStorage.getItem("user_name");
    const storedEmail = localStorage.getItem("user_email");

    if (storedName || storedEmail) {
      setProfile(prev => ({
        ...prev,
        name: storedName || prev.name,
        email: storedEmail || prev.email,
      }));
    }
  }, []);

  const inputBase = "w-full bg-slate-50 dark:bg-zinc-900/50 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl py-4 px-5 pl-12 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#63D2F3] dark:focus:border-[#63D2F3] transition-all appearance-none";

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-900 shadow-sm relative">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-slate-400 dark:text-zinc-500">
              <User size={28} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                My <span className="text-[#63D2F3]">Profile</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Faculty Information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified Faculty</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input
                  className={inputBase}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input
                  className={`${inputBase} opacity-60 cursor-not-allowed`}
                  value={profile.email}
                  disabled
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <select
                  className={inputBase}
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
              <div className="relative">
                <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input
                  className={inputBase}
                  value={profile.designation}
                  onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Office Location */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office Location</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                className={inputBase}
                placeholder="Room No, Building"
                value={profile.cabin}
                onChange={(e) => setProfile({ ...profile, cabin: e.target.value })}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${saved
              ? "bg-emerald-500 text-white"
              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
              }`}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : saved ? (
              <>
                <Check size={18} />
                Changes Saved
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}