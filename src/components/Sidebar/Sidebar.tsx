"use client";

import { Zap } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden bg-[var(--bg-raised)]">
      <div className="p-6 border-b border-[var(--line)]">
        <div className="eyebrow opacity-40 mb-1">COMMAND</div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Thailand Border</h1>
          <span className="live-badge">Live</span>
        </div>
        <p className="text-[11px] font-medium leading-relaxed text-[var(--muted)]">
          Real-time geospatial intelligence focused on regional stability and border dynamics.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10">
        <section>
          <div className="eyebrow mb-6 opacity-40">CRITICAL WATCHPOINTS</div>
          
          <div className="space-y-6">
            {/* High Intensity Watchpoint 1 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--line-bright)] p-5 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
               <div className="flex items-center justify-between mb-4">
                 <div className="text-[9px] font-black opacity-40 uppercase tracking-widest">MAE SOT / MYAWADDY</div>
                 <div className="bg-[var(--accent)] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">Priority</div>
               </div>
               <div className="flex items-end justify-between gap-4 mb-4">
                 <h3 className="text-[18px] font-black leading-none uppercase tracking-tight">Corridor convergence</h3>
                 <span className="text-3xl font-black tabular-nums leading-none tracking-tighter">100</span>
               </div>
               <p className="text-[11px] font-medium leading-relaxed text-[var(--dim)] mb-6">
                 Mae Sot / Myawaddy Corridor is on priority posture. Incident, news, market are converging, led by cross-border disruption risk.
               </p>
               <div className="grid grid-cols-4 gap-4 border-t border-[var(--line)] pt-4">
                 {[
                   { label: "LIVE", val: 7, color: "text-[var(--danger)]" },
                   { label: "STALE", val: 5, color: "text-[var(--warning)]" },
                   { label: "OFFLINE", val: 2, color: "text-[var(--dim)]" },
                   { label: "TOTAL", val: 14, color: "text-[var(--ink)]" },
                 ].map(m => (
                   <div key={m.label}>
                     <div className="text-[8px] font-black opacity-30 tracking-widest mb-1">{m.label}</div>
                     <div className={`text-[13px] font-black text-numeric ${m.color}`}>{m.val}</div>
                   </div>
                 ))}
               </div>
            </div>

            {/* High Intensity Watchpoint 2 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--line-bright)] p-5 relative overflow-hidden shadow-sm">
               <div className="flex items-center justify-between mb-2">
                 <div className="text-[9px] font-black opacity-40 uppercase tracking-widest">PRIORITY</div>
                 <span className="text-xl font-black tabular-nums tracking-tighter">100</span>
               </div>
               <h3 className="text-[16px] font-black leading-tight uppercase mb-3">Cross-border disruption risk</h3>
               <p className="text-[11px] font-medium leading-relaxed text-[var(--dim)] mb-4">
                 Explosions / Remote violence / Mae Sot is the lead incident signal with 5 corroborating items.
               </p>
               <div className="flex gap-2">
                  <span className="text-[9px] font-black px-2 py-1 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">INCIDENT</span>
                  <span className="text-[9px] font-black px-2 py-1 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">NEWS</span>
                  <span className="text-[9px] font-black px-2 py-1 bg-[var(--bg-raised)] border border-[var(--line)] rounded-sm opacity-60 uppercase">MARKET</span>
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
