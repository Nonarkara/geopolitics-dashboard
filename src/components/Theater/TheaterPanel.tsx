"use client";

import type { BorderAreaStatus } from "../../types/dashboard";
import type { BorderAreaId } from "../../lib/border-regions";
import GlassCard from "../Common/GlassCard";
import TheaterMiniMap from "./TheaterMiniMap";
import TheaterEscalationGauge from "./TheaterEscalationGauge";
import TheaterSentimentChart from "./TheaterSentimentChart";
import { AlertTriangle, Shield, TrendingUp, Flame, Users } from "lucide-react";

const THEATER_ACCENTS: Record<BorderAreaId, string> = {
  "myanmar-frontier": "#ef4444",
  "cambodia-frontier": "#f59e0b",
  "deep-south": "#e11d48",
  "malaysia-frontier": "#22c55e",
};

const THEATER_ICONS: Record<BorderAreaId, React.ReactNode> = {
  "myanmar-frontier": <AlertTriangle size={14} />,
  "cambodia-frontier": <Shield size={14} />,
  "deep-south": <Flame size={14} />,
  "malaysia-frontier": <TrendingUp size={14} />,
};

function posturePill(posture: string, color: string) {
  const bg =
    posture === "priority"
      ? "rgba(239,68,68,0.15)"
      : posture === "watch"
        ? "rgba(245,158,11,0.15)"
        : "rgba(34,197,94,0.15)";
  const border =
    posture === "priority"
      ? "rgba(239,68,68,0.3)"
      : posture === "watch"
        ? "rgba(245,158,11,0.3)"
        : "rgba(34,197,94,0.3)";

  return (
    <span
      className="text-[12px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {posture}
    </span>
  );
}

interface TheaterPanelProps {
  theaterId: BorderAreaId;
  areaStatus: BorderAreaStatus | null;
  onFlyTo?: () => void;
}

export default function TheaterPanel({
  theaterId,
  areaStatus,
  onFlyTo,
}: TheaterPanelProps) {
  const accent = THEATER_ACCENTS[theaterId];
  const icon = THEATER_ICONS[theaterId];
  const status = areaStatus;

  const label = status?.label ?? theaterId.replace(/-/g, " ");
  const posture = status?.posture ?? "stable";
  const score = status?.score ?? 0;

  return (
    <GlassCard
      title={label}
      icon={icon}
      accentColor={accent}
      statusLabel={posture === "priority" ? "ALERT" : posture === "watch" ? "WATCH" : "STABLE"}
      className="h-full"
    >
      <div className="flex flex-col gap-2 p-2">
        {/* Top row: mini-map + gauge/sentiment */}
        <div className="flex gap-2">
          {/* Mini-map */}
          <div
            className="w-[45%] shrink-0 cursor-pointer"
            onClick={onFlyTo}
            title={`Fly to ${label}`}
          >
            <TheaterMiniMap theaterId={theaterId} accentColor={accent} />
          </div>

          {/* Right side: gauge + sentiment */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between">
              <TheaterEscalationGauge score={score} label={posture} />
              {posturePill(posture, accent)}
            </div>
            <TheaterSentimentChart
              theaterId={theaterId}
              accentColor={accent}
            />
          </div>
        </div>

        {/* Summary */}
        {status?.summary && (
          <p className="text-[13px] text-white/50 leading-tight line-clamp-2">
            {status.summary}
          </p>
        )}

        {/* Key metrics row */}
        <div className="flex gap-1.5 flex-wrap">
          <MetricChip
            icon={<AlertTriangle size={12} />}
            label="Incidents"
            value={status?.incidentCount ?? 0}
            color={accent}
          />
          <MetricChip
            icon={<Flame size={12} />}
            label="Fatalities"
            value={status?.fatalityCount ?? 0}
            color={
              (status?.fatalityCount ?? 0) > 0 ? "#ef4444" : "rgba(255,255,255,0.3)"
            }
          />
          <MetricChip
            icon={<Users size={12} />}
            label="Cameras"
            value={`${status?.verifiedCameras ?? 0}/${status?.candidateCameras ?? 0}`}
            color="rgba(255,255,255,0.3)"
          />
        </div>

        {/* Watchpoints */}
        {status?.watchpoints && status.watchpoints.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {status.watchpoints.slice(0, 2).map((wp, i) => (
              <div
                key={i}
                className="flex items-start gap-1 text-[12px] text-white/35 leading-tight"
              >
                <div
                  className="mt-1 h-1 w-1 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                <span className="line-clamp-1">{wp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function MetricChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[12px] font-mono"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color,
      }}
    >
      {icon}
      <span className="text-white/40">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
