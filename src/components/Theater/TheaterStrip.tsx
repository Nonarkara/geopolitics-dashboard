"use client";

import type { BorderAreaStatus } from "../../types/dashboard";
import type { BorderAreaId } from "../../lib/border-regions";
import TheaterMiniMap from "./TheaterMiniMap";
import TheaterEscalationGauge from "./TheaterEscalationGauge";
import { AlertTriangle, Flame, Shield, TrendingUp } from "lucide-react";

/**
 * TheaterStrip — A vertical strip of 4 compact theater views for the right
 * side of the V4.3.0-style layout. Uses the connected-grid sharp-corner
 * aesthetic, no glassmorphic cards.
 */

const THEATER_ORDER: BorderAreaId[] = [
  "myanmar-frontier",
  "cambodia-frontier",
  "deep-south",
  "malaysia-frontier",
];

const THEATER_META: Record<BorderAreaId, { icon: React.ReactNode; accent: string; short: string }> = {
  "myanmar-frontier": { icon: <AlertTriangle size={10} />, accent: "var(--accent)", short: "MYANMAR" },
  "cambodia-frontier": { icon: <Shield size={10} />, accent: "var(--hazard)", short: "CAMBODIA" },
  "deep-south": { icon: <Flame size={10} />, accent: "#e11d48", short: "DEEP SOUTH" },
  "malaysia-frontier": { icon: <TrendingUp size={10} />, accent: "var(--safe)", short: "MALAYSIA" },
};

function postureColor(posture: string) {
  if (posture === "priority") return "var(--accent)";
  if (posture === "watch") return "var(--hazard)";
  return "var(--safe)";
}

interface TheaterStripProps {
  areas: BorderAreaStatus[];
  onFlyTo?: (theaterId: BorderAreaId) => void;
}

export default function TheaterStrip({ areas, onFlyTo }: TheaterStripProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="grid-cell shrink-0 px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
            Theater Recon
          </span>
        </div>
        <div className="text-[7px] font-mono uppercase tracking-[0.12em] text-white/25 mt-0.5">
          Live split-screen — 4 operational theaters
        </div>
      </div>

      {/* Theater cards */}
      {THEATER_ORDER.map((theaterId) => {
        const area = areas.find((a) => a.id === theaterId);
        const meta = THEATER_META[theaterId];
        const posture = area?.posture ?? "stable";
        const score = area?.score ?? 0;
        const color = postureColor(posture);

        return (
          <div
            key={theaterId}
            className="grid-cell shrink-0 border-b border-white/6 cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={() => onFlyTo?.(theaterId)}
            title={`Fly to ${meta.short}`}
          >
            <div className="flex gap-2 p-2">
              {/* Mini-map */}
              <div className="w-[120px] shrink-0">
                <TheaterMiniMap theaterId={theaterId} accentColor={meta.accent} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: meta.accent }}>{meta.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                        {meta.short}
                      </span>
                    </div>
                    <span
                      className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5"
                      style={{
                        color,
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                      }}
                    >
                      {posture}
                    </span>
                  </div>

                  {/* Score gauge inline */}
                  <div className="flex items-center gap-2 mb-1">
                    <TheaterEscalationGauge score={score} compact />
                    <span className="text-[7px] font-mono text-white/30">
                      {score}/100
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex gap-2 text-[7px] font-mono">
                  <span className="text-white/30">
                    <span style={{ color: (area?.incidentCount ?? 0) > 0 ? "var(--accent)" : "var(--safe)" }} className="font-bold">
                      {area?.incidentCount ?? 0}
                    </span>{" "}
                    inc
                  </span>
                  <span className="text-white/30">
                    <span style={{ color: (area?.fatalityCount ?? 0) > 0 ? "var(--accent)" : "var(--safe)" }} className="font-bold">
                      {area?.fatalityCount ?? 0}
                    </span>{" "}
                    fat
                  </span>
                  <span className="text-white/30">
                    <span className="text-white/50 font-bold">{area?.verifiedCameras ?? 0}</span>/{area?.candidateCameras ?? 0} cam
                  </span>
                </div>

                {/* First watchpoint */}
                {area?.watchpoints?.[0] && (
                  <div className="text-[7px] text-white/25 leading-tight mt-1 line-clamp-1">
                    {area.watchpoints[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
