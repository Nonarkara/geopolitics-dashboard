"use client";

import { useEffect, useMemo, useState } from "react";
import type { Incident } from "./BorderMap";

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  tags?: string[];
}

interface Fire {
  latitude: number;
  longitude: number;
  brightness: number;
  acq_date?: string;
  confidence?: string;
}

function hoursAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1 h ago";
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function km(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export default function IncidentModal({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [fires, setFires] = useState<Fire[]>([]);
  const [loading, setLoading] = useState(true);

  const coords = incident.geometry?.coordinates ?? [0, 0];
  const p = incident.properties ?? {};

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [newsRes, firesRes] = await Promise.all([
          fetch("/api/border/news", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ news: [] })),
          fetch("/api/fires", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        ]);
        if (!alive) return;
        setNews(Array.isArray(newsRes?.news) ? newsRes.news : []);
        setFires(Array.isArray(firesRes) ? firesRes : []);
      } catch {}
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Match relevant news by shared tokens in title/notes/location
  const relevantNews = useMemo(() => {
    if (!news.length) return [];
    const haystack = new Set([
      ...tokenize(p.title || ""),
      ...tokenize(p.notes || ""),
      ...tokenize(p.location || ""),
    ]);
    // High-value tokens (include even if short)
    const locationWords = (p.location || "").toLowerCase().split(/[\s\/]+/).filter((w) => w.length > 2);
    for (const w of locationWords) haystack.add(w);

    const scored = news.map((n) => {
      const tokens = new Set([...tokenize(n.title || ""), ...tokenize(n.summary || "")]);
      let score = 0;
      for (const t of tokens) if (haystack.has(t)) score += 1;
      // Tag match boost
      if (n.tags && n.tags.length) {
        for (const tag of n.tags) {
          const tagTokens = tokenize(tag);
          for (const t of tagTokens) if (haystack.has(t)) score += 2;
        }
      }
      return { item: n, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.item);
  }, [news, p.title, p.notes, p.location]);

  // Fires within 50km of incident
  const nearbyFires = useMemo(() => {
    const [lng, lat] = coords;
    if (!lng || !lat || !fires.length) return [];
    return fires
      .map((f) => ({
        ...f,
        distKm: km([lng, lat], [f.longitude, f.latitude]),
      }))
      .filter((f) => f.distKm <= 50)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 8);
  }, [fires, coords]);

  const posture: "critical" | "active" | "monitoring" =
    (p.fatalities ?? 0) >= 3 ? "critical" : (p.fatalities ?? 0) > 0 ? "active" : "monitoring";
  const postureColor =
    posture === "critical" ? "var(--accent)" : posture === "active" ? "var(--warn)" : "var(--ok)";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(820px, 100%)",
          maxHeight: "88vh",
          background: "var(--bg-panel)",
          border: "1px solid var(--line-bright)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              className="rams-tick"
              style={{ background: postureColor, width: 8, height: 8 }}
            />
            <div className="rams-label" style={{ color: postureColor }}>
              {posture}
            </div>
            <div className="rams-label">{p.type ?? "Event"}</div>
            <div className="rams-label" style={{ color: "var(--ink-muted)" }}>
              · {incident.id}
            </div>
          </div>
          <button className="rams-btn" onClick={onClose}>Close · Esc</button>
        </div>

        {/* Body */}
        <div style={{ overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Title + narrative */}
          <section>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>
              {p.title}
            </div>
            {p.notes && (
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-dim)",
                  lineHeight: 1.55,
                  marginTop: 8,
                }}
              >
                {p.notes}
              </div>
            )}
          </section>

          {/* Stat strip */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              background: "var(--line)",
              border: "1px solid var(--line)",
            }}
          >
            <Stat label="Fatalities" value={(p.fatalities ?? 0).toString()} accent={(p.fatalities ?? 0) > 0} />
            <Stat label="Location" value={p.location || "—"} />
            <Stat label="Captured" value={hoursAgo(p.eventDate)} />
            <Stat
              label="Coordinates"
              value={
                coords[0] && coords[1]
                  ? `${coords[1].toFixed(3)}°, ${coords[0].toFixed(3)}°`
                  : "—"
              }
            />
          </section>

          {/* Related news */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className="rams-label">Related coverage</div>
              <div className="rams-label" style={{ color: "var(--ink-muted)" }}>
                {loading ? "searching…" : `${relevantNews.length} item${relevantNews.length === 1 ? "" : "s"}`}
              </div>
            </div>
            <div
              style={{
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {relevantNews.length === 0 && !loading && (
                <div style={{ padding: 14, color: "var(--ink-muted)", fontSize: 13 }}>
                  No directly matching news items in the current feed. This incident is being tracked
                  from the ACLED event stream. Try searching {p.location || "the area"} on news.google.com
                  or checking the border news desk.
                </div>
              )}
              {relevantNews.map((n) => (
                <a
                  key={n.id}
                  href={n.sourceUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--line)",
                    textDecoration: "none",
                    color: "var(--ink)",
                    background: "var(--bg-panel)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{n.title}</div>
                  {n.summary && (
                    <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.4 }}>
                      {n.summary}
                    </div>
                  )}
                  <div
                    className="rams-label"
                    style={{ fontSize: 10, color: "var(--ink-muted)", marginTop: 2 }}
                  >
                    {n.source} {n.publishedAt ? `· ${hoursAgo(n.publishedAt)}` : ""}
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Nearby environment */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className="rams-label">Environment · within 50 km</div>
              <div className="rams-label" style={{ color: "var(--ink-muted)" }}>
                {loading ? "…" : `${nearbyFires.length} fire${nearbyFires.length === 1 ? "" : "s"} · NASA FIRMS`}
              </div>
            </div>
            {nearbyFires.length === 0 && (
              <div
                style={{
                  border: "1px solid var(--line)",
                  padding: 14,
                  color: "var(--ink-muted)",
                  fontSize: 13,
                }}
              >
                No thermal anomalies detected within 50 km of this incident in the latest MODIS + VIIRS pass.
              </div>
            )}
            {nearbyFires.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 1,
                  background: "var(--line)",
                  border: "1px solid var(--line)",
                }}
              >
                {nearbyFires.slice(0, 8).map((f, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-panel)",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <div className="rams-label" style={{ fontSize: 9 }}>
                      {f.distKm.toFixed(1)} km · {f.confidence || "—"}
                    </div>
                    <div className="rams-value" style={{ fontSize: 13 }}>
                      {f.brightness?.toFixed(0)} K
                    </div>
                    <div className="rams-label" style={{ fontSize: 9, color: "var(--ink-muted)" }}>
                      {f.acq_date ? new Date(f.acq_date).toUTCString().slice(5, 16) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Footer — provenance */}
          <section
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "4px 16px",
            }}
          >
            <div className="rams-label">Source</div>
            <div style={{ fontSize: 12 }}>
              <a
                href="https://acleddata.com/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                ACLED event data
              </a>{" "}
              · via{" "}
              <a
                href="/api/border/incidents"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                /api/border/incidents
              </a>
            </div>
            <div className="rams-label">Event date</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
              {p.eventDate ? new Date(p.eventDate).toLocaleString() : "—"}
            </div>
            <div className="rams-label">Reference ID</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>{incident.id}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ background: "var(--bg-panel)", padding: "8px 10px" }}>
      <div className="rams-label" style={{ fontSize: 10 }}>{label}</div>
      <div
        className="rams-value"
        style={{ fontSize: 13, color: accent ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}
