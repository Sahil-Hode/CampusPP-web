"use client";

import ProfileForm from "../components/ProfileForm";
import { motion } from "framer-motion";

export default function FacultyProfilePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase">
          Account <span className="text-[#63D2F3]">Settings</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
          Manage your professional academic identity
        </p>
      </div>

      {/* This calls your component from app/faculty/components/ProfileForm.tsx */}
      <ProfileForm />
    </motion.div>
  );
}