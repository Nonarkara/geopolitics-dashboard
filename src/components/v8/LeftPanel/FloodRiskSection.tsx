"use client";

import { useEffect, useState } from "react";
import { BORDER_COLORS } from "../../../lib/news-classifier";

type BorderId = "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier";

interface River {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentDischarge: number;
  forecastPeak: number;
  forecastPeakDate: string;
  trend: "rising" | "falling" | "stable";
  riskLevel: "low" | "moderate" | "high" | "critical";
}

const RIVER_TO_BORDER: Record<string, BorderId> = {
  moei: "myanmar-frontier",
  "mekong-chiangsaen": "cambodia-frontier",
  "mekong-nongkhai": "cambodia-frontier",
  "mekong-mukdahan": "cambodia-frontier",
  kolok: "malaysia-frontier",
  "sai-burin": "malaysia-frontier",
};

const RISK_COLOR: Record<River["riskLevel"], string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  moderate: "#eab308",
  low: "#22c55e",
};

const TREND_ARROW: Record<River["trend"], string> = {
  rising: "↑",
  falling: "↓",
  stable: "→",
};

export default function FloodRiskSection({
  expanded,
  onToggle,
  onFocusBorder,
}: {
  expanded: boolean;
  onToggle: () => void;
  onFocusBorder?: (id: BorderId) => void;
}) {
  const [rivers, setRivers] = useState<River[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/border/flood-risk", { cache: "no-store" });
        const j = await r.json();
        if (alive) setRivers(Array.isArray(j) ? j : []);
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 900_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const highest = rivers.reduce<River["riskLevel"]>((acc, r) => {
    const order: Record<River["riskLevel"], number> = { low: 0, moderate: 1, high: 2, critical: 3 };
    return order[r.riskLevel] > order[acc] ? r.riskLevel : acc;
  }, "low");

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "12px",
          background: "transparent",
          border: "none",
          borderBottom: expanded ? "1px solid var(--line)" : "none",
          color: "var(--ink)",
          cursor: "pointer",
          transition: "background 0.12s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="rams-label">FLOOD RISK · {rivers.length}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: RISK_COLOR[highest],
              letterSpacing: "0.08em",
              padding: "1px 4px",
              border: `1px solid ${RISK_COLOR[highest]}`,
              borderRadius: 2,
            }}
          >
            {highest.toUpperCase()}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{expanded ? "-" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div>
          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>Loading...</div>
          ) : rivers.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>No river data</div>
          ) : (
            <div>
              {rivers.map((r) => {
                const border = RIVER_TO_BORDER[r.id];
                const color = border ? BORDER_COLORS[border] : BORDER_COLORS.unknown;
                const riskColor = RISK_COLOR[r.riskLevel];
                return (
                  <button
                    key={r.id}
                    onClick={() => border && onFocusBorder?.(border)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 12px",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "1px solid var(--line)",
                      borderLeft: `3px solid ${color.accent}`,
                      background: "transparent",
                      textAlign: "left",
                      cursor: border && onFocusBorder ? "pointer" : "default",
                      color: "var(--ink)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: color.accent,
                          letterSpacing: "0.08em",
                          padding: "1px 4px",
                          border: `1px solid ${color.accent}`,
                          borderRadius: 2,
                        }}
                      >
                        {color.label}
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: riskColor,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {r.riskLevel.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ink-muted)", marginLeft: "auto" }}>
                        {TREND_ARROW[r.trend]}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{r.name}</div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 10,
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span>
                        now{" "}
                        <span className="rams-value" style={{ fontSize: 10 }}>
                          {r.currentDischarge} m³/s
                        </span>
                      </span>
                      <span>
                        peak{" "}
                        <span className="rams-value" style={{ fontSize: 10 }}>
                          {r.forecastPeak} m³/s
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div
            style={{
              padding: "8px 12px",
              fontSize: 9,
              color: "var(--ink-muted)",
              letterSpacing: "0.04em",
              borderTop: "1px solid var(--line)",
            }}
          >
            Open-Meteo · ±7-day discharge forecast
          </div>
        </div>
      )}
    </div>
  );
}
