"use client";

import { useEffect, useState } from "react";
import { BookOpen, Database, Network } from "lucide-react";

const METRICS = [
  { label: "MYD", value: "18:02", aqi: 122, temp: 28 },
  { label: "SGP", value: "19:02", aqi: 42, temp: 31 },
  { label: "PHL", value: "18:02", aqi: 86, temp: 29 },
  { label: "IDN", value: "18:02", aqi: 68, temp: 30 },
];

export default function TopBar({
  onOpenManual,
  onOpenArchitecture,
  onOpenDataExplorer,
}: {
  onOpenManual: () => void;
  onOpenArchitecture: () => void;
  onOpenDataExplorer: () => void;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="z-50 flex h-16 shrink-0 items-center border-b border-[var(--line-bright)] bg-[var(--bg)] px-6">
      {/* Left: Metrics Strip */}
      <div className="flex flex-1 items-center gap-6 overflow-hidden">
        {METRICS.map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5 whitespace-nowrap border-r border-[var(--line)] pr-6 last:border-0 last:pr-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold opacity-40">{m.label}</span>
              <span className="text-[10px] font-mono font-bold tracking-tight">{m.value}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold"><span className="opacity-30">TC</span> {m.temp}°C</span>
              <span className="text-[10px] font-bold"><span className="opacity-30">AQI</span> {m.aqi}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Center: Hero Clock */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="text-[28px] font-mono font-black tracking-tighter leading-none mb-1">
          {time || "00:00:00"}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">Bangkok [TH]</span>
          <span className="text-[8px] font-bold text-[var(--danger)]">33°C AQI 128</span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex flex-1 items-center justify-end gap-6">
        <div className="flex items-center gap-3 text-right pr-6 border-r border-[var(--line)]">
           <div className="eyebrow leading-none">SENTINEL X</div>
           <div className="text-[9px] font-bold opacity-30">by Strategic Intelligence Team</div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onOpenArchitecture} className="flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 text-[10px] font-bold hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-wider">
              <Network size={12} />
              APIs / Architecture
           </button>
           <button onClick={onOpenManual} className="flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-4 text-[10px] font-bold hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-wider">
              <BookOpen size={12} />
              HELP / MANUAL
           </button>
        </div>
      </div>
    </header>
  );
}
