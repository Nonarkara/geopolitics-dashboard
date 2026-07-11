"use client";

import { useEffect, useMemo, useState } from "react";
import { BORDER_COLORS } from "../../../lib/news-classifier";

type BorderId = "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier";

const BORDER_CENTROIDS: Record<BorderId, { lat: number; lng: number }> = {
  "myanmar-frontier": { lat: 17.0, lng: 98.5 },
  "cambodia-frontier": { lat: 13.8, lng: 102.6 },
  "malaysia-frontier": { lat: 6.6, lng: 100.4 },
};

interface Disaster {
  id: string;
  title: string;
  type: string;
  alertLevel: string;
  lat: number;
  lng: number;
  date: string;
  source: string;
}

interface Seismic {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lng: number;
  depth: number;
  time: string;
  url: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  severity: "alert" | "watch" | "stable";
  lat: number;
  lng: number;
  when: string;
  border: BorderId;
  href?: string;
}

function nearestBorder(lat: number, lng: number): BorderId {
  let best: BorderId = "myanmar-frontier";
  let bestDist = Infinity;
  for (const id of Object.keys(BORDER_CENTROIDS) as BorderId[]) {
    const c = BORDER_CENTROIDS[id];
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

function alertLevelToSeverity(level: string): Event["severity"] {
  if (level === "Red") return "alert";
  if (level === "Orange") return "watch";
  return "stable";
}

function magnitudeToSeverity(m: number): Event["severity"] {
  if (m >= 5) return "alert";
  if (m >= 4) return "watch";
  return "stable";
}

const SEV_COLOR: Record<Event["severity"], string> = {
  alert: "#ef4444",
  watch: "#f59e0b",
  stable: "#737373",
};

export default function DisastersSection({
  expanded,
  onToggle,
  onFocusBorder,
}: {
  expanded: boolean;
  onToggle: () => void;
  onFocusBorder?: (id: BorderId) => void;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [dRes, qRes] = await Promise.all([
          fetch("/api/border/disasters", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/border/earthquakes", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        ]);
        const disasters: Disaster[] = Array.isArray(dRes) ? dRes : [];
        const quakes: Seismic[] = Array.isArray(qRes) ? qRes : [];

        const merged: Event[] = [
          ...disasters.map((d): Event => ({
            id: d.id,
            title: d.title,
            type: d.type,
            severity: alertLevelToSeverity(d.alertLevel),
            lat: d.lat,
            lng: d.lng,
            when: d.date,
            border: nearestBorder(d.lat, d.lng),
          })),
          ...quakes.map((q): Event => ({
            id: q.id,
            title: `M${q.magnitude.toFixed(1)} · ${q.place}`,
            type: "Earthquake",
            severity: magnitudeToSeverity(q.magnitude),
            lat: q.lat,
            lng: q.lng,
            when: q.time,
            border: nearestBorder(q.lat, q.lng),
            href: q.url,
          })),
        ];
        merged.sort((a, b) => (b.when || "").localeCompare(a.when || ""));
        if (alive) setEvents(merged);
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 600_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const distribution = useMemo(() => {
    const d: Record<BorderId, number> = {
      "myanmar-frontier": 0,
      "cambodia-frontier": 0,
      "malaysia-frontier": 0,
    };
    for (const e of events) d[e.border]++;
    return d;
  }, [events]);

  const maxCount = Math.max(
    distribution["myanmar-frontier"],
    distribution["cambodia-frontier"],
    distribution["malaysia-frontier"],
    1,
  );

  const recent = events.slice(0, 6);

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
        <div className="rams-label">DISASTERS · {events.length}</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {events.length > 0 && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
              <div
                className="rams-label"
                style={{ fontSize: 9, marginBottom: 8, color: "var(--ink-muted)" }}
              >
                BY NEAREST FRONTIER
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.keys(BORDER_CENTROIDS) as BorderId[]).map((b) => {
                  const count = distribution[b];
                  const pct = (count / maxCount) * 100;
                  const color = BORDER_COLORS[b];
                  return (
                    <button
                      key={b}
                      onClick={() => onFocusBorder?.(b)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: onFocusBorder ? "pointer" : "default",
                        color: "var(--ink)",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: color.accent,
                          width: 20,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {color.label}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "var(--line-faint)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: color.accent,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        className="rams-value"
                        style={{ fontSize: 11, minWidth: 22, textAlign: "right" }}
                      >
                        {count}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>Loading...</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
              No disasters in last 30 days
            </div>
          ) : (
            <div>
              {recent.map((e) => {
                const color = BORDER_COLORS[e.border];
                const content = (
                  <>
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
                          color: SEV_COLOR[e.severity],
                          letterSpacing: "0.08em",
                        }}
                      >
                        {e.type.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{e.title}</div>
                    <div className="rams-label" style={{ fontSize: 9, color: "var(--ink-muted)" }}>
                      {e.when ? new Date(e.when).toLocaleDateString("en-GB") : "—"}
                    </div>
                  </>
                );
                const style: React.CSSProperties = {
                  display: "block",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--line)",
                  borderLeft: `3px solid ${color.accent}`,
                  textDecoration: "none",
                  color: "var(--ink)",
                  fontSize: 12,
                  background: "transparent",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                };
                return e.href ? (
                  <a
                    key={e.id}
                    href={e.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onFocusBorder?.(e.border)}
                    style={style}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    key={e.id}
                    onClick={() => onFocusBorder?.(e.border)}
                    style={{ ...style, border: "none", borderLeft: `3px solid ${color.accent}` }}
                  >
                    {content}
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
            }}
          >
            GDACS · USGS · last 30 days
          </div>
        </div>
      )}
    </div>
  );
}
