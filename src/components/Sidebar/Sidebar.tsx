"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Camera,
  Droplets,
  Globe,
  Minus,
  Radio,
  Shield,
  Siren,
  TrendingUp,
  Wheat,
  Zap,
} from "lucide-react";
import type { BorderCommandBrief } from "../../types/dashboard";
import type { CommodityPrice } from "../../app/api/border/commodities/route";
import type { RiverDischarge } from "../../app/api/border/flood-risk/route";
import type { SeismicEvent } from "../../app/api/border/earthquakes/route";
import type { TrafficIncident } from "../../app/api/border/traffic/route";
import type { RegionalDisaster } from "../../app/api/border/disasters/route";

function postureClasses(posture: BorderCommandBrief["overallPosture"]) {
  switch (posture) {
    case "priority":
      return "border-[var(--accent)] bg-[rgba(255,59,48,0.06)]";
    case "watch":
      return "border-[var(--hazard)] bg-[rgba(245,158,11,0.06)]";
    default:
      return "border-[var(--line)] bg-white";
  }
}

function posturePill(posture: BorderCommandBrief["overallPosture"]) {
  switch (posture) {
    case "priority":
      return "danger";
    case "watch":
      return "warning";
    default:
      return "safe";
  }
}

function riskColor(level: string) {
  switch (level) {
    case "critical":
      return "text-[var(--accent)]";
    case "high":
      return "text-[#ef4444]";
    case "moderate":
      return "text-[#f59e0b]";
    default:
      return "text-[var(--safe,#22c55e)]";
  }
}

function riskBg(level: string) {
  switch (level) {
    case "critical":
      return "bg-[rgba(255,59,48,0.08)]";
    case "high":
      return "bg-[rgba(239,68,68,0.06)]";
    case "moderate":
      return "bg-[rgba(245,158,11,0.06)]";
    default:
      return "bg-white";
  }
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "rising":
      return <ArrowUp size={9} className="text-[var(--accent)]" />;
    case "falling":
      return <ArrowDown size={9} className="text-[var(--safe,#22c55e)]" />;
    default:
      return <Minus size={9} className="opacity-30" />;
  }
}

interface SidebarProps {
  brief: BorderCommandBrief | null;
}

function useFetch<T>(url: string, interval: number): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json() as T;
        if (active) setData(json);
      } catch { /* keep last good */ }
    };
    void load();
    const id = setInterval(() => void load(), interval);
    return () => { active = false; clearInterval(id); };
  }, [url, interval]);
  return data;
}

export default function Sidebar({ brief }: SidebarProps) {
  const commodities = useFetch<CommodityPrice[]>("/api/border/commodities", 3600_000);
  const rivers = useFetch<RiverDischarge[]>("/api/border/flood-risk", 1800_000);
  const quakes = useFetch<SeismicEvent[]>("/api/border/earthquakes", 300_000);
  const traffic = useFetch<TrafficIncident[]>("/api/border/traffic", 120_000);
  const disasters = useFetch<RegionalDisaster[]>("/api/border/disasters", 600_000);

  return (
    <aside className="flex h-full flex-col select-none overflow-hidden bg-white">
      <div className="border-b-[1.5px] border-[var(--line)] p-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Shield size={10} className="text-[var(--accent)]" />
              Border Command Posture
            </div>
            <div className="mt-2 text-[15px] font-black uppercase tracking-tight">
              {brief?.headline ?? "Synchronizing command posture"}
            </div>
          </div>
          <span className={`stat-pill ${posturePill(brief?.overallPosture ?? "watch")}`}>
            {brief?.overallPosture ?? "sync"}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-[11px] leading-relaxed text-[var(--muted)]">
            {brief?.summary ??
              "The border command story will appear here once the executive brief finishes loading."}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[22px] font-black tabular-nums leading-none">
              {brief?.overallScore ?? "--"}
            </div>
            <div className="text-[8px] font-black uppercase tracking-[0.18em] opacity-35">
              command score
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar thin-scrollbar p-4 space-y-5">
        {/* TRI-BORDER PRIORITY BOARD */}
        <section>
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Siren size={10} className="text-[var(--accent)]" />
            Tri-Border Priority Board
          </div>
          <div className="space-y-2.5">
            {(brief?.areas ?? []).map((area) => (
              <article
                key={area.id}
                className={`border p-3 transition-all ${postureClasses(area.posture)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
                      {area.counterpart}
                    </div>
                    <div className="mt-1 text-[12px] font-black uppercase tracking-tight">
                      {area.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`stat-pill ${posturePill(area.posture)}`}>
                      {area.posture}
                    </span>
                    <div className="mt-1 text-[10px] font-black tabular-nums opacity-60">
                      {area.score}/100
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
                  {area.summary}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-2">
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Incidents</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.incidentCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Fatalities</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.fatalityCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase opacity-30">Cameras</div>
                    <div className="text-[12px] font-black tabular-nums">
                      {area.verifiedCameras}/{area.candidateCameras}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {area.watchpoints.slice(0, 2).map((watchpoint) => (
                    <span
                      key={watchpoint}
                      className="border border-[var(--line-dim)] bg-[var(--bg)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-70"
                    >
                      {watchpoint}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* IMMEDIATE CONCERNS */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <AlertTriangle size={10} className="text-[var(--accent)]" />
            Immediate Concerns
          </div>
          <div className="space-y-2">
            {(brief?.topConcerns ?? []).slice(0, 5).map((concern) => (
              <div key={concern.id} className="border border-[var(--line)] bg-[var(--bg)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`stat-pill ${posturePill(concern.posture)}`}>
                    {concern.areaLabel.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-black tabular-nums opacity-40">
                    {concern.metric}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-tight">
                  {concern.label}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {concern.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BORDER COMMODITY PRICES */}
        {commodities && commodities.length > 0 && (
          <section className="pt-3 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow flex items-center gap-2">
                <Wheat size={10} className="text-[#d97706]" />
                Border Commodity Prices
              </div>
              <span className="live-badge scale-75">NABC</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {commodities.map((c) => (
                <div key={c.id} className="border border-[var(--line)] bg-[var(--bg)] p-2">
                  <div className="text-[8px] font-black uppercase tracking-wider opacity-40 leading-none">
                    {c.nameEn}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[13px] font-black tabular-nums leading-none">
                      {typeof c.price === "number" && c.price > 100
                        ? c.price.toLocaleString("en-US")
                        : c.price}
                    </span>
                    <span className="text-[7px] font-black opacity-30">{c.unit}</span>
                  </div>
                  <div className="text-[7px] opacity-25 mt-0.5 truncate">{c.date}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BORDER RIVER FLOOD RISK */}
        {rivers && rivers.length > 0 && (
          <section className="pt-3 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow flex items-center gap-2">
                <Droplets size={10} className="text-[#3b82f6]" />
                Border River Discharge
              </div>
              <span className="live-badge scale-75">LIVE</span>
            </div>
            <div className="space-y-1.5">
              {rivers.map((r) => (
                <div key={r.id} className={`border border-[var(--line)] p-2 flex items-center gap-2 ${riskBg(r.riskLevel)}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-tight truncate">
                      {r.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-black tabular-nums leading-none">
                        {r.currentDischarge}
                      </span>
                      <span className="text-[7px] opacity-30">m³/s</span>
                      <TrendIcon trend={r.trend} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[7px] font-black uppercase tracking-wider ${riskColor(r.riskLevel)}`}>
                      {r.riskLevel}
                    </div>
                    <div className="text-[7px] opacity-25 mt-0.5">
                      peak {r.forecastPeak}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEISMIC ACTIVITY */}
        {quakes && quakes.length > 0 && (
          <section className="pt-3 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow flex items-center gap-2">
                <Zap size={10} className="text-[#ef4444]" />
                Seismic Activity (30d)
              </div>
              <span className="text-[8px] font-black tabular-nums opacity-30">
                {quakes.length} events
              </span>
            </div>
            <div className="space-y-1">
              {quakes.slice(0, 6).map((q) => (
                <div key={q.id} className="border border-[var(--line)] bg-[var(--bg)] p-2 flex items-center gap-2">
                  <div
                    className={`w-[28px] h-[28px] rounded-sm flex items-center justify-center shrink-0 ${
                      q.magnitude >= 5
                        ? "bg-[rgba(255,59,48,0.12)] text-[var(--accent)]"
                        : q.magnitude >= 4
                          ? "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]"
                          : "bg-[rgba(0,0,0,0.04)] opacity-60"
                    }`}
                  >
                    <span className="text-[11px] font-black tabular-nums">{q.magnitude.toFixed(1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold leading-tight truncate">{q.place}</div>
                    <div className="text-[7px] opacity-30 mt-0.5">
                      {q.depth.toFixed(0)}km deep · {new Date(q.time).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TRAFFIC INCIDENTS */}
        {traffic && traffic.length > 0 && (
          <section className="pt-3 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow flex items-center gap-2">
                <TrendingUp size={10} className="text-[#6366f1]" />
                Traffic Incidents
              </div>
              <span className="live-badge scale-75">LONGDO</span>
            </div>
            <div className="space-y-1">
              {traffic.slice(0, 5).map((t) => {
                const catColor =
                  t.category === "accident" ? "text-[var(--accent)]" :
                  t.category === "trafficjam" ? "text-[#f59e0b]" :
                  t.category === "roadclosed" ? "text-[#ef4444]" :
                  "opacity-50";
                return (
                  <div key={t.id} className="border border-[var(--line)] bg-[var(--bg)] p-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[7px] font-black uppercase tracking-wider ${catColor}`}>
                        {t.category}
                      </span>
                      <span className="text-[7px] opacity-25">
                        {new Date(t.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold leading-tight mt-1 line-clamp-2">
                      {t.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* REGIONAL DISASTERS (GDACS) */}
        {disasters && disasters.length > 0 && (
          <section className="pt-3 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow flex items-center gap-2">
                <Globe size={10} className="text-[#0ea5e9]" />
                Regional Disaster Alerts
              </div>
              <span className="live-badge scale-75">GDACS</span>
            </div>
            <div className="space-y-1">
              {disasters.slice(0, 6).map((d) => {
                const alertColor =
                  d.alertLevel === "Red" ? "text-[var(--accent)] bg-[rgba(255,59,48,0.08)]" :
                  d.alertLevel === "Orange" ? "text-[#f59e0b] bg-[rgba(245,158,11,0.06)]" :
                  "opacity-60 bg-[var(--bg)]";
                return (
                  <div key={d.id} className={`border border-[var(--line)] p-2 ${d.alertLevel === "Red" ? "bg-[rgba(255,59,48,0.04)]" : "bg-[var(--bg)]"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded-sm ${alertColor}`}>
                        {d.alertLevel}
                      </span>
                      <span className="text-[7px] font-black uppercase opacity-40">{d.type}</span>
                      <span className="text-[7px] opacity-25 ml-auto">
                        {d.date ? new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold leading-tight mt-1 line-clamp-2">
                      {d.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* INTERVENTION QUEUE */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow flex items-center gap-2">
              <Radio size={10} />
              Intervention Queue
            </div>
            <span className="live-badge scale-75">LIVE</span>
          </div>
          <div className="space-y-2">
            {(brief?.actionQueue ?? []).map((action, index) => (
              <div key={action.id} className="border border-[var(--line)] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black tabular-nums opacity-40">
                    0{index + 1}
                  </span>
                  <span className={`stat-pill ${posturePill(action.posture)}`}>
                    {action.owner}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-tight">
                  {action.title}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                  {action.detail}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] opacity-50">
                  {action.areaLabel}
                  <ArrowRight size={10} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COVERAGE NOTE */}
        <section className="pt-3 border-t border-[var(--line)]">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Camera size={10} />
            Coverage Note
          </div>
          <div className="border border-[var(--line)] bg-[var(--bg)] p-3 text-[10px] leading-relaxed text-[var(--muted)]">
            Verified cameras now anchor the Myanmar and Malaysia corridors, while scout slots flag the coverage gap on the Cambodia frontier. That makes the intervention queue useful to a governor: it shows both where the heat is and where visibility is still weak.
          </div>
        </section>
      </div>

      <div className="p-3 bg-white border-t border-[var(--line)] flex items-center justify-between shrink-0">
        <div className="text-[11px] font-black opacity-15 uppercase tracking-[0.4em]">
          Sentinel // Border
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase opacity-30">
          {(brief?.sources ?? ["Synchronizing sources"]).slice(0, 2).join(" / ")}
        </div>
      </div>
    </aside>
  );
}
