"use client";

import { useEffect, useState } from "react";
import { BORDER_COLORS } from "../../../lib/news-classifier";

type BorderId = "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier";

interface TonePoint {
  date: string;
  tone: number;
  articleCount: number;
}

interface TheaterData {
  id: BorderId;
  timeline: TonePoint[];
  source: string;
}

const THEATERS: BorderId[] = ["myanmar-frontier", "cambodia-frontier", "malaysia-frontier"];

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) {
    return (
      <div style={{ flex: 1, height: 28, background: "var(--line-faint)" }} />
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ flex: 1, height: 28, display: "block" }}
    >
      <path d={d} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

export default function SentimentSection({
  expanded,
  onToggle,
  onFocusBorder,
}: {
  expanded: boolean;
  onToggle: () => void;
  onFocusBorder?: (id: BorderId) => void;
}) {
  const [data, setData] = useState<TheaterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const results = await Promise.all(
          THEATERS.map(async (t) => {
            const r = await fetch(`/api/border/sentiment?theater=${t}`, { cache: "no-store" });
            const j = await r.json();
            return {
              id: t,
              timeline: Array.isArray(j?.timeline) ? (j.timeline as TonePoint[]) : [],
              source: j?.source ?? "fallback",
            };
          }),
        );
        if (alive) setData(results);
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 300_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

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
        <div className="rams-label">SENTIMENT · 14D TONE</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>Loading...</div>
          ) : (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
              {data.map((d) => {
                const color = BORDER_COLORS[d.id];
                const points = d.timeline.map((p) => p.tone);
                const current = points[points.length - 1] ?? 0;
                const first = points[0] ?? 0;
                const delta = current - first;
                const arrow = delta > 0.2 ? "↑" : delta < -0.2 ? "↓" : "→";
                const arrowColor = delta > 0.2 ? "#22c55e" : delta < -0.2 ? "#ef4444" : "var(--ink-muted)";
                return (
                  <button
                    key={d.id}
                    onClick={() => onFocusBorder?.(d.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: onFocusBorder ? "pointer" : "default",
                      color: "var(--ink)",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                    title={`Focus ${color.label} border on map`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: color.accent,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {color.label}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>
                        tone{" "}
                        <span className="rams-value" style={{ fontSize: 10 }}>
                          {current.toFixed(2)}
                        </span>{" "}
                        <span style={{ color: arrowColor, fontWeight: 700 }}>{arrow}</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkline points={points} color={color.accent} />
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
            GDELT · 14-day article tone
          </div>
        </div>
      )}
    </div>
  );
}
