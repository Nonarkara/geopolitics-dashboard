"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { BorderCommandBrief } from "../../types/dashboard";
import type { CommodityPrice } from "../../app/api/border/commodities/route";
import type { RiverDischarge } from "../../app/api/border/flood-risk/route";
import type { SeismicEvent } from "../../app/api/border/earthquakes/route";
import type { TrafficIncident } from "../../app/api/border/traffic/route";
import type { RegionalDisaster } from "../../app/api/border/disasters/route";
import { useFetch } from "../../hooks/useFetch";
import { DATA_SOURCE_CATALOG } from "../../lib/data-sources";

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

function Metric({ label, value, sub, color, sourceId }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  sourceId?: string;
}) {
  const source = sourceId ? DATA_SOURCE_CATALOG[sourceId] : undefined;
  return (
    <div className="text-center px-1.5">
      <div className="text-[7px] font-black uppercase tracking-wider opacity-40 leading-none mb-0.5">{label}</div>
      <div className="text-[13px] font-black tabular-nums leading-none" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[7px] opacity-30 leading-none mt-0.5">{sub}</div>}
      {source && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[5px] uppercase tracking-wider opacity-20 hover:opacity-50 underline transition-opacity leading-none mt-0.5 block"
        >
          {source.shortLabel}
        </a>
      )}
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

/** Format seconds ago as a short relative string */
function timeAgo(date: Date | null): string {
  if (!date) return "--";
  const sec = Math.round((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.round(min / 60)}h ago`;
}

/** Micro feed-health dot */
function FeedDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1" title={`${label}: ${ok ? "connected" : "waiting"}`}>
      <div className={`w-[5px] h-[5px] rounded-full ${ok ? "bg-[var(--safe,#22c55e)]" : "bg-white/15"}`} />
      <span className="text-[5px] font-black uppercase tracking-wider opacity-30">{label}</span>
    </div>
  );
}

export default function BorderStatusStrip({ brief }: { brief: BorderCommandBrief | null }) {
  const commoditiesFetch = useFetch<CommodityPrice[]>("/api/border/commodities", 3600_000);
  const riversFetch = useFetch<RiverDischarge[]>("/api/border/flood-risk", 1800_000);
  const quakesFetch = useFetch<SeismicEvent[]>("/api/border/earthquakes", 300_000);
  const trafficFetch = useFetch<TrafficIncident[]>("/api/border/traffic", 120_000);
  const disastersFetch = useFetch<RegionalDisaster[]>("/api/border/disasters", 600_000);

  const commodities = commoditiesFetch.data;
  const rivers = riversFetch.data;
  const quakes = quakesFetch.data;
  const traffic = trafficFetch.data;
  const disasters = disastersFetch.data;

  // Track aggregate refresh state
  const anyRefreshing = commoditiesFetch.isRefreshing || riversFetch.isRefreshing || quakesFetch.isRefreshing || trafficFetch.isRefreshing || disastersFetch.isRefreshing;

  // Most recent refresh across all feeds
  const allRefreshTimes = [
    commoditiesFetch.lastRefreshed,
    riversFetch.lastRefreshed,
    quakesFetch.lastRefreshed,
    trafficFetch.lastRefreshed,
    disastersFetch.lastRefreshed,
  ].filter(Boolean) as Date[];
  const latestRefresh = allRefreshTimes.length > 0
    ? new Date(Math.max(...allRefreshTimes.map(d => d.getTime())))
    : null;

  // Refresh all feeds manually
  const refreshAll = useCallback(() => {
    commoditiesFetch.refresh();
    riversFetch.refresh();
    quakesFetch.refresh();
    trafficFetch.refresh();
    disastersFetch.refresh();
  }, [commoditiesFetch, riversFetch, quakesFetch, trafficFetch, disastersFetch]);

  // Relative time ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

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

  const highestRiskRiver = rivers
    ?.slice()
    .sort((a, b) => {
      const rank = (l: string) => l === "critical" ? 4 : l === "high" ? 3 : l === "moderate" ? 2 : 1;
      return rank(b.riskLevel) - rank(a.riskLevel);
    })[0];

  const strongestQuake = quakes?.slice().sort((a, b) => b.magnitude - a.magnitude)[0];

  const trafficAccidents = traffic?.filter(t => t.category === "accident").length ?? 0;
  const trafficJams = traffic?.filter(t => t.category === "trafficjam").length ?? 0;

  const redAlerts = disasters?.filter(d => d.alertLevel === "Red").length ?? 0;
  const orangeAlerts = disasters?.filter(d => d.alertLevel === "Orange").length ?? 0;

  const topCommodities = commodities?.slice(0, 3) ?? [];

  // Count active feeds
  const activeFeedCount = [commodities, rivers, quakes, traffic, disasters].filter(Boolean).length;

  return (
    <section className="bg-[var(--bg)] border-t border-black shrink-0 px-4 py-2 relative z-40">
      <div className="max-w-[2200px] mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">

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
          <Metric label="Incidents" value={totalIncidents} sub="matched" sourceId="acled" />
          <Metric label="Fatalities" value={totalFatalities} sub="reported" sourceId="acled" />
          <Metric label="Cameras" value={totalVerified} sub={`+${totalCandidates} scout`} />
        </div>

        <Divider />

        {/* Traffic (Longdo) — always visible, compressed on smaller screens */}
        <div className="flex items-center gap-0 shrink-0">
          <Metric label="Traffic" value={traffic?.length ?? "--"} sub="incidents" sourceId="traffic" />
          <Metric label="Accidents" value={trafficAccidents} sub="active" color={trafficAccidents > 0 ? "var(--accent)" : undefined} sourceId="traffic" />
          <Metric label="Jams" value={trafficJams} sub="reported" sourceId="traffic" />
        </div>

        <Divider />

        {/* Seismic + Flood + Disasters — always visible */}
        <div className="flex items-center gap-0 shrink-0">
          {strongestQuake && (
            <Metric
              label="Max Quake"
              value={`M${strongestQuake.magnitude.toFixed(1)}`}
              sub="30d SE Asia"
              color={strongestQuake.magnitude >= 5 ? "var(--accent)" : strongestQuake.magnitude >= 4 ? "#f59e0b" : undefined}
              sourceId="earthquakes"
            />
          )}
          {highestRiskRiver && (
            <Metric
              label="River Risk"
              value={highestRiskRiver.riskLevel.toUpperCase()}
              sub={highestRiskRiver.name.split("(")[0].trim()}
              color={riskColorHex(highestRiskRiver.riskLevel)}
              sourceId="flood"
            />
          )}
          {disasters && disasters.length > 0 && (
            <Metric
              label="GDACS"
              value={disasters.length}
              sub={redAlerts > 0 ? `${redAlerts} red` : orangeAlerts > 0 ? `${orangeAlerts} orange` : "green"}
              color={redAlerts > 0 ? "var(--accent)" : orangeAlerts > 0 ? "#f59e0b" : undefined}
              sourceId="disasters"
            />
          )}
        </div>

        <Divider />

        {/* Commodity prices (NABC) — always visible */}
        <div className="flex items-center gap-0 shrink-0">
          {topCommodities.map((c) => (
            <Metric
              key={c.id}
              label={c.nameEn}
              value={typeof c.price === "number" && c.price > 100 ? c.price.toLocaleString("en-US") : c.price}
              sub={c.unit}
              sourceId="commodities"
            />
          ))}
        </div>

        <Divider />

        {/* ── Command Status + Refresh ────────────────── */}
        <div className="shrink-0 ml-auto flex items-center gap-3">
          {/* Feed health dots */}
          <div className="flex flex-col gap-[3px]">
            <FeedDot ok={!!traffic} label="TFC" />
            <FeedDot ok={!!quakes} label="QKE" />
            <FeedDot ok={!!rivers} label="FLD" />
            <FeedDot ok={!!disasters} label="DIS" />
            <FeedDot ok={!!commodities} label="AGR" />
          </div>

          {/* Sync status */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-0.5">
              <div className={`w-[6px] h-[6px] rounded-full ${anyRefreshing ? "bg-[var(--safe,#22c55e)] animate-pulse" : "bg-white/20"}`} />
              <span className="text-[7px] font-black uppercase tracking-wider opacity-40">
                {anyRefreshing ? "SYNCING" : "LIVE"}
              </span>
            </div>
            <div className="text-[9px] tabular-nums opacity-50 leading-none">
              {timeAgo(latestRefresh)}
            </div>
            <div className="text-[6px] font-black uppercase tracking-wider opacity-20 mt-0.5">
              {activeFeedCount}/5 feeds
            </div>
          </div>

          {/* Manual refresh button */}
          <button
            onClick={refreshAll}
            title="Refresh all data feeds immediately"
            className={`h-[36px] w-[36px] flex items-center justify-center border border-white/15 hover:border-white/40 hover:bg-white/5 transition-all ${anyRefreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw size={12} className="opacity-40" />
          </button>
        </div>
      </div>
    </section>
  );
}
