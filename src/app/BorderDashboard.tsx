"use client";

import { useState } from "react";
import TopBar from "../components/v8/TopBar";
import LeftPanel from "../components/v8/LeftPanel";
import BorderMap, { type Incident } from "../components/v8/BorderMap";
import RightBorders from "../components/v8/RightBorders";
import FxTicker from "../components/v8/FxTicker";
import IncidentModal from "../components/v8/IncidentModal";

export default function BorderDashboard() {
  const [focusBorder, setFocusBorder] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "96px 1fr 56px",
        height: "100vh",
        width: "100vw",
        background: "var(--bg)",
        color: "var(--ink)",
        overflow: "hidden",
      }}
    >
      <TopBar />

      <main
        id="dashboard-content"
        style={{
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <LeftPanel
          onFocusBorder={(id) => {
            setFocusBorder(id);
            window.setTimeout(() => setFocusBorder(null), 200);
          }}
        />
        <BorderMap
          onSelectIncident={setSelectedIncident}
          focusBorder={focusBorder}
        />
        <RightBorders
          onFocusBorder={(id) => {
            setFocusBorder(id);
            window.setTimeout(() => setFocusBorder(null), 200);
          }}
        />
      </main>

      <FxTicker />

      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
