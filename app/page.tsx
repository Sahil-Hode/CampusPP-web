"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    // Changed BG to soft off-white and text to slate-900
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center selection:bg-[#63D2F3]/30 scroll-smooth relative overflow-hidden">
      
      {/* Soft Background Blobs for depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#BEE3F8] rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-[#FED7E2] rounded-full blur-[120px] opacity-30" />
      </div>

      {/* Main Content Sections */}
      <Navbar />
      
      <div className="w-full flex flex-col items-center">
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </div>

      <Footer />
    </div>
  );
}