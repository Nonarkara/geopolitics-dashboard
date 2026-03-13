"use client";

import { AlertTriangle, Activity, Zap, Radio } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden">
      {/* ── Operational Status ── */}
      <div className="p-4 border-b border-[var(--line)] bg-white">
        <div className="flex items-center justify-between mb-2">
           <div className="eyebrow opacity-40">SYSTEM STATUS</div>
           <span className="live-badge">Operational</span>
        </div>
        <div className="h-1 w-full bg-[var(--line)] rounded-full overflow-hidden">
           <div className="h-full w-[88%] bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* ── High Intensity Pulse Cards ── */}
        <section>
          <div className="eyebrow mb-3 opacity-60 flex items-center gap-2">
             <Activity size={10} />
             Live Watchpoints
          </div>
          
          <div className="space-y-2">
            {[
              { 
                loc: "MAE SOT / MYAWADDY", 
                title: "Corridor convergence", 
                score: 100, 
                intensity: "text-[var(--danger)]",
                metrics: [["INTEL", 12], ["NEWS", 5], ["MKT", "DISR"]] 
              },
              { 
                loc: "CHIANG RAI SECTOR", 
                title: "Trade route friction", 
                score: 72, 
                intensity: "text-[var(--warning)]",
                metrics: [["INTEL", 4], ["NEWS", 2], ["MKT", "NORM"]] 
              }
            ].map((w, i) => (
              <div key={i} className="bg-white border border-[var(--line)] p-3 relative overflow-hidden group hover:border-[var(--line-bright)] transition-all">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-all">
                   <Zap size={40} />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                   <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">{w.loc}</span>
                   <span className={`text-[12px] font-black tabular-nums ${w.intensity}`}>{w.score}</span>
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-tight mb-3 pr-8">{w.title}</h3>
                
                <div className="flex gap-2 border-t border-[var(--line)] pt-2 mt-2">
                   {w.metrics.map((m, j) => (
                     <div key={j} className="flex-1">
                        <div className="text-[7px] font-bold opacity-30 uppercase">{m[0]}</div>
                        <div className="text-[10px] font-black tabular-nums tracking-tighter">{m[1]}</div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Radio / Signals ── */}
        <section className="pt-4 border-t border-[var(--line)]">
           <div className="eyebrow mb-3 opacity-60 flex items-center gap-2">
              <Radio size={10} />
              Signal Density
           </div>
           <div className="space-y-1.5">
              {[
                { label: "Myawaddy Fighting", time: "2m ago", type: "Heavy" },
                { label: "Rakhine Displacement", time: "14m ago", type: "Stale" }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-white transition-all rounded-sm">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold">{s.label}</span>
                      <span className="text-[8px] opacity-40 uppercase font-black">{s.time}</span>
                   </div>
                   <span className="text-[8px] font-black px-1.5 py-0.5 border border-[var(--line)] opacity-40 uppercase">{s.type}</span>
                </div>
              ))}
           </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-[var(--line)]">
         <div className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] text-center">Sentinel Access Alpha v1</div>
      </div>
    </aside>
  );
}
