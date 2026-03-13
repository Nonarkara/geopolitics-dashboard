"use client";

import { useEffect, useState } from "react";
import { BookOpen, Network, Clock, Shield } from "lucide-react";
import LogoStrip from "../Identity/LogoStrip";

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
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-3 pr-8 connected-border-r h-full">
           <div className="w-8 h-8 bg-[var(--accent)] flex items-center justify-center rounded-sm">
              <Shield size={20} color="white" strokeWidth={3} />
           </div>
           <div>
              <div className="text-[12px] font-black tracking-tighter leading-none mb-0.5">THAILAND BORDER</div>
              <div className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">Strategic Command</div>
           </div>
        </div>
        <LogoStrip className="scale-75 origin-left opacity-80" />
      </div>

      {/* ── Central High-Precision Clock (Tesla Style) ──────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="flex flex-col items-center">
           <div className="text-3xl font-black tracking-[-0.05em] tabular-nums h-precision">
              {time || "00:00:00"}
           </div>
           <div className="flex items-center gap-2 opacity-30 mt-0.5">
              <Clock size={8} strokeWidth={4} />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Bangkok Sector</span>
           </div>
        </div>
      </div>

      {/* ── Mission Metrics & Controls ─────────────────────────────── */}
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-6 px-8 connected-border-r h-full overflow-hidden hidden lg:flex">
          {[
            { label: "MYD", val: "Lvl 3", color: "text-[var(--danger)]" },
            { label: "DRP", val: "High", color: "text-[var(--warning)]" },
            { label: "SEC", val: "Normal", color: "text-[var(--success)]" },
          ].map(m => (
            <div key={m.label} className="flex flex-col">
              <span className="text-[8px] font-black opacity-30 tracking-widest">{m.label}</span>
              <span className={`text-[11px] font-bold uppercase ${m.color}`}>{m.val}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
           <button onClick={onOpenArchitecture} className="flex h-8 items-center gap-2 border border-[var(--line)] bg-[var(--bg-raised)] px-4 text-[9px] font-black hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-widest grayscale hover:grayscale-0">
              <Network size={10} strokeWidth={3} />
              APIs
           </button>
           <button onClick={onOpenManual} className="flex h-8 items-center gap-2 border border-[var(--line)] bg-[var(--bg-raised)] px-4 text-[9px] font-black hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-widest grayscale hover:grayscale-0">
              <BookOpen size={10} strokeWidth={3} />
              Docs
           </button>
        </div>
      </div>
    </header>
  );
}
