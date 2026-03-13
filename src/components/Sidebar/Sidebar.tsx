"use client";

import { Activity, Radio, Zap, Shield, Globe, TrendingUp } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex h-full flex-col select-none overflow-hidden bg-white">
      {/* ── Operational Status ── */}
      <div className="p-4 border-b-[1.5px] border-[var(--line)]">
        <div className="flex items-center justify-between mb-2">
           <div className="eyebrow">SYSTEM ALPHA</div>
           <span className="live-badge scale-90">Locked</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex-1 h-[2px] bg-[var(--line-dim)]">
              <div className="h-full w-[94%] bg-[var(--safe)]" />
           </div>
           <span className="text-[10px] font-black tabular-nums tracking-tighter">94%</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {/* ── High Intensity Watchpoints ── */}
        <section>
          <div className="eyebrow mb-4 flex items-center gap-2">
             <Shield size={10} className="text-[var(--accent)]" />
             Strategic Sectors
          </div>
          
          <div className="space-y-3">
            {[
              { 
                loc: "MAE SOT / MYAWADDY", 
                title: "Border Convergence", 
                score: 100, 
                intensity: "bg-[var(--accent)] text-white",
                metrics: [["INTL", 24], ["FIRE", 8], ["MOVE", "CRIT"]] 
              },
              { 
                loc: "RANONG / KAWTHAUNG", 
                title: "Maritime Corridor", 
                score: 84, 
                intensity: "bg-[var(--hazard)] text-black",
                metrics: [["INTL", 12], ["FIRE", 2], ["MOVE", "WARN"]] 
              },
              { 
                loc: "SUNGALKOLOK SECTOR", 
                title: "Deep South Pulse", 
                score: 62, 
                intensity: "bg-[var(--line)] text-[var(--ink)]",
                metrics: [["INTL", 5], ["FIRE", 0], ["MOVE", "NORM"]] 
              }
            ].map((w, i) => (
              <div key={i} className="border-[1.5px] border-[var(--line)] p-3 relative group hover:border-[var(--ink)] transition-all bg-white">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">{w.loc}</span>
                   <span className={`text-[10px] font-black tabular-nums px-1.5 py-0.5 ${w.intensity}`}>{w.score}</span>
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-tight mb-3 pr-4">{w.title}</h3>
                
                <div className="grid grid-cols-3 gap-2 border-t border-[var(--line-dim)] pt-2 mt-2">
                   {w.metrics.map((m, j) => (
                     <div key={j} className="flex flex-col">
                        <div className="text-[7px] font-black opacity-30 uppercase">{m[0]}</div>
                        <div className="text-[11px] font-black tabular-nums tracking-tighter leading-none mt-1">{m[1]}</div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Operational Trends ── */}
        <section className="pt-4 border-t border-[var(--line)]">
           <div className="eyebrow mb-4 flex items-center gap-2">
              <TrendingUp size={10} />
              Signal Density
           </div>
           <div className="space-y-2">
              {[
                { label: "Myawaddy Fighting", time: "2m", status: "Critical", trend: "up" },
                { label: "Refugee Intake", time: "14m", status: "Moderate", trend: "down" },
                { label: "Air Quality Alert", time: "1h", status: "Severe", trend: "up" },
                { label: "Customs Disruption", time: "2h", status: "Normal", trend: "stable" }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 border border-transparent hover:border-[var(--line-dim)] hover:bg-[var(--bg)] transition-all">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-tighter">{s.label}</span>
                      <span className="text-[8px] font-bold opacity-30 uppercase">Updated {s.time} ago</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-black uppercase ${s.status === 'Critical' ? 'text-[var(--accent)]' : 'opacity-40'}`}>{s.status}</span>
                      <div className="h-1 w-8 bg-[var(--line-dim)] mt-1">
                         <div className={`h-full ${s.trend === 'up' ? 'w-full bg-[var(--accent)]' : 'w-1/2 bg-[var(--dim)]'}`} />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-[var(--line)] flex items-center justify-between">
         <div className="text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">Sentinel // X</div>
         <Globe size={12} className="opacity-10" />
      </div>
    </aside>
  );
}
