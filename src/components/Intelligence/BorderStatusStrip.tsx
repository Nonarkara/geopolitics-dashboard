"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedNumber from "../Common/AnimatedNumber";
import type {
  BorderAreaStatus,
  BorderCommandBrief,
  ScoreBreakdown,
  TrafficIncident,
} from "../../types/dashboard";
import { FreshnessDot } from "../Common/ProvenanceBadge";
import Sparkline from "../Common/Sparkline";
import type { CommodityPrice } from "../../app/api/border/commodities/route";
import type { RiverDischarge } from "../../app/api/border/flood-risk/route";
import type { SeismicEvent } from "../../app/api/border/earthquakes/route";
import type { RegionalDisaster } from "../../app/api/border/disasters/route";
import { useFetch, type UseFetchResult } from "../../hooks/useFetch";
import { useNow } from "../../hooks/useNow";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { DATA_SOURCE_CATALOG } from "../../lib/data-sources";
import { formatBangkokDayLabel } from "../../lib/time-window";

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

function buildMicroNarrative(area: BorderAreaStatus): string | null {
  const { score, posture, scoreBreakdown } = area;
  if (!scoreBreakdown) return null;
  const sorted = [...scoreBreakdown.contributions].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );
  const top = sorted.slice(0, 2);
  const parts = top.map(
    (c) => `${c.factor} (${c.contribution > 0 ? "+" : ""}${c.contribution.toFixed(1)})`,
  );
  return `Score ${score} (${posture}) — base ${scoreBreakdown.baseScore} + ${parts.join(" + ")}. Clamped from ${scoreBreakdown.rawTotal.toFixed(0)} to ${scoreBreakdown.clampedScore}.`;
}

function ScoreBar({ area, expanded, onToggle, history }: {
  area: BorderAreaStatus;
  expanded: boolean;
  onToggle: () => void;
  history?: number[];
}) {
  const { label, counterpart, score, posture, scoreBreakdown } = area;
  const color = postureColor(posture);
  const [hovered, setHovered] = useState(false);
  const escalationRatio = scoreBreakdown
    ? scoreBreakdown.baseScore > 0
      ? +(scoreBreakdown.rawTotal / scoreBreakdown.baseScore).toFixed(1)
      : null
    : null;
  const microNarrative = hovered && scoreBreakdown && !expanded ? buildMicroNarrative(area) : null;

  return (
    <div className="relative">
      <AnimatePresence>
        {microNarrative && (
          <motion.div
            key="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-[280px] bg-[#0a0a0a] border border-white/15 rounded-sm px-3 py-2 shadow-xl pointer-events-none"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-[8px] font-mono leading-relaxed text-white/80">
              {microNarrative}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/15" />
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-white/[0.03] transition-colors rounded-sm -mx-1 px-1"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        aria-expanded={expanded}
        aria-label={`${label} score ${score} — click to ${expanded ? "collapse" : "expand"} breakdown`}
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
            <span className="text-[7px] font-black tabular-nums flex items-center gap-1" style={{ color: score > 60 ? '#000' : color }}>
              <AnimatedNumber value={score} format={(n) => Math.round(n).toString()} />
              {posture === "priority" && (
                <span className="inline-block w-[5px] h-[5px] rounded-full bg-red-500 animate-pulse" />
              )}
              {escalationRatio !== null && escalationRatio > 1 && (
                <span className="text-[6px] font-black tabular-nums opacity-60">{escalationRatio}x</span>
              )}
            </span>
          </div>
        </div>
        <div
          className="text-[7px] font-black uppercase w-[52px] text-center py-0.5 rounded-sm shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
        >
          {posture}
        </div>
        {history && history.length > 2 && (
          <Sparkline data={history} width={36} height={10} color={color} fillOpacity={0.2} />
        )}
      </div>

      {/* Inline expanded breakdown panel */}
      {expanded && scoreBreakdown && (
        <div className="mt-1 mb-0.5 bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2">
          <div className="text-[7px] font-black uppercase tracking-[0.25em] opacity-40 mb-1.5">SCORE BREAKDOWN — {label}</div>
          <div className="text-[8px] opacity-60 mb-0.5 tabular-nums">
            BASE: {scoreBreakdown.baseScore}
          </div>
          <div className="text-[6px] opacity-30 mb-2 leading-snug">{scoreBreakdown.baseScoreRationale}</div>
          {scoreBreakdown.contributions.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[8px] py-0.5 border-t border-white/5">
              <span className="opacity-60 uppercase">{c.factor}</span>
              <span className="tabular-nums opacity-80 flex items-center gap-1">
                <span>{c.rawValue} x {c.weight} = <span className="font-black">{c.contribution}</span></span>
                {c.sourceUrl ? (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 opacity-40 hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[6px] underline">{c.source}</span>
                    <ExternalLink size={7} />
                  </a>
                ) : (
                  <span className="text-[6px] opacity-30">{c.source}</span>
                )}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 mt-1 pt-1 flex justify-between text-[8px]">
            <span className="opacity-40 uppercase">TOTAL</span>
            <span className="font-black tabular-nums">
              {scoreBreakdown.rawTotal} {scoreBreakdown.rawTotal !== scoreBreakdown.clampedScore && `\u2192 ${scoreBreakdown.clampedScore}`} (max 96)
            </span>
          </div>
          <div className="text-[6px] opacity-20 mt-1 font-mono">{scoreBreakdown.formula}</div>
        </div>
      )}
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
          className="text-[7px] uppercase tracking-wider opacity-25 hover:opacity-60 underline transition-opacity leading-none mt-0.5 block"
          title={`${source.label} — refreshes every ${source.refreshInterval}`}
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
function timeAgo(date: Date | null, nowMs: number | null): string {
  if (!date) return "--";
  if (nowMs === null) return "--";
  const sec = Math.round((nowMs - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.round(min / 60)}h`;
}

/** 3-state feed health dot: green (fresh), amber (stale), red (error/no data) */
function FeedDot({ fetchResult, label, expectedIntervalMs, nowMs }: {
  fetchResult: UseFetchResult<unknown>;
  label: string;
  expectedIntervalMs: number;
  nowMs: number | null;
}) {
  const [showTip, setShowTip] = useState(false);

  const hasData = fetchResult.data !== null;
  const hasError = fetchResult.error !== null;
  const age =
    fetchResult.lastRefreshed && nowMs !== null
      ? nowMs - fetchResult.lastRefreshed.getTime()
      : Infinity;
  const isStale = age > expectedIntervalMs * 2;

  let dotColor = "bg-[var(--safe,#22c55e)]"; // fresh
  if (hasError || !hasData) dotColor = "bg-red-500";
  else if (isStale) dotColor = "bg-amber-500";

  return (
    <div
      className="relative flex items-center gap-1 cursor-default"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className={`w-[5px] h-[5px] rounded-full ${dotColor}`} />
      <span className="text-[5px] font-black uppercase tracking-wider opacity-30">{label}</span>
      {showTip && (
        <div className="absolute bottom-full left-0 mb-1 z-50 w-[180px] bg-black border border-white/20 px-2 py-1.5 pointer-events-none">
          <div className="text-[7px] font-black uppercase tracking-wider opacity-60 mb-1">{label}</div>
          <div className="text-[7px] opacity-50">
            Age: {timeAgo(fetchResult.lastRefreshed, nowMs)} | Fetches: {fetchResult.fetchCount} | Errors: {fetchResult.errorCount}
          </div>
          {fetchResult.error && (
            <div className="text-[7px] text-red-400 mt-0.5">Last error: {fetchResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Score breakdown hover tooltip */
function ScoreBreakdownTooltip({ breakdown, show }: { breakdown: ScoreBreakdown; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-[260px] bg-black border border-white/20 px-3 py-2.5 pointer-events-none">
      <div className="text-[7px] font-black uppercase tracking-[0.25em] opacity-40 mb-1.5">Score Breakdown</div>
      <div className="text-[8px] opacity-60 mb-1">
        BASE: {breakdown.baseScore}
      </div>
      <div className="text-[6px] opacity-30 mb-2 leading-snug">{breakdown.baseScoreRationale}</div>
      {breakdown.contributions.map((c, i) => (
        <div key={i} className="flex items-center justify-between text-[8px] py-0.5 border-t border-white/5">
          <span className="opacity-60">{c.factor}</span>
          <span className="tabular-nums opacity-80">
            {c.rawValue} x {c.weight} = <span className="font-black">{c.contribution}</span>
            {c.sourceUrl ? (
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[6px] opacity-40 underline">{c.source}</a>
            ) : (
              <span className="ml-1 text-[6px] opacity-30">{c.source}</span>
            )}
          </span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-1 pt-1 flex justify-between text-[8px]">
        <span className="opacity-40">TOTAL</span>
        <span className="font-black tabular-nums">
          {breakdown.rawTotal} {breakdown.rawTotal !== breakdown.clampedScore && `→ ${breakdown.clampedScore}`} (max 96)
        </span>
      </div>
      <div className="text-[6px] opacity-20 mt-1 font-mono">{breakdown.formula}</div>
    </div>
  );
}

export default function BorderStatusStrip({ brief }: { brief: BorderCommandBrief | null }) {
  const { buildUrl, isHistorical, timeWindow } = useTimeWindow();
  const nowMs = useNow(5_000);
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

  const anyRefreshing = commoditiesFetch.isRefreshing || riversFetch.isRefreshing || quakesFetch.isRefreshing || trafficFetch.isRefreshing || disastersFetch.isRefreshing;

  // Find the stalest feed
  const feedAges: { label: string; age: number }[] = [
    { label: "TFC", age: trafficFetch.lastRefreshed && nowMs !== null ? nowMs - trafficFetch.lastRefreshed.getTime() : Infinity },
    { label: "QKE", age: quakesFetch.lastRefreshed && nowMs !== null ? nowMs - quakesFetch.lastRefreshed.getTime() : Infinity },
    { label: "FLD", age: riversFetch.lastRefreshed && nowMs !== null ? nowMs - riversFetch.lastRefreshed.getTime() : Infinity },
    { label: "DIS", age: disastersFetch.lastRefreshed && nowMs !== null ? nowMs - disastersFetch.lastRefreshed.getTime() : Infinity },
    { label: "AGR", age: commoditiesFetch.lastRefreshed && nowMs !== null ? nowMs - commoditiesFetch.lastRefreshed.getTime() : Infinity },
  ];
  const stalest = feedAges.reduce((a, b) => (a.age > b.age ? a : b));
  const stalestLabel =
    stalest.age < Infinity && nowMs !== null
      ? `${stalest.label} ${timeAgo(new Date(nowMs - stalest.age), nowMs)}`
      : "--";

  const refreshAll = useCallback(() => {
    commoditiesFetch.refresh();
    riversFetch.refresh();
    quakesFetch.refresh();
    trafficFetch.refresh();
    disastersFetch.refresh();
  }, [commoditiesFetch, riversFetch, quakesFetch, trafficFetch, disastersFetch]);

  // Score breakdown hover state (overall posture badge)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Track which area's breakdown panel is expanded (null = none)
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);

  // Score history sparklines per area
  const [scoreHistory, setScoreHistory] = useState<Record<string, number[]>>({});
  useEffect(() => {
    if (!brief?.areas) return;
    Promise.all(
      brief.areas.map(async (area) => {
        try {
          const res = await fetch(buildUrl("/api/research/sparklines", {
            metric: `score:${area.id}`,
            days: 7,
          }));
          const data = (await res.json()) as { values: number[] };
          return [area.id, data.values ?? []] as const;
        } catch {
          return [area.id, []] as const;
        }
      }),
    ).then((results) => {
      const map: Record<string, number[]> = {};
      for (const [id, values] of results) map[id] = [...values];
      setScoreHistory(map);
    });
  }, [brief?.areas, buildUrl]);

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

  const highestRiskRiver = rivers?.slice().sort((a, b) => {
    const rank = (l: string) => l === "critical" ? 4 : l === "high" ? 3 : l === "moderate" ? 2 : 1;
    return rank(b.riskLevel) - rank(a.riskLevel);
  })[0];

  const strongestQuake = quakes?.slice().sort((a, b) => b.magnitude - a.magnitude)[0];
  const trafficAccidents = traffic?.filter(t => t.category === "accident").length ?? 0;
  const trafficJams = traffic?.filter(t => t.category === "trafficjam").length ?? 0;
  const redAlerts = disasters?.filter(d => d.alertLevel === "Red").length ?? 0;
  const orangeAlerts = disasters?.filter(d => d.alertLevel === "Orange").length ?? 0;
  const topCommodities = commodities?.slice(0, 3) ?? [];

  // Find the area with the highest score for score breakdown
  const topArea = brief.areas.length > 0
    ? brief.areas.reduce((a, b) => (a.score >= b.score ? a : b), brief.areas[0])
    : null;

  const activeFeedCount = [commodities, rivers, quakes, traffic, disasters].filter(Boolean).length;
  const totalErrors = trafficFetch.errorCount + quakesFetch.errorCount + riversFetch.errorCount + disastersFetch.errorCount + commoditiesFetch.errorCount;

  return (
    <section className="bg-[var(--bg)] border-t border-black shrink-0 px-4 py-2 relative z-40">
      <div className="max-w-[2200px] mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
        {isHistorical && timeWindow ? (
          <div className="shrink-0 border border-black bg-black px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/75">
            Playback {formatBangkokDayLabel(timeWindow.bangkokDay)} | hazard feeds remain live reference
          </div>
        ) : null}

        {/* Overall posture badge — hover for score breakdown */}
        <div
          className="shrink-0 flex flex-col items-center gap-0.5 relative cursor-default"
          onMouseEnter={() => setShowScoreBreakdown(true)}
          onMouseLeave={() => setShowScoreBreakdown(false)}
        >
          <div
            className="w-[44px] h-[44px] rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `color-mix(in srgb, ${postureColor(brief.overallPosture)} 15%, transparent)` }}
          >
            <span
              className="text-[18px] font-black tabular-nums"
              style={{ color: postureColor(brief.overallPosture) }}
            >
              <AnimatedNumber value={brief.overallScore} format={(n) => Math.round(n).toString()} />
            </span>
          </div>
          <div
            className="text-[6px] font-black uppercase tracking-widest"
            style={{ color: postureColor(brief.overallPosture) }}
          >
            {brief.overallPosture}
          </div>
          {topArea?.scoreBreakdown && (
            <ScoreBreakdownTooltip breakdown={topArea.scoreBreakdown} show={showScoreBreakdown} />
          )}
        </div>

        <Divider />

        {/* Area score bars */}
        <div className="flex flex-col gap-1 min-w-0 w-[340px] shrink-0">
          {brief.areas.map((area) => (
            <ScoreBar
              key={area.id}
              area={area}
              expanded={expandedAreaId === area.id}
              onToggle={() => setExpandedAreaId(prev => prev === area.id ? null : area.id)}
              history={scoreHistory[area.id]}
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

        {/* Traffic (Longdo) */}
        <div className="flex items-center gap-0 shrink-0">
          <Metric label="Traffic" value={traffic?.length ?? "--"} sub="incidents" sourceId="traffic" />
          <Metric label="Accidents" value={trafficAccidents} sub="active" color={trafficAccidents > 0 ? "var(--accent)" : undefined} sourceId="traffic" />
          <Metric label="Jams" value={trafficJams} sub="reported" sourceId="traffic" />
        </div>

        <Divider />

        {/* Seismic + Flood + Disasters */}
        <div className="flex items-center gap-0 shrink-0">
          {strongestQuake && (
            <Metric label="Max Quake" value={`M${strongestQuake.magnitude.toFixed(1)}`} sub="30d SE Asia"
              color={strongestQuake.magnitude >= 5 ? "var(--accent)" : strongestQuake.magnitude >= 4 ? "#f59e0b" : undefined}
              sourceId="earthquakes" />
          )}
          {highestRiskRiver && (
            <Metric label="River Risk" value={highestRiskRiver.riskLevel.toUpperCase()}
              sub={highestRiskRiver.name.split("(")[0].trim()}
              color={riskColorHex(highestRiskRiver.riskLevel)} sourceId="flood" />
          )}
          {disasters && disasters.length > 0 && (
            <Metric label="GDACS" value={disasters.length}
              sub={redAlerts > 0 ? `${redAlerts} red` : orangeAlerts > 0 ? `${orangeAlerts} orange` : "green"}
              color={redAlerts > 0 ? "var(--accent)" : orangeAlerts > 0 ? "#f59e0b" : undefined}
              sourceId="disasters" />
          )}
        </div>

        <Divider />

        {/* Commodity prices (NABC) */}
        <div className="flex items-center gap-0 shrink-0">
          {topCommodities.map((c) => (
            <Metric key={c.id} label={c.nameEn}
              value={typeof c.price === "number" && c.price > 100 ? c.price.toLocaleString("en-US") : c.price}
              sub={c.unit} sourceId="commodities" />
          ))}
        </div>

        <Divider />

        {/* ── Command Status + Refresh ────────────────── */}
        <div className="shrink-0 ml-auto flex items-center gap-3">
          {/* 3-state feed health dots */}
          <div className="flex flex-col gap-[3px]">
            <FeedDot fetchResult={trafficFetch as UseFetchResult<unknown>} label="TFC" expectedIntervalMs={120_000} nowMs={nowMs} />
            <FeedDot fetchResult={quakesFetch as UseFetchResult<unknown>} label="QKE" expectedIntervalMs={300_000} nowMs={nowMs} />
            <FeedDot fetchResult={riversFetch as UseFetchResult<unknown>} label="FLD" expectedIntervalMs={1800_000} nowMs={nowMs} />
            <FeedDot fetchResult={disastersFetch as UseFetchResult<unknown>} label="DIS" expectedIntervalMs={600_000} nowMs={nowMs} />
            <FeedDot fetchResult={commoditiesFetch as UseFetchResult<unknown>} label="AGR" expectedIntervalMs={3600_000} nowMs={nowMs} />
          </div>

          {/* Sync status */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-0.5">
              <FreshnessDot lastUpdated={brief?.generatedAt ?? null} staleAfterMs={600_000} offlineAfterMs={1200_000} />
              <div className={`w-[6px] h-[6px] rounded-full ${anyRefreshing ? "bg-[var(--safe,#22c55e)] animate-pulse" : totalErrors > 0 ? "bg-red-500" : "bg-white/20"}`} />
              <span className="text-[7px] font-black uppercase tracking-wider opacity-40">
                {isHistorical ? "PLAYBACK" : anyRefreshing ? "SYNCING" : "LIVE"}
              </span>
            </div>
            <div className="text-[8px] tabular-nums opacity-40 leading-none" title="Age of stalest feed">
              STALEST: {stalestLabel}
            </div>
            <div className="text-[6px] font-black uppercase tracking-wider opacity-20 mt-0.5">
              {activeFeedCount}/5 feeds {totalErrors > 0 ? `| ${totalErrors} err` : ""}
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
