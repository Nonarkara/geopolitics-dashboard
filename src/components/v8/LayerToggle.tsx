"use client";

import { OVERLAYS, freshnessLabel, gibsDateFor, type OverlayEntry } from "../../lib/mapLayers";

type Category = OverlayEntry["category"];
const CATEGORY_ORDER: Category[] = ["ATMOSPHERE", "THERMAL", "VEGETATION", "INFRASTRUCTURE", "HYDRO"];

export default function LayerToggle({
  active,
  onToggle,
  onClearAll,
}: {
  active: Set<string>;
  onToggle: (id: string) => void;
  onClearAll: () => void;
}) {
  const byCategory: Record<Category, OverlayEntry[]> = {
    ATMOSPHERE: [],
    THERMAL: [],
    VEGETATION: [],
    INFRASTRUCTURE: [],
    HYDRO: [],
  };
  for (const o of OVERLAYS) byCategory[o.category].push(o);

  const activeEntries = OVERLAYS.filter((o) => active.has(o.id));

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 230,
        width: 240,
        background: "rgba(10,10,10,0.92)",
        border: "1px solid var(--line-bright)",
        zIndex: 10,
        maxHeight: "calc(100% - 260px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="rams-panel-head">
        <div className="rams-label">Layers</div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={active.size === 0}
          className="rams-btn"
          style={{ padding: "2px 6px", fontSize: 9, opacity: active.size === 0 ? 0.4 : 1 }}
        >
          Clear · {active.size}
        </button>
      </div>
      <div style={{ overflowY: "auto", padding: "4px 0" }}>
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat}>
            <div
              className="rams-label"
              style={{ padding: "4px 12px", fontSize: 9, color: "var(--ink-muted)" }}
            >
              {cat}
            </div>
            {byCategory[cat].map((o) => {
              const on = active.has(o.id);
              const date = o.needsDate ? gibsDateFor(o.cadence) : undefined;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onToggle(o.id)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "14px 1fr auto",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    background: on ? "rgba(226,74,63,0.08)" : "transparent",
                    border: 0,
                    borderTop: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--ink)",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      border: "1px solid var(--ink-dim)",
                      background: on ? "var(--accent)" : "transparent",
                    }}
                  />
                  <div style={{ fontSize: 11, lineHeight: 1.25 }}>{o.name}</div>
                  <div
                    className="rams-label"
                    style={{ fontSize: 9, color: "var(--ink-muted)" }}
                    title={`${o.source} · ${freshnessLabel(o.cadence, date)}`}
                  >
                    {freshnessLabel(o.cadence, date)}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Active layer attribution list */}
      {activeEntries.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--line-bright)",
            padding: "8px 12px",
            background: "var(--bg-panel)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div className="rams-label" style={{ fontSize: 9 }}>On-map sources</div>
          {activeEntries.map((o) => {
            const date = o.needsDate ? gibsDateFor(o.cadence) : undefined;
            return (
              <div key={o.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{ width: 6, height: 6, background: "var(--accent)" }}
                  />
                  <div style={{ fontSize: 11, color: "var(--ink)" }}>{o.label}</div>
                  <div
                    className="rams-label"
                    style={{ fontSize: 9, color: "var(--ink-muted)", marginLeft: "auto" }}
                  >
                    {freshnessLabel(o.cadence, date)}
                  </div>
                </div>
                <div className="rams-label" style={{ fontSize: 9, color: "var(--ink-muted)", paddingLeft: 12 }}>
                  {o.sourceUrl ? (
                    <a href={o.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--ink-muted)" }}>
                      {o.source}
                    </a>
                  ) : (
                    o.source
                  )}
                  {date && ` · ${date}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
