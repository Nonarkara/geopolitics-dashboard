"use client";

import { useEffect, useState } from "react";
import { AlertCircle, MapPin, Zap } from "lucide-react";
import ConvergenceAlerts from "./ConvergenceAlerts";

export default function Sidebar() {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden">
      <div className="p-6 pb-4">
        <div className="eyebrow opacity-40 mb-1">COMMAND</div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter">Thailand Border</h1>
          <span className="live-badge">Live</span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Map-led monitoring surface. Terrain, imagery, and analytic overlays first, then packages, incidents, and briefings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-0 space-y-8">
        <section>
          <div className="eyebrow opacity-40 mb-4">WATCHPOINTS</div>
          
          <div className="space-y-4">
            {/* Watchpoint Card 1 */}
            <div className="dashboard-panel rounded-xl p-4 border-l-4 border-l-[var(--warning)]">
               <div className="flex items-center justify-between mb-2">
                 <div className="text-[10px] font-bold opacity-40">MAE SOT / MYAWADDY</div>
                 <div className="bg-[var(--warning)] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Priority</div>
               </div>
               <div className="flex items-center justify-between gap-4 mb-3">
                 <h3 className="text-[15px] font-bold leading-tight">Corridor convergence</h3>
                 <span className="text-xl font-black tabular-nums">100</span>
               </div>
               <p className="text-[11px] leading-relaxed text-[var(--muted)] mb-4">
                 Mae Sot / Myawaddy Corridor is on priority posture. Incident, news, market are converging, led by cross-border disruption risk.
               </p>
               <div className="grid grid-cols-4 gap-2">
                 {[
                   { label: "LIVE", val: 7, color: "text-[var(--success)]" },
                   { label: "STALE", val: 5, color: "text-[var(--warning)]" },
                   { label: "OFFLINE", val: 2, color: "text-[var(--danger)]" },
                   { label: "TOTAL", val: 14, color: "text-[var(--ink)]" },
                 ].map(m => (
                   <div key={m.label} className="text-center">
                     <div className="text-[8px] font-bold opacity-30 leading-none mb-1">{m.label}</div>
                     <div className={`text-[11px] font-black tabular-nums ${m.color}`}>{m.val}</div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Watchpoint Card 2 */}
            <div className="dashboard-panel rounded-xl p-4">
               <div className="flex items-center justify-between mb-2">
                 <div className="text-[10px] font-bold opacity-40">PRIORITY</div>
                 <span className="text-[11px] font-black tabular-nums">100</span>
               </div>
               <h3 className="text-[15px] font-bold leading-tight mb-2">Cross-border disruption risk</h3>
               <p className="text-[11px] leading-relaxed text-[var(--muted)] mb-3">
                 Explosions / Remote violence / Mae Sot is the lead incident signal with 5 corroborating items inside the 72-hour watch window.
               </p>
               <div className="flex gap-1.5">
                  <span className="text-[8px] font-bold px-1.5 py-0.5 border border-[var(--line)] rounded opacity-50 uppercase">INCIDENT</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 border border-[var(--line)] rounded opacity-50 uppercase">NEWS</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 border border-[var(--line)] rounded opacity-50 uppercase">MARKET</span>
               </div>
            </div>

            {/* Watchpoint Card 3 */}
            <div className="dashboard-panel rounded-xl p-4">
               <div className="flex items-center justify-between mb-4">
                 <div className="eyebrow text-[9px]">Market Radar</div>
                 <div className="text-[11px] font-black tabular-nums">100</div>
               </div>
               <h3 className="text-[15px] font-bold leading-tight mb-3">Market and logistics stress</h3>
               <div className="flex gap-1.5 items-center text-[10px] font-bold text-[var(--muted)]">
                  <Zap size={10} />
                  <span>Data from NASA, FIRMS, search feeds, reference APIs, and market sources</span>
               </div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-[var(--line)]">
        <div className="eyebrow opacity-40 mb-3">SYSTEM</div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-[10px] font-bold opacity-60">GEOSPATIAL STACK : NOMINAL</span>
        </div>
      </div>
    </aside>
  );
}
