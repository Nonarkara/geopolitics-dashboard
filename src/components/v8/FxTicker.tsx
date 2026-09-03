"use client";

import { useEffect, useState } from "react";

interface Quote {
  label: string;
  value: number;
  change: number;
  up: boolean;
  category?: string;
  source?: string;
}

export default function FxTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/markets", { cache: "no-store" });
        const j = await r.json();
        const data: Quote[] = Array.isArray(j?.data) ? j.data : [];
        if (alive) {
          setQuotes(data);
          setGeneratedAt(j?.generatedAt ?? "");
        }
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const items = quotes.length
    ? quotes
    : [
        { label: "USD/THB", value: 31.98, change: 0, up: true, source: "syncing" },
        { label: "MYR/THB", value: 8.09, change: 0, up: true, source: "syncing" },
        { label: "SGD/THB", value: 25.18, change: 0, up: true, source: "syncing" },
      ];

  return (
    <footer
      aria-label="Southeast Asia FX ticker"
      style={{
        height: 56,
        background: "var(--bg-raised)",
        borderTop: "1px solid var(--line)",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 16,
        padding: "0 14px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div className="rams-tick rams-tick-ok" />
        <div className="rams-label">Southeast Asia FX</div>
      </div>

      <div style={{ overflow: "hidden", minWidth: 0 }}>
        <div className="rams-marquee">
          {[...items, ...items].map((q, i) => (
            <span
              key={`${q.label}-${i}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
            >
              <span className="rams-label" style={{ fontSize: 9 }}>{q.label}</span>
              <span className="rams-value">
                {q.value >= 1000 ? q.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : q.value.toFixed(2)}
              </span>
              <span
                className="rams-value"
                style={{
                  fontSize: 10,
                  color: q.up ? "var(--ok)" : "var(--accent)",
                }}
              >
                {q.up ? "\u25B2" : "\u25BC"} {Math.abs(q.change).toFixed(2)}%
              </span>
              <span className="rams-label" style={{ opacity: 0.5, fontSize: 9 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
        <div className="rams-label" style={{ fontSize: 9 }}>ExchangeRate API · Binance</div>
        <div className="rams-value" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
          {generatedAt ? new Date(generatedAt).toLocaleTimeString("en-GB") : "--:--:--"}
        </div>
      </div>
    </footer>
  );
}
