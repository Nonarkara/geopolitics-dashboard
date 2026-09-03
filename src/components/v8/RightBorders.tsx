"use client";

import { useEffect, useState } from "react";
import BorderPanel, { type BorderArea } from "./BorderPanel";

const TARGET_IDS = ["myanmar-frontier", "cambodia-frontier", "malaysia-frontier"];

export default function RightBorders({
  onFocusBorder,
}: {
  onFocusBorder: (id: "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier") => void;
}) {
  const [areas, setAreas] = useState<BorderArea[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/border-command/brief", { cache: "no-store" });
        const j = await r.json();
        const all: BorderArea[] = Array.isArray(j?.areas) ? j.areas : [];
        if (alive) {
          setAreas(
            TARGET_IDS
              .map((id) => all.find((a) => a.id === id))
              .filter((a): a is BorderArea => !!a),
          );
        }
      } catch {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <aside
      aria-label="Border role panels"
      style={{
        width: 360,
        borderLeft: "1px solid var(--line)",
        background: "var(--bg)",
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="rams-label">Border roles · Tri-theater</div>
      {areas.length === 0 && (
        <div className="rams-panel" style={{ padding: 16 }}>
          <div className="rams-label">Synchronizing posture\u2026</div>
        </div>
      )}
      {areas.map((a) => (
        <BorderPanel
          key={a.id}
          area={a}
          onFocus={() => onFocusBorder(a.id as "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier")}
        />
      ))}
    </aside>
  );
}
