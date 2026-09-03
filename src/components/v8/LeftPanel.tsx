"use client";

import { useState } from "react";
import NewsSection from "./LeftPanel/NewsSection";
import FlightsSection from "./LeftPanel/FlightsSection";
import CurrenciesSection from "./LeftPanel/CurrenciesSection";
import CommoditiesSection from "./LeftPanel/CommoditiesSection";
import EconomicsSection from "./LeftPanel/EconomicsSection";

type BorderFocusId = "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier";

export default function LeftPanel({
  onFocusBorder,
}: {
  onFocusBorder?: (id: BorderFocusId) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["news", "flights"])
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <aside
      style={{
        width: "320px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--line)",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid var(--line)",
          backgroundColor: "var(--bg-raised)",
        }}
      >
        <div
          className="rams-label"
          style={{ fontSize: 10, marginBottom: 4 }}
        >
          INTELLIGENCE BRIEFING
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <NewsSection
          expanded={expandedSections.has("news")}
          onToggle={() => toggleSection("news")}
          onFocusBorder={onFocusBorder}
        />
        <FlightsSection
          expanded={expandedSections.has("flights")}
          onToggle={() => toggleSection("flights")}
        />
        <CurrenciesSection
          expanded={expandedSections.has("currencies")}
          onToggle={() => toggleSection("currencies")}
        />
        <CommoditiesSection
          expanded={expandedSections.has("commodities")}
          onToggle={() => toggleSection("commodities")}
        />
        <EconomicsSection
          expanded={expandedSections.has("economics")}
          onToggle={() => toggleSection("economics")}
        />
      </div>
    </aside>
  );
}
