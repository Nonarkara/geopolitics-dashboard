"use client";

import { useEffect, useState } from "react";
import type { BorderCommandBrief } from "../../types/dashboard";
import type { CommodityPrice } from "../../app/api/border/commodities/route";
import type { RiverDischarge } from "../../app/api/border/flood-risk/route";
import type { SeismicEvent } from "../../app/api/border/earthquakes/route";
import type { TrafficIncident } from "../../app/api/border/traffic/route";
import type { RegionalDisaster } from "../../app/api/border/disasters/route";

function postureColor(posture: string) {
  switch (posture) {
    case "priority":
      return "var(--accent)";
    case "watch":
      return "var(--warning, #f59e0b)";
    default:
      return "var(--safe, #22c55e)";
  }
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
      } catch { /* keep last */ }
    };
    void load();
    const id = setInterval(() => void load(), interval);
    return () => { active = false; clearInterval(id); };
  }, [url, interval]);
  return data;
}

function ScoreBar({ label, counterpart, score, posture }: {
  label: string;
  counterpart: string;
  score: number;
  posture: string;
}) {
  const color = postureColor(posture);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-[90px] shrink-0 text-right">
        <div className="text-[9px] font-black uppercase tracking-tight leading-none truncate">{label}</div>
        <div className="text-[7px] opacity-40 uppercase leading-none">{counterpart}</div>
      </div>
      <div className="flex-1 h-[10px] bg-white/5 rounded-sm overflow-hidden relative min-w-[80px]">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        <div className="absolute inset-0 flex items-center justify-end pr-1">
          <span className="text-[7px] font-black tabular-nums" style={{ color: score > 60 ? '#000' : color }}>
            {score}
          </span>
        </div>
      </div>
      <div
        className="text-[7px] font-black uppercase w-[52px] text-center py-0.5 rounded-sm shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
      >
        {posture}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="text-center px-1.5">
      <div className="text-[7px] font-black uppercase tracking-wider opacity-40 leading-none mb-0.5">{label}</div>
      <div className="text-[13px] font-black tabular-nums leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[7px] opacity-30 leading-none mt-0.5">{sub}</div>}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-[48px] bg-white/10 shrink-0" />;
}

function riskColorHex(level: string) {
  switch (level) {
    case "critical": return "var(--accent)";
    case "high": return "#ef4444";
    case "moderate": return "#f59e0b";
    default: return "var(--safe, #22c55e)";
  }
}

export default function BorderStatusStrip({ brief }: { brief: BorderCommandBrief | null }) {
  const commodities = useFetch<CommodityPrice[]>("/api/border/commodities", 3600_000);
  const rivers = useFetch<RiverDischarge[]>("/api/border/flood-risk", 1800_000);
  const quakes = useFetch<SeismicEvent[]>("/api/border/earthquakes", 300_000);
  const traffic = useFetch<TrafficIncident[]>("/api/border/traffic", 120_000);
  const disasters = useFetch<RegionalDisaster[]>("/api/border/disasters", 600_000);

  if (!brief) {
    return (
      <section className="bg-[var(--bg)] border-t border-black shrink-0 h-[72px] flex items-center justify-center">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-20 animate-pulse">
          SYNCHRONIZING COMMAND PICTURE
        </span>
      </section>
    );
  }

  const totalIncidents = brief.areas.reduce((s, a) => s + a.incidentCount, 0);
  const totalFatalities = brief.areas.reduce((s, a) => s + a.fatalityCount, 0);
  const totalVerified = brief.areas.reduce((s, a) => s + a.verifiedCameras, 0);
  const totalCandidates = brief.areas.reduce((s, a) => s + a.candidateCameras, 0);

  // River flood: find highest risk
  const highestRiskRiver = rivers
    ?.slice()
    .sort((a, b) => {
      const rank = (l: string) => l === "critical" ? 4 : l === "high" ? 3 : l === "moderate" ? 2 : 1;
      return rank(b.riskLevel) - rank(a.riskLevel);
    })[0];

  // Earthquake: strongest recent
  const strongestQuake = quakes?.slice().sort((a, b) => b.magnitude - a.magnitude)[0];

  // Traffic: count by category
  const trafficAccidents = traffic?.filter(t => t.category === "accident").length ?? 0;
  const trafficJams = traffic?.filter(t => t.category === "trafficjam").length ?? 0;

  // Disasters: count by alert level
  const redAlerts = disasters?.filter(d => d.alertLevel === "Red").length ?? 0;
  const orangeAlerts = disasters?.filter(d => d.alertLevel === "Orange").length ?? 0;

  // Commodities: pick top 3 for display
  const topCommodities = commodities?.slice(0, 3) ?? [];

  return (
    <section className="bg-[var(--bg)] border-t border-black shrink-0 px-4 py-2 relative z-40">
      <div className="max-w-[1800px] mx-auto flex items-center gap-4">

        {/* Overall posture badge */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div
            className="w-[44px] h-[44px] rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `color-mix(in srgb, ${postureColor(brief.overallPosture)} 15%, transparent)` }}
          >
            <span
              className="text-[18px] font-black tabular-nums"
              style={{ color: postureColor(brief.overallPosture) }}
            >
              {brief.overallScore}
            </span>
          </div>
          <div
            className="text-[6px] font-black uppercase tracking-widest"
            style={{ color: postureColor(brief.overallPosture) }}
          >
            {brief.overallPosture}
          </div>
        </div>

        <Divider />

        {/* Area score bars */}
        <div className="flex flex-col gap-1 min-w-0 w-[340px] shrink-0">
          {brief.areas.map((area) => (
            <ScoreBar
              key={area.id}
              label={area.label}
              counterpart={area.counterpart}
              score={area.score}
              posture={area.posture}
            />
          ))}
        </div>

        <Divider />

        {/* Command metrics */}
        <div className="flex items-center gap-0 shrink-0">
          <Metric label="Incidents" value={totalIncidents} sub="matched" />
          <Metric label="Fatalities" value={totalFatalities} sub="reported" />
          <Metric label="Cameras" value={totalVerified} sub={`+${totalCandidates} scout`} />
        </div>

        <Divider />

        {/* Traffic (Longdo) */}
        <div className="flex items-center gap-0 shrink-0 hidden xl:flex">
          <Metric
            label="Traffic"
            value={traffic?.length ?? "--"}
            sub="incidents"
          />
          <Metric
            label="Accidents"
            value={trafficAccidents}
            sub="active"
            color={trafficAccidents > 0 ? "var(--accent)" : undefined}
          />
          <Metric
            label="Jams"
            value={trafficJams}
            sub="reported"
          />
        </div>

        <Divider />

        {/* Seismic + Flood + Disasters */}
        <div className="flex items-center gap-0 shrink-0 hidden xl:flex">
          {strongestQuake && (
            <Metric
              label="Max Quake"
              value={`M${strongestQuake.magnitude.toFixed(1)}`}
              sub="30d SE Asia"
              color={strongestQuake.magnitude >= 5 ? "var(--accent)" : strongestQuake.magnitude >= 4 ? "#f59e0b" : undefined}
            />
          )}
          {highestRiskRiver && (
            <Metric
              label="River Risk"
              value={highestRiskRiver.riskLevel.toUpperCase()}
              sub={highestRiskRiver.name.split("(")[0].trim()}
              color={riskColorHex(highestRiskRiver.riskLevel)}
            />
          )}
          {disasters && disasters.length > 0 && (
            <Metric
              label="GDACS"
              value={disasters.length}
              sub={redAlerts > 0 ? `${redAlerts} red` : orangeAlerts > 0 ? `${orangeAlerts} orange` : "green"}
              color={redAlerts > 0 ? "var(--accent)" : orangeAlerts > 0 ? "#f59e0b" : undefined}
            />
          )}
        </div>

        <Divider />

        {/* Commodity prices (NABC) */}
        <div className="flex items-center gap-0 shrink-0 hidden 2xl:flex">
          {topCommodities.map((c) => (
            <Metric
              key={c.id}
              label={c.nameEn}
              value={typeof c.price === "number" && c.price > 100 ? c.price.toLocaleString("en-US") : c.price}
              sub={c.unit}
            />
          ))}
        </div>

        {/* Timestamp */}
        <div className="shrink-0 text-right ml-auto">
          <div className="text-[7px] font-black uppercase tracking-wider opacity-20 leading-none mb-0.5">GENERATED</div>
          <div className="text-[9px] tabular-nums opacity-40">
            {new Date(brief.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-[7px] opacity-20 uppercase mt-0.5">Connected Grid V5</div>
        </div>
      </div>
    </section>
  );
}
