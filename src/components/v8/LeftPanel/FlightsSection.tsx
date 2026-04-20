"use client";

import { useEffect, useMemo, useState } from "react";

interface Flight {
  icao24: string;
  callsign: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  origin_country: string;
  on_ground: boolean;
}

const COUNTRY_COLORS: Record<string, { accent: string; label: string }> = {
  Thailand: { accent: "#d4af37", label: "TH" },
  Malaysia: { accent: "#7c3aed", label: "MY" },
  Myanmar: { accent: "#d97706", label: "MM" },
  Cambodia: { accent: "#0891b2", label: "KH" },
  Singapore: { accent: "#dc2626", label: "SG" },
  Indonesia: { accent: "#059669", label: "ID" },
  Vietnam: { accent: "#be185d", label: "VN" },
  Laos: { accent: "#ca8a04", label: "LA" },
};

const TARGET_COUNTRIES = ["Thailand", "Malaysia", "Myanmar", "Cambodia"];

export default function FlightsSection({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/flights", { cache: "no-store" });
        const data = await r.json();
        if (alive && Array.isArray(data)) {
          setFlights(data);
          setFetchedAt(new Date());
        }
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    const byCountry: Record<string, number> = {};
    let total = 0;
    for (const f of flights) {
      if (f.on_ground) continue;
      byCountry[f.origin_country] = (byCountry[f.origin_country] ?? 0) + 1;
      total++;
    }
    return { byCountry, total };
  }, [flights]);

  const timeWindow = useMemo(() => {
    if (!fetchedAt) return "";
    const now = fetchedAt;
    const hourBefore = new Date(now.getTime() - 60 * 60 * 1000);
    const hourAfter = new Date(now.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
    return `${fmt(hourBefore)} - ${fmt(hourAfter)} ICT`;
  }, [fetchedAt]);

  const maxCount = Math.max(
    ...TARGET_COUNTRIES.map((c) => stats.byCountry[c] ?? 0),
    1,
  );

  const topFlights = useMemo(() => {
    return flights
      .filter((f) => !f.on_ground && TARGET_COUNTRIES.includes(f.origin_country))
      .slice(0, 10);
  }, [flights]);

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
        <div className="rams-label">FLIGHTS · {stats.total}</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "-" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {/* Time window */}
          {timeWindow && (
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--line)",
                fontSize: 10,
                color: "var(--ink-muted)",
                letterSpacing: "0.04em",
              }}
            >
              WINDOW · {timeWindow}
            </div>
          )}

          {/* Country distribution */}
          {stats.total > 0 && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
              <div
                className="rams-label"
                style={{ fontSize: 9, marginBottom: 8, color: "var(--ink-muted)" }}
              >
                AIRSPACE · BY ORIGIN
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {TARGET_COUNTRIES.map((country) => {
                  const count = stats.byCountry[country] ?? 0;
                  const color = COUNTRY_COLORS[country] ?? { accent: "#737373", label: "--" };
                  const pct = (count / maxCount) * 100;
                  return (
                    <div
                      key={country}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top flights list */}
          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>Loading...</div>
          ) : topFlights.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
              No active flights
            </div>
          ) : (
            <div>
              <div
                className="rams-label"
                style={{
                  fontSize: 9,
                  padding: "10px 12px 6px",
                  color: "var(--ink-muted)",
                }}
              >
                ACTIVE CALLSIGNS
              </div>
              {topFlights.map((f) => {
                const color = COUNTRY_COLORS[f.origin_country] ?? { accent: "#737373", label: "--" };
                return (
                  <div
                    key={f.icao24}
                    style={{
                      padding: "8px 12px",
                      borderTop: "1px solid var(--line-faint)",
                      borderLeft: `3px solid ${color.accent}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rams-value" style={{ fontSize: 11 }}>
                        {f.callsign || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: color.accent,
                          letterSpacing: "0.06em",
                          marginTop: 2,
                        }}
                      >
                        {f.origin_country}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--ink-muted)",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Math.round(f.altitude)}m
                      <br />
                      {Math.round(f.velocity * 3.6)} km/h
                    </div>
                  </div>
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
            OpenSky Network · live ADS-B
          </div>
        </div>
      )}
    </div>
  );
}
