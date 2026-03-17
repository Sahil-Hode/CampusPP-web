"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Building2, Mail, Lock, Zap } from "lucide-react";
import Link from "next/link";

export default function InstituteLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      // ✅ CORRECT ENDPOINT
      const res = await apiRequest("/auth/insti-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      /**
       * EXPECTED RESPONSE:
       * {
       *   token: "jwt_token",
       *   institute: {
       *     name: "Tech University",
       *     email: "admin@institute.com",
       *     role: "FACULTY"
       *   }
       */

      // 🔐 Store auth token
      setToken(res.token);

      // 👤 Store institute/faculty info
      localStorage.setItem(
        "user_name",
        res.institute?.name || "Institute Admin"
      );
      localStorage.setItem(
        "user_email",
        res.institute?.email || email
      );
      localStorage.setItem(
        "user_role",
        (res.institute?.role || "FACULTY").toLowerCase()
      );
      sessionStorage.setItem("user_name", res.institute?.name || "Institute Admin");
      sessionStorage.setItem("user_email", res.institute?.email || email);
      sessionStorage.setItem("user_role", (res.institute?.role || "FACULTY").toLowerCase());

      // 🚀 Redirect to faculty dashboard
      router.push("/faculty");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Institute login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#63D2F3]/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#D6BCFA]/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-[400px] z-10">
        {/* Header */}
        <div className="flex flex-col items-center space-y-6 mb-10">
          <div className="w-20 h-20 bg-[#63D2F3] rounded-[2.2rem] flex items-center justify-center shadow-[0_8px_0_0_#48BBDB]">
            <Building2 className="text-white w-12 h-12" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase">
              Institute <span className="text-[#63D2F3]">Login</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Faculty & Admin Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-slate-50 p-10 rounded-[3rem] shadow-xl space-y-8">
          {/* Email */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="email"
                placeholder="admin@institute.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 font-bold"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 font-bold"
              />
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#63D2F3] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_6px_0_0_#48BBDB] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login to Portal"}
            {!loading && <Zap size={16} />}
          </button>

          {/* Institute register */}
          <p className="text-center text-xs font-bold text-slate-400">
            New institute?{" "}
            <Link href="/institute-register" className="text-[#63D2F3] font-black">
              Register here
            </Link>
          </p>
        </div>

        <p className="mt-10 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
