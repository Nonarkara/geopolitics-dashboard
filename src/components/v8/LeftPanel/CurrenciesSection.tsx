"use client";

import { useEffect, useState } from "react";

interface CurrencyData {
  label: string;
  value: number;
  change: number;
  up?: boolean;
}

const ASEAN_CURRENCIES = [
  "THB", "MYR", "SGD", "IDR", "VND",
  "LAK", "MMK", "KHR", "PHP", "BND"
];

export default function CurrenciesSection({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [currencies, setCurrencies] = useState<Record<string, CurrencyData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Fetch latest snapshot from v8_asean_currencies_daily
        const r = await fetch(
          `/api/data?table=v8_asean_currencies_daily&order=captured_at&limit=10&select=currency_pair,rate,change_percent`,
          { cache: "no-store" }
        );
        const rows = await r.json();
        if (alive && Array.isArray(rows)) {
          const byLabel: Record<string, CurrencyData> = {};
          rows.forEach((row: any) => {
            const label = row.currency_pair?.replace("USD/", "") ?? "";
            byLabel[label] = {
              label,
              value: row.rate ?? 0,
              change: row.change_percent ?? 0,
              up: (row.change_percent ?? 0) > 0 ? true : (row.change_percent ?? 0) < 0 ? false : undefined,
            };
          });
          setCurrencies(byLabel);
        }
      } catch {
        // Fallback to /api/markets if DB fetch fails
        try {
          const r = await fetch("/api/markets", { cache: "no-store" });
          const j = await r.json();
          if (alive && Array.isArray(j?.data)) {
            const byLabel: Record<string, CurrencyData> = {};
            j.data.forEach((item: any) => {
              if (ASEAN_CURRENCIES.includes(item.label)) {
                byLabel[item.label] = {
                  label: item.label,
                  value: item.value ?? 0,
                  change: item.change ?? 0,
                  up: item.up,
                };
              }
            });
            setCurrencies(byLabel);
          }
        } catch {}
      }
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const getTrendArrow = (up?: boolean) => {
    if (up === true) return "↑";
    if (up === false) return "↓";
    return "→";
  };

  const getTrendColor = (up?: boolean) => {
    if (up === true) return "#5a7a4a";
    if (up === false) return "#e24a3f";
    return "var(--ink-muted)";
  };

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
        <div className="rams-label">ASEAN FX · 24h</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-muted)" }}>
          {expanded ? "−" : "+"}
        </div>
      </button>

      {expanded && (
        <div>
          {loading ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
              Loading…
            </div>
          ) : Object.keys(currencies).length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
              No data available
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {ASEAN_CURRENCIES.map((code) => {
                const curr = currencies[code];
                return (
                  <div
                    key={code}
                    style={{
                      padding: "10px 12px",
                      borderRight: "1px solid var(--line)",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 11,
                    }}
                  >
                    <div className="rams-label" style={{ fontSize: 9 }}>
                      {code}
                    </div>
                    <div
                      className="rams-value"
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                    >
                      {curr ? curr.value.toFixed(2) : "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: getTrendColor(curr?.up),
                        fontWeight: 600,
                      }}
                    >
                      {curr ? getTrendArrow(curr.up) : "—"}
                      {curr && curr.change ? ` ${Math.abs(curr.change).toFixed(2)}%` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
