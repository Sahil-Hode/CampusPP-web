"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  GraduationCap,
  Zap,
  ShieldCheck,
  Contact2,
  Lock,
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

      /**
       * EXPECTED BACKEND RESPONSE:
       * {
       *   token: "...",
       *   student: {
       *     name: "John Doe",
       *     email: "john@student.com",
       *     studentId: "STU001"
       *   }
       * }
       */

      // 🔐 Save auth token
      localStorage.setItem("token", res.token);

      // 👤 Save student info for dashboard/profile
      localStorage.setItem("user_name", res.student?.name || "Student");
      localStorage.setItem("user_email", res.student?.email || "");
      localStorage.setItem("student_id", res.student?.studentId || studentId);

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-[#63D2F3] rounded-[2.2rem] flex items-center justify-center shadow-[0_8px_0_0_#48BBDB]">
            <GraduationCap className="text-white w-12 h-12" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tighter">
            Welcome Back
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            Secure Student Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-slate-50 p-8 rounded-[3rem] shadow-xl space-y-6">
          {/* Student ID */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Student ID
            </label>
            <div className="relative mt-2">
              <Contact2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU001"
                className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 font-bold"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Password
            </label>
            <div className="relative mt-2">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 font-bold"
              />
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#63D2F3] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_6px_0_0_#48BBDB]"
          >
            {loading ? "Signing In..." : "Sign In"}
            {!loading && <Zap className="inline ml-2" size={16} />}
          </button>

          {/* Institute Link */}
          <p className="text-center text-xs font-bold text-slate-400">
            Faculty or Staff?{" "}
            <Link href="/institute-login" className="text-[#63D2F3] font-black">
              Institute Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
