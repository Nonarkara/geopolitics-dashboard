"use client";

import { useEffect, useState } from "react";
import { BookOpen, Network } from "lucide-react";

const METRICS = [
  { label: "MYD", value: "18:02", aqi: 122, temp: 28 },
  { label: "SGP", value: "19:02", aqi: 42, temp: 31 },
  { label: "PHL", value: "18:02", aqi: 86, temp: 29 },
  { label: "IDN", value: "18:02", aqi: 68, temp: 30 },
];

export default function TopBar({
  onOpenManual,
  onOpenArchitecture,
}: {
  onOpenManual: () => void;
  onOpenArchitecture: () => void;
}) {
  return (
    <header className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-[var(--line-bright)] bg-[var(--bg)] px-6 backdrop-blur-md bg-opacity-90">
      <div className="flex items-center gap-8">
        {METRICS.map((m) => (
          <div key={m.label} className="flex flex-col gap-0 border-r border-[var(--line)] pr-8 last:border-0 last:pr-0">
             <div className="flex items-center gap-1.5 leading-none mb-1">
                <span className="text-[10px] font-black opacity-30">{m.label}</span>
                <span className="text-[12px] font-black text-numeric">{m.value}</span>
             </div>
             <div className="flex items-center gap-3 text-[9px] font-bold">
                <span className="opacity-40 uppercase">TC</span> <span>{m.temp}°C</span>
                <span className="opacity-40 uppercase ml-1">AQI</span> <span className={m.aqi > 100 ? "text-[var(--danger)]" : ""}>{m.aqi}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right pr-6 border-r border-[var(--line)]">
           <div className="text-[10px] font-black tracking-widest leading-none mb-1">SENTINEL X</div>
           <div className="text-[8px] font-bold opacity-30 uppercase">Operational Intelligence surface</div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onOpenArchitecture} className="flex h-9 items-center gap-2 rounded border border-[var(--line-bright)] bg-[var(--bg-surface)] px-4 text-[10px] font-black hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-widest">
              <Network size={12} strokeWidth={3} />
              APIs / Architecture
           </button>
           <button onClick={onOpenManual} className="flex h-9 items-center gap-2 rounded border border-[var(--line-bright)] bg-[var(--bg-surface)] px-4 text-[10px] font-black hover:bg-[var(--ink)] hover:text-white transition-all uppercase tracking-widest">
              <BookOpen size={12} strokeWidth={3} />
              Help / Manual
           </button>
        </div>
      </div>
    </header>
  );
}
