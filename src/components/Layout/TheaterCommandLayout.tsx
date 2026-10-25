"use client";

import type { ReactNode } from "react";
import type { BorderAreaStatus, BorderCommandBrief } from "../../types/dashboard";
import type { BorderAreaId } from "../../lib/border-regions";
import TheaterPanel from "../Theater/TheaterPanel";
import ErrorBoundary from "../Common/ErrorBoundary";

const THEATER_IDS: BorderAreaId[] = [
  "myanmar-frontier",
  "cambodia-frontier",
  "deep-south",
  "malaysia-frontier",
];

interface TheaterCommandLayoutProps {
  brief: BorderCommandBrief | null;
  strategicMap: ReactNode;
  onFlyToTheater?: (theaterId: BorderAreaId) => void;
}

function findAreaStatus(
  brief: BorderCommandBrief | null,
  theaterId: BorderAreaId,
): BorderAreaStatus | null {
  return brief?.areas.find((a) => a.id === theaterId) ?? null;
}

export default function TheaterCommandLayout({
  brief,
  strategicMap,
  onFlyToTheater,
}: TheaterCommandLayoutProps) {
  return (
    <div
      className="flex-1 min-h-0 grid connected-grid"
      style={{
        gridTemplateColumns: "58fr 42fr",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      {/* Strategic Map — spans both rows on the left */}
      <div
        className="grid-cell bg-[#0a1628] relative overflow-hidden"
        style={{ gridRow: "1 / 3", gridColumn: "1" }}
        aria-label="Strategic map — Thailand and ASEAN"
      >
        {strategicMap}
      </div>

      {/* Top-right: Myanmar + Cambodia stacked */}
      <div
        className="grid-cell overflow-hidden"
        style={{ gridRow: "1", gridColumn: "2" }}
      >
        <div className="flex h-full gap-px">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ErrorBoundary name="Myanmar Theater">
              <TheaterPanel
                theaterId="myanmar-frontier"
                areaStatus={findAreaStatus(brief, "myanmar-frontier")}
                onFlyTo={() => onFlyToTheater?.("myanmar-frontier")}
              />
            </ErrorBoundary>
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ErrorBoundary name="Cambodia Theater">
              <TheaterPanel
                theaterId="cambodia-frontier"
                areaStatus={findAreaStatus(brief, "cambodia-frontier")}
                onFlyTo={() => onFlyToTheater?.("cambodia-frontier")}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Bottom-right: Deep South + Malaysia stacked */}
      <div
        className="grid-cell overflow-hidden"
        style={{ gridRow: "2", gridColumn: "2" }}
      >
        <div className="flex h-full gap-px">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ErrorBoundary name="Deep South Theater">
              <TheaterPanel
                theaterId="deep-south"
                areaStatus={findAreaStatus(brief, "deep-south")}
                onFlyTo={() => onFlyToTheater?.("deep-south")}
              />
            </ErrorBoundary>
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ErrorBoundary name="Malaysia Theater">
              <TheaterPanel
                theaterId="malaysia-frontier"
                areaStatus={findAreaStatus(brief, "malaysia-frontier")}
                onFlyTo={() => onFlyToTheater?.("malaysia-frontier")}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
