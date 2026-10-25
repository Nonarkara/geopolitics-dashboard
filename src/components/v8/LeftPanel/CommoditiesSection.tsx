"use client";

import { useEffect, useState } from "react";

interface CommodityData {
  label: string;
  value: number;
  change: number;
  up?: boolean;
}

export default function CommoditiesSection({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Fetch latest commodity snapshot from v8_commodity_prices_daily
        const r = await fetch(
          `/api/data?table=v8_commodity_prices_daily&order=captured_at&limit=5&select=commodity_name,price,change_percent,unit`,
          { cache: "no-store" }
        );
        const rows = await r.json();
        if (alive && Array.isArray(rows)) {
          const commodities = rows.map((row: any) => ({
            label: row.commodity_name ?? "",
            value: row.price ?? 0,
            change: row.change_percent ?? 0,
            up: (row.change_percent ?? 0) > 0 ? true : (row.change_percent ?? 0) < 0 ? false : undefined,
          }));
          setCommodities(commodities);
        }
      } catch {
        // Fallback to /api/markets if DB fetch fails
        try {
          const r = await fetch("/api/markets", { cache: "no-store" });
          const j = await r.json();
          if (alive && Array.isArray(j?.data)) {
            const filtered = j.data.filter(
              (item: any) => item.category === "commodities" || item.label?.includes("Oil") || item.label?.includes("Brent")
            );
            setCommodities(filtered.slice(0, 5));
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
        <div className="rams-label">COMMODITIES</div>
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
          ) : commodities.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: "var(--ink-muted)" }}>
              No commodity data
            </div>
          ) : (
            commodities.map((comm) => (
              <div
                key={comm.label}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rams-label" style={{ fontSize: 9 }}>
                    {comm.label}
                  </div>
                  <div
                    className="rams-value"
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    ${comm.value?.toFixed(2) || "—"}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: getTrendColor(comm.up),
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {getTrendArrow(comm.up)}
                  {comm.change ? ` ${Math.abs(comm.change).toFixed(2)}%` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
