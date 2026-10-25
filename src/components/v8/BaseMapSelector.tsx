"use client";

import { BASE_MAPS, freshnessLabel, gibsDateFor, type BaseMapEntry } from "../../lib/mapLayers";

export default function BaseMapSelector({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const active = BASE_MAPS.find((b) => b.id === activeId) ?? BASE_MAPS[0];
  const activeDate = active.needsDate ? gibsDateFor(active.cadence) : undefined;

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 58,
        width: 240,
        background: "rgba(10,10,10,0.92)",
        border: "1px solid var(--line-bright)",
        zIndex: 10,
      }}
    >
      <div className="rams-panel-head">
        <div className="rams-label">Base map</div>
        <div className="rams-label" style={{ color: "var(--ink-muted)", fontSize: 9 }}>{BASE_MAPS.length}</div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {BASE_MAPS.map((b) => {
          const isActive = b.id === activeId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              title={b.name}
              style={{
                background: isActive ? "var(--accent-dim)" : "var(--bg-panel)",
                color: isActive ? "#fff" : "var(--ink-dim)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                padding: "8px 4px",
                border: 0,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <BaseMapInfo active={active} activeDate={activeDate} />
    </div>
  );
}

function BaseMapInfo({ active, activeDate }: { active: BaseMapEntry; activeDate?: string }) {
  return (
    <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.3 }}>{active.name}</div>
      <div className="rams-label" style={{ fontSize: 9, color: "var(--ink-muted)" }}>
        Source:{" "}
        {active.sourceUrl ? (
          <a href={active.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--ink-dim)" }}>
            {active.source}
          </a>
        ) : (
          active.source
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-dim)",
        }}
      >
        <span className="rams-tick rams-tick-ok" style={{ width: 4, height: 4 }} />
        <span>{freshnessLabel(active.cadence, activeDate)}</span>
        {activeDate && <span style={{ color: "var(--ink-muted)" }}>· {activeDate}</span>}
      </div>
    </div>
  );
}
