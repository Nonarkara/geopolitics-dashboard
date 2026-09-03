"use client";

import type { Provenance } from "./ProvenanceModal";

export interface MiniChartProps {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  series?: number[];
  bar?: { pct: number; accent?: boolean }[];
  source: string;
  provenance: Provenance;
  onOpen: (p: Provenance) => void;
  status?: "live" | "stale" | "error";
}

function Sparkline({ series }: { series: number[] }) {
  if (!series.length) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const W = 300;
  const H = 36;
  const step = series.length > 1 ? W / (series.length - 1) : W;
  const pts = series
    .map((v, i) => `${(i * step).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`)
    .join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="var(--ink-dim)" strokeWidth="1.25" />
    </svg>
  );
}

function BarSet({ bars }: { bars: { pct: number; accent?: boolean }[] }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(4, Math.min(100, b.pct))}%`,
            background: b.accent ? "var(--accent)" : "var(--ink-dim)",
          }}
        />
      ))}
    </div>
  );
}

export default function MiniChart({
  label,
  value,
  delta,
  deltaUp,
  series,
  bar,
  source,
  provenance,
  onOpen,
  status = "live",
}: MiniChartProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(provenance)}
      className="rams-panel"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 0,
        cursor: "pointer",
        background: "var(--bg-panel)",
        color: "var(--ink)",
      }}
    >
      <div className="rams-panel-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={status === "live" ? "rams-tick rams-tick-ok" : "rams-tick"}
            style={{ background: status === "error" ? "var(--accent)" : status === "stale" ? "var(--warn)" : "var(--ok)" }}
          />
          <div className="rams-label">{label}</div>
        </div>
        <div className="rams-label" style={{ fontSize: 9, color: "var(--ink-muted)" }}>Click → source</div>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div className="rams-value" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>
            {value}
          </div>
          {delta && (
            <div
              className="rams-value"
              style={{
                fontSize: 11,
                color: deltaUp ? "var(--ok)" : "var(--accent)",
              }}
            >
              {deltaUp ? "\u2197" : "\u2198"} {delta}
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          {bar ? <BarSet bars={bar} /> : series ? <Sparkline series={series} /> : null}
        </div>

        <div className="rams-label" style={{ fontSize: 9, marginTop: 8, color: "var(--ink-muted)" }}>
          {source}
        </div>
      </div>
    </button>
  );
}
