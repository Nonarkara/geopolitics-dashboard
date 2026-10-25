"use client";

export interface BorderArea {
  id: string;
  label: string;
  counterpart: string;
  posture: "priority" | "watch" | "stable";
  score: number;
  incidentCount: number;
  fatalityCount: number;
  verifiedCameras: number;
  candidateCameras: number;
  summary: string;
  watchpoints?: string[];
  recommendedAction?: string;
}

const POSTURE_STYLE: Record<string, { color: string; label: string }> = {
  priority: { color: "var(--accent)", label: "Priority" },
  watch: { color: "var(--warn)", label: "Watch" },
  stable: { color: "var(--ok)", label: "Stable" },
};

export default function BorderPanel({
  area,
  onFocus,
}: {
  area: BorderArea;
  onFocus: () => void;
}) {
  const style = POSTURE_STYLE[area.posture] ?? POSTURE_STYLE.watch;
  const pct = Math.min(100, Math.max(0, area.score));
  return (
    <div
      className="rams-panel"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <div className="rams-panel-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="rams-tick" style={{ background: style.color }} />
          <div className="rams-label" style={{ color: style.color }}>{style.label}</div>
          <div className="rams-label">{area.label}</div>
        </div>
        <button type="button" className="rams-btn rams-btn-accent" onClick={onFocus}>
          Focus Map
        </button>
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Score bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="rams-label">Escalation index</div>
            <div className="rams-value" style={{ fontSize: 11 }}>{pct}/100</div>
          </div>
          <div className="rams-bar-track">
            <div
              className="rams-bar-fill"
              style={{
                width: `${pct}%`,
                background: style.color,
              }}
            />
          </div>
        </div>

        {/* Grid of 4 stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            background: "var(--line)",
            border: "1px solid var(--line)",
          }}
        >
          <Stat label="Incidents" value={area.incidentCount.toString()} />
          <Stat label="Fatalities" value={area.fatalityCount.toString()} accent={area.fatalityCount > 0} />
          <Stat label="Cameras · verified" value={area.verifiedCameras.toString()} />
          <Stat label="Cameras · candidate" value={area.candidateCameras.toString()} />
        </div>

        {/* Summary */}
        <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-dim)" }}>
          {area.summary}
        </div>

        {/* Watchpoints */}
        {area.watchpoints && area.watchpoints.length > 0 && (
          <div>
            <div className="rams-label" style={{ marginBottom: 4 }}>Watchpoints</div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {area.watchpoints.slice(0, 3).map((w, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    paddingLeft: 12,
                    position: "relative",
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 5,
                      width: 6,
                      height: 1,
                      background: style.color,
                    }}
                  />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {area.recommendedAction && (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <div className="rams-label" style={{ marginBottom: 2 }}>Recommended</div>
            <div style={{ fontSize: 11, color: "var(--ink)" }}>{area.recommendedAction}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: "var(--bg-panel)", padding: "8px 10px" }}>
      <div className="rams-label" style={{ fontSize: 9 }}>{label}</div>
      <div
        className="rams-value"
        style={{ fontSize: 16, color: accent ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}
