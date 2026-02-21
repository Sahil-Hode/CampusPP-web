"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  Bot,
  FileText,
  Cuboid,
  MessagesSquare,
  GraduationCap,
  LogOut,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Design Constants based on your Prompt
  const borderStyle = "border-[3px] border-black";
  const shadowStyle = "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
  const activeShadow = "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "#63D2F3" },
    { name: "Learning Path", icon: Route, path: "/dashboard/learning-path", color: "#F6AD55" },
    { name: "AI Chatbot", icon: Bot, path: "/dashboard/chatbot", color: "#B39DDB" },
    { name: "Resume Analyzer", icon: FileText, path: "/dashboard/resume-analyzer", color: "#4ADE80" },
    { name: "3D Live Mentor", icon: Cuboid, path: "/dashboard/3d-mentor", color: "#FACC15" },
    { name: "Mock Interview", icon: MessagesSquare, path: "/dashboard/mock-interview", color: "#F687B3" },
    { name: "My Profile", icon: User, path: "/dashboard/profile", color: "#BDE0FE" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[150] lg:hidden bg-black/20 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-[200] w-72 
        bg-white dark:bg-[#1E1E1E] transition-transform duration-300
        ${borderStyle} border-l-0 m-0 lg:m-4 lg:h-[calc(100vh-32px)] rounded-[28px] ${shadowStyle}
        ${isOpen ? "translate-x-4" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="mb-10 flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className={`w-12 h-12 bg-[#F5A623] rounded-[18px] flex items-center justify-center ${borderStyle} ${activeShadow} group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all`}>
                <GraduationCap className="text-black w-7 h-7" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-[900] tracking-tight text-black dark:text-white italic">
                CAMPUS<span className="text-[#F5A623]">++</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] px-2 mb-4 text-black/40 dark:text-white/40">
              Study Tools
            </p>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center gap-4 px-4 py-4 rounded-[22px] transition-all
                      ${borderStyle} mb-3
                      ${isActive 
                        ? `bg-[${item.color}] ${activeShadow} translate-x-[2px] translate-y-[2px]` 
                        : `bg-white dark:bg-[#2A2A2A] ${shadowStyle} hover:translate-y-[-2px]`
                      }
                    `}
                    style={{ backgroundColor: isActive ? item.color : '' }}
                  >
                    <item.icon 
                      size={22} 
                      className="text-black dark:text-white" 
                      strokeWidth={isActive ? 3 : 2} 
                    />
                    <span className={`text-[15px] text-black dark:text-white ${isActive ? "font-black" : "font-bold"}`}>
                      {item.name}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-6 mt-6 space-y-3 shrink-0">


            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-red-400 transition-colors font-black text-xs uppercase tracking-widest text-black dark:text-white"
            >
              <LogOut size={18} strokeWidth={3} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
