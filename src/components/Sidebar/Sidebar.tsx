"use client";

import { useEffect, useState } from "react";
import { Shield, TrendingUp, Globe, AlertTriangle, Activity, BarChart3 } from "lucide-react";
import { fallbackAseanGdp } from "../../lib/mock-data";
import type { AseanGdpDatum } from "../../types/dashboard";

function getSignalLevel(score: number): string {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function getSignalBorderClass(level: string): string {
  switch (level) {
    case "critical": return "border-[var(--accent)] border-[2.5px]";
    case "high": return "border-[var(--hazard)] border-2";
    case "medium": return "border-[var(--tech)] border-[1.5px]";
    default: return "border-[var(--line-dim)] border";
  }
}

function formatGdp(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
  return `$${(value / 1_000_000).toFixed(0)}M`;
}

export default function Sidebar() {
  const [gdpData, setGdpData] = useState<AseanGdpDatum[]>(fallbackAseanGdp);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/markets", { cache: "no-store" });
        const payload = await res.json();
        if (payload && typeof payload === "object" && "aseanGdp" in payload && Array.isArray(payload.aseanGdp) && payload.aseanGdp.length > 0) {
          setGdpData(payload.aseanGdp);
        }
      } catch {
        // Keep fallback
      }
    };
    load();
    const interval = setInterval(load, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const maxGdp = Math.max(...gdpData.map(d => d.gdpUsd));

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
        <div className="flex gap-1.5 mt-2">
          <div className="stat-pill safe">NASA GIBS</div>
          <div className="stat-pill info">JAXA</div>
          <div className="stat-pill safe">ESA</div>
          <div className="stat-pill warning">ROSCOSMOS</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar thin-scrollbar p-4 space-y-5">
        {/* ── Strategic Watchpoints with Signal Density ── */}
        <section>
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Shield size={10} className="text-[var(--accent)]" />
            Strategic Sectors
          </div>

          <div className="space-y-2.5">
            {[
              {
                loc: "MAE SOT / MYAWADDY",
                title: "Border Convergence",
                score: 100,
                metrics: [["INTL", 24], ["FIRE", 8], ["MOVE", "CRIT"], ["AQI", 156]],
              },
              {
                loc: "RANONG / KAWTHAUNG",
                title: "Maritime Corridor",
                score: 84,
                metrics: [["INTL", 12], ["FIRE", 2], ["MOVE", "WARN"], ["AQI", 88]],
              },
              {
                loc: "TAK BORDER ZONE",
                title: "Northern Gateway",
                score: 72,
                metrics: [["INTL", 9], ["FIRE", 5], ["MOVE", "MOD"], ["AQI", 142]],
              },
              {
                loc: "SUNGALKOLOK SECTOR",
                title: "Deep South Pulse",
                score: 62,
                metrics: [["INTL", 5], ["FIRE", 0], ["MOVE", "NORM"], ["AQI", 45]],
              },
              {
                loc: "THREE PAGODAS PASS",
                title: "Karen State Interface",
                score: 55,
                metrics: [["INTL", 3], ["FIRE", 1], ["MOVE", "LOW"], ["AQI", 67]],
              },
            ].map((w, i) => {
              const signal = getSignalLevel(w.score);
              return (
                <div
                  key={i}
                  className={`p-3 relative group hover:border-[var(--ink)] transition-all bg-white ${getSignalBorderClass(signal)}`}
                >
                  {signal === "critical" && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[7px] font-black opacity-30 uppercase tracking-[0.2em]">{w.loc}</span>
                    <span className={`text-[10px] font-black tabular-nums px-1.5 py-0.5 ${
                      signal === "critical" ? "bg-[var(--accent)] text-white" :
                      signal === "high" ? "bg-[var(--hazard)] text-black" :
                      signal === "medium" ? "bg-[var(--tech)] text-white" :
                      "bg-[var(--line-dim)] text-[var(--ink)]"
                    }`}>
                      {w.score}
                    </span>
                  </div>
                  <h3 className="text-[12px] font-black uppercase tracking-tight mb-2 pr-4">{w.title}</h3>

                  <div className="grid grid-cols-4 gap-1.5 border-t border-[var(--line-dim)] pt-2">
                    {w.metrics.map((m, j) => (
                      <div key={j} className="flex flex-col">
                        <div className="text-[8px] font-black opacity-30 uppercase">{m[0]}</div>
                        <div className={`text-[12px] font-black tabular-nums tracking-tighter leading-none mt-0.5 ${
                          m[0] === "AQI" && typeof m[1] === "number" && m[1] > 100 ? "text-[var(--accent)]" :
                          m[1] === "CRIT" ? "text-[var(--accent)]" :
                          m[1] === "WARN" ? "text-[var(--hazard)]" : ""
                        }`}>
                          {m[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── ASEAN GDP Rankings ── */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <BarChart3 size={10} />
            ASEAN GDP Rankings
          </div>
          <div className="space-y-1.5">
            {gdpData.slice(0, 11).map((d, i) => (
              <div key={d.countryCode} className="flex items-center gap-2 group">
                <span className="text-[10px] font-black opacity-30 w-3 text-right tabular-nums">{i + 1}</span>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-tight truncate">{d.country}</span>
                    <span className="text-[11px] font-black tabular-nums opacity-60 ml-1 shrink-0">{formatGdp(d.gdpUsd)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 bg-[var(--line-dim)] opacity-20">
                      <div
                        className="h-full bg-black"
                        style={{ width: `${(d.gdpUsd / maxGdp) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-black opacity-40 uppercase">{d.countryCode}</span>
                    <span className="text-[9px] font-black opacity-40 tabular-nums">${d.gdpPerCapitaUsd?.toLocaleString()}/cap</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[7px] font-black opacity-15 uppercase tracking-[0.3em] text-center">
            Source: World Bank {gdpData[0]?.gdpYear || 2024}
          </div>
        </section>

        {/* ── Signal Density ── */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <TrendingUp size={10} />
            Signal Density
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Myawaddy Fighting", time: "2m", status: "Critical", trend: "up" },
              { label: "Refugee Intake", time: "14m", status: "Moderate", trend: "down" },
              { label: "Air Quality Alert", time: "1h", status: "Severe", trend: "up" },
              { label: "Customs Disruption", time: "2h", status: "Normal", trend: "stable" },
              { label: "Naval Movement", time: "45m", status: "Watch", trend: "up" },
              { label: "Satellite Pass (VIIRS)", time: "3h", status: "Scheduled", trend: "stable" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-transparent hover:border-[var(--line-dim)] hover:bg-[var(--bg)] transition-all">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-tighter">{s.label}</span>
                  <span className="text-[8px] font-bold opacity-30 uppercase">Updated {s.time} ago</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`stat-pill ${
                    s.status === "Critical" ? "danger" :
                    s.status === "Severe" ? "warning" :
                    s.status === "Watch" ? "info" : "safe"
                  }`}>
                    {s.status}
                  </span>
                  <div className="h-1 w-8 bg-[var(--line-dim)] mt-1">
                    <div className={`h-full ${
                      s.trend === "up" ? "w-full bg-[var(--accent)]" :
                      s.trend === "down" ? "w-2/3 bg-[var(--tech)]" :
                      "w-1/2 bg-[var(--dim)]"
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Satellite Sources ── */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Activity size={10} />
            Satellite Sources Active
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { name: "NASA GIBS", flag: "US", status: "ok" },
              { name: "JAXA GCOM", flag: "JP", status: "ok" },
              { name: "ESA Copernicus", flag: "EU", status: "ok" },
              { name: "ROSCOSMOS", flag: "RU", status: "delayed" },
              { name: "CNSA FY-4A", flag: "CN", status: "ok" },
              { name: "UKSA NovaSAR", flag: "UK", status: "ok" },
              { name: "ISRO Cartosat", flag: "IN", status: "ok" },
              { name: "KARI CAS500", flag: "KR", status: "ok" },
            ].map((src, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--line-dim)] last:border-0 hover:bg-[var(--bg)] transition-all px-1 cursor-default">
                <div className={`w-1 h-1 rounded-full ${src.status === "ok" ? "bg-[var(--safe)]" : "bg-[var(--hazard)]"}`} />
                <span className="text-[10px] font-black opacity-40 uppercase">{src.flag}</span>
                <span className="text-[11px] font-black uppercase tracking-tight truncate">{src.name}</span>
                <div className="flex-1" />
                <span className={`stat-pill ${src.status === "ok" ? "safe" : "warning"} scale-90`}>{src.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-3 bg-white border-t border-[var(--line)] flex items-center justify-between">
        <div className="text-[11px] font-black opacity-15 uppercase tracking-[0.4em]">Sentinel // X</div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={8} className="opacity-10" />
          <Globe size={10} className="opacity-10" />
        </div>
      </div>
    </aside>
  );
}
