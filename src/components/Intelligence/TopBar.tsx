"use client";

import { useEffect, useState } from "react";
import { BookOpen, Network, Clock, Shield } from "lucide-react";
import LogoStrip from "../Identity/LogoStrip";
import GlobalPulse from "./GlobalPulse";

export default function TopBar({
  onOpenManual,
  onOpenArchitecture,
}: {
  onOpenManual: () => void;
  onOpenArchitecture: () => void;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-16 w-full items-center justify-between px-6 bg-white select-none">
      {/* ── Brand & Logos (Connected to Sidebar) ───────────────────── */}
      {/* ── Brand & Logos (Connected to Sidebar) ───────────────────── */}
      <div className="flex items-center gap-6 h-full pl-6 border-r border-black">
         <Shield size={20} className="text-[var(--accent)]" strokeWidth={3} />
         <div className="hidden xl:block">
            <div className="text-[12px] font-black tracking-tighter leading-none mb-0.5">THAILAND BORDER</div>
            <div className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">Strategic Command</div>
         </div>
      </div>

      {/* ── Central High-Precision Clock (Tesla Style) ──────────────── */}
      <div className="flex-1 h-full px-12 overflow-hidden">
         <GlobalPulse />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10 bg-white/90 backdrop-blur-sm px-4">
         <div className="text-2xl font-black tracking-[-0.05em] tabular-nums h-precision">
            {time || "00:00:00"}
         </div>
         <div className="flex items-center gap-2 opacity-30">
            <Clock size={8} strokeWidth={4} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Bangkok Sector</span>
         </div>
      </div>

      {/* ── Operational Controls ─────────────────────────────── */}
      <div className="flex items-center gap-3 h-full pr-6">
         <div className="flex items-center gap-2">
            <button onClick={onOpenArchitecture} className="flex h-8 items-center gap-2 border border-black bg-white px-3 text-[9px] font-black hover:bg-black hover:text-white transition-all uppercase tracking-widest">
               <Shield size={10} strokeWidth={3} />
               APIs
            </button>
            <button onClick={onOpenManual} className="flex h-8 items-center gap-2 border border-black bg-white px-3 text-[9px] font-black hover:bg-black hover:text-white transition-all uppercase tracking-widest">
               <BookOpen size={10} strokeWidth={3} />
               Docs
            </button>
         </div>
      </div>
    </header>
  );
}
