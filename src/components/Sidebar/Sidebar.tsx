"use client";

import { Zap } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden bg-[var(--bg-raised)]">
      <div className="p-4 border-b border-[var(--line)]">
        <div className="eyebrow opacity-40 mb-1">COMMAND</div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Thailand Border</h1>
          <span className="live-badge scale-90">Live</span>
        </div>
        <p className="text-[10px] font-medium leading-tight text-[var(--muted)]">
          Real-time geospatial intelligence: regional stability and border dynamics.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        <section>
          <div className="eyebrow mb-4 opacity-40">CRITICAL WATCHPOINTS</div>
          
          <div className="space-y-4">
            {/* High Intensity Watchpoint 1 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--line-bright)] p-4 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
               <div className="flex items-center justify-between mb-2">
                 <div className="text-[8px] font-black opacity-40 uppercase tracking-widest">MAE SOT / MYAWADDY</div>
                 <div className="bg-[var(--accent)] text-white text-[8px] font-black px-1.5 py-0 rounded-sm uppercase tracking-tighter">Priority</div>
               </div>
               <div className="flex items-end justify-between gap-2 mb-2">
                 <h3 className="text-[14px] font-black leading-none uppercase tracking-tight">Corridor convergence</h3>
                 <span className="text-2xl font-black tabular-nums leading-none tracking-tighter">100</span>
               </div>
               <p className="text-[10px] font-medium leading-normal text-[var(--dim)] mb-4">
                 Incident, news, market are converging, led by cross-border disruption risk.
               </p>
               <div className="grid grid-cols-4 gap-2 border-t border-[var(--line)] pt-3">
                 {[
                   { label: "LIVE", val: 7, color: "text-[var(--danger)]" },
                   { label: "STALE", val: 5, color: "text-[var(--warning)]" },
                   { label: "OFF", val: 2, color: "text-[var(--dim)]" },
                   { label: "TOTAL", val: 14, color: "text-[var(--ink)]" },
                 ].map(m => (
                   <div key={m.label}>
                     <div className="text-[7px] font-black opacity-30 tracking-widest mb-0.5">{m.label}</div>
                     <div className={`text-[11px] font-black text-numeric ${m.color}`}>{m.val}</div>
                   </div>
                 ))}
               </div>
            </div>

            {/* High Intensity Watchpoint 2 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--line-bright)] p-4 relative overflow-hidden shadow-sm">
               <div className="flex items-center justify-between mb-1">
                 <div className="text-[8px] font-black opacity-40 uppercase tracking-widest">PRIORITY</div>
                 <span className="text-lg font-black tabular-nums tracking-tighter">100</span>
               </div>
               <h3 className="text-[14px] font-black leading-tight uppercase mb-2">Cross-border disruption</h3>
               <p className="text-[10px] font-medium leading-normal text-[var(--dim)] mb-3">
                 Explosions / Remote violence / Mae Sot lead incident signal.
               </p>
               <div className="flex gap-1.5">
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">INCIDENT</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">NEWS</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">MARKET</span>
               </div>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-[var(--line)]">
          <div className="eyebrow opacity-40 mb-4 uppercase">System Status</div>
          <div className="flex items-center gap-3 bg-[var(--bg-surface)] px-4 py-3 border border-[var(--line)] rounded-sm">
             <div className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
             <span className="text-[10px] font-black tracking-widest opacity-60">GEOSPATIAL STACK : NOMINAL</span>
          </div>
        </section>
      </div>
    </aside>
  );
}
