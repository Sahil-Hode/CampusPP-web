"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  GraduationCap,
  Zap,
  ShieldCheck,
  Contact2,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!studentId || !password) {
      alert("Student ID and password required");
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ studentId, password }),
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("user_name", res.student?.name || "Student");
      localStorage.setItem("user_email", res.student?.email || "");
      localStorage.setItem("student_id", res.student?.studentId || studentId);

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Decoration for "Million Dollar" feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#63D2F3] opacity-[0.05] blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#48BBDB] opacity-[0.05] blur-[100px]" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-24 h-24 bg-[#63D2F3] rounded-[2.5rem] flex items-center justify-center shadow-[0_10px_0_0_#48BBDB] transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <GraduationCap className="text-white w-14 h-14 drop-shadow-lg" />
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tighter text-slate-900">
            Welcome Back
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">
            Secure Student Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border-[3px] border-slate-100 p-10 rounded-[4rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-500">
          <div className="space-y-8">
            
            {/* Student ID Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                Student ID
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-slate-200 rounded-3xl blur-0 group-focus-within:blur-md opacity-20 transition-all" />
                <div className="relative">
                  <Contact2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#63D2F3]" />
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="STU001"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-[1.8rem] py-5 pl-16 pr-8 font-bold text-slate-700 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-slate-200 rounded-3xl blur-0 group-focus-within:blur-md opacity-20 transition-all" />
                <div className="relative">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#63D2F3]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-[1.8rem] py-5 pl-16 pr-8 font-bold text-slate-700 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full bg-[#63D2F3] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_8px_0_0_#48BBDB] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-70"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <>
                    Sign In
                    <Zap className="inline ml-2 group-hover:scale-125 transition-transform" size={18} fill="currentColor" />
                  </>
                )}
              </span>
            </button>

            {/* Footer */}
            <div className="pt-4">
              <p className="text-center text-xs font-bold text-slate-400">
                Faculty or Staff?{" "}
                <Link 
                  href="/institute-login" 
                  className="text-[#63D2F3] font-black hover:brightness-90 transition-all underline decoration-2 underline-offset-4"
                >
                  Institute Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <p className="text-center mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Official Management System
        </p>
      </div>
    </div>
  );
}