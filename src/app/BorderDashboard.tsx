"use client";

import { useEffect, useState } from "react";
import BorderMarketPulse from "../components/Intelligence/BorderMarketPulse";
import BorderNewsDesk from "../components/Intelligence/BorderNewsDesk";
import TopBar from "../components/Intelligence/TopBar";
import Sidebar from "../components/Sidebar/Sidebar";
import BorderMap from "../components/Map/BorderMap";
import SignalTicker from "../components/Intelligence/SignalTicker";
import BorderStatusStrip from "../components/Intelligence/BorderStatusStrip";
import CriticalCameraRail from "../components/Intelligence/CriticalCameraRail";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import DashboardArchitectureModal from "../components/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Intelligence/DashboardManualModal";
import ErrorBoundary from "../components/Common/ErrorBoundary";
import { TimeWindowProvider, useTimeWindow } from "../contexts/TimeWindowContext";
import TimeMachine from "../components/Intelligence/TimeMachine";
import type { BorderCommandBrief, ProvinceSelection } from "../types/dashboard";
import { isDataExplorerEnabled } from "../lib/feature-flags";

function isBorderCommandBrief(value: unknown): value is BorderCommandBrief {
  return (
    typeof value === "object" &&
    value !== null &&
    "areas" in value &&
    Array.isArray(value.areas) &&
    "actionQueue" in value &&
    Array.isArray(value.actionQueue)
  );
}

export default function BorderDashboard() {
  return (
    <TimeWindowProvider>
      <BorderDashboardSurface />
    </TimeWindowProvider>
  );
}

function BorderDashboardSurface() {
  const dataExplorerEnabled = isDataExplorerEnabled();
  const { buildUrl } = useTimeWindow();
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

  const [brief, setBrief] = useState<BorderCommandBrief | null>(isStatic ? {
    generatedAt: new Date().toISOString(),
    headline: "Static demo — connect to live database for real-time data",
    summary: "This is a static preview of the Thailand Geopolitical Watch V6.0 dashboard. In production, this briefing updates every 60 seconds with live conflict, market, and environmental intelligence from 17 data sources across the Myanmar, Cambodia, and Malaysia frontiers.",
    overallPosture: "watch" as const,
    overallScore: 62,
    overallScoreMethod: "weighted-composite",
    areas: [
      { id: "myanmar-frontier", label: "Myanmar Frontier", counterpart: "Myanmar military", posture: "priority" as const, score: 78, scoreBreakdown: { baseScore: 58, baseScoreRationale: "Chronic conflict baseline", contributions: [], rawTotal: 78, clampedScore: 78, formula: "base + factors" }, incidentCount: 4, fatalityCount: 2, verifiedCameras: 3, candidateCameras: 2, summary: "Elevated activity around Mae Sot / Myawaddy corridor", watchpoints: ["Conflict spillover", "Humanitarian pressure"], signals: [], recommendedAction: "Maintain heightened posture" },
      { id: "cambodia-frontier", label: "Cambodia Frontier", counterpart: "Cambodia border", posture: "watch" as const, score: 50, scoreBreakdown: { baseScore: 34, baseScoreRationale: "Queue monitoring baseline", contributions: [], rawTotal: 50, clampedScore: 50, formula: "base + factors" }, incidentCount: 1, fatalityCount: 0, verifiedCameras: 2, candidateCameras: 1, summary: "Normal crossing pressure at Aranyaprathet-Poipet", watchpoints: ["Queue visibility", "Casino traffic"], signals: [], recommendedAction: "Standard monitoring" },
      { id: "malaysia-frontier", label: "Malaysia Frontier", counterpart: "Malaysia border", posture: "watch" as const, score: 45, scoreBreakdown: { baseScore: 42, baseScoreRationale: "Southern corridor baseline", contributions: [], rawTotal: 45, clampedScore: 45, formula: "base + factors" }, incidentCount: 0, fatalityCount: 0, verifiedCameras: 2, candidateCameras: 1, summary: "Standard freight and passenger flow at Sadao", watchpoints: ["Freight pressure", "Security tempo"], signals: [], recommendedAction: "Routine observation" },
    ],
    topConcerns: [],
    actionQueue: [],
    sources: ["ACLED", "GDELT", "UNHCR", "Open-Meteo", "NASA FIRMS"],
  } : null);

  useEffect(() => {
    if (isStatic) return; // Skip API fetches on static export
    let active = true;

    const loadBrief = async () => {
      try {
        const response = await fetch(buildUrl("/api/border-command/brief"), {
          cache: "no-store",
        });
        const payload: unknown = await response.json();

        if (active && isBorderCommandBrief(payload)) {
          setBrief(payload);
        }
      } catch {
        // Keep the last good command brief in place.
      }
    };

    void loadBrief();
    const interval = setInterval(() => {
      void loadBrief();
    }, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [buildUrl]);

  return (
    <main id="dashboard-content" className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
      <div className="flex flex-col h-full connected-grid">

        {/* ROW 1: HEADER */}
        <header className="grid-cell shrink-0 z-50">
          <TopBar
            brief={brief}
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
            onOpenDataExplorer={
              dataExplorerEnabled ? () => setIsDataExplorerOpen(true) : undefined
            }
          />
        </header>

        {/* ROW 2: PRIMARY SURFACE */}
        <div className="flex flex-1 min-h-0 connected-grid">

          {/* LEFT SIDEBAR */}
          <aside className="hidden w-[340px] shrink-0 xl:flex grid-cell flex-col overflow-hidden" aria-label="Intelligence briefing">
            <ErrorBoundary name="Intelligence Briefing">
              <Sidebar brief={brief} />
            </ErrorBoundary>
          </aside>

          {/* CENTER: MAP */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]" aria-label="Tactical map — Thailand tri-border region">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>
        </div>

        {/* ROW 3: ANALYTICS STRIP */}
        <div className="h-[280px] xl:h-[280px] max-xl:h-auto shrink-0 connected-grid bg-black overflow-hidden max-xl:flex-col" role="region" aria-label="Analytics strip">

          {/* MARKET PULSE */}
          <div className="w-[340px] max-xl:w-full shrink-0 grid-cell overflow-hidden">
            <ErrorBoundary name="Market Pulse">
              <BorderMarketPulse />
            </ErrorBoundary>
          </div>

          {/* CRITICAL CAMERA RAIL */}
          <div className="flex-1 min-w-0 grid-cell overflow-hidden">
            <ErrorBoundary name="Camera Rail">
              <CriticalCameraRail />
            </ErrorBoundary>
          </div>

          {/* LIVE BORDER NEWS */}
          <div className="w-[340px] max-xl:w-full shrink-0 grid-cell overflow-hidden">
            <ErrorBoundary name="Border News Wire">
              <BorderNewsDesk />
            </ErrorBoundary>
          </div>
        </div>

        {/* ROW 4: TICKER BAR */}
        <div className="flex h-8 items-center overflow-hidden border-t border-white/10 bg-[linear-gradient(90deg,#07090d_0%,#0b1018_28%,#091018_100%)] px-4 text-white shrink-0">
          <div className="mr-6 flex shrink-0 items-center gap-3">
            <div className="animate-ping h-1.5 w-1.5 bg-[var(--accent)] rounded-full" />
            <div className="text-[11px] font-black uppercase tracking-[0.2em]">Signal</div>
          </div>
          <div className="hidden lg:block mr-5 text-[8px] font-black uppercase tracking-[0.16em] text-white/32">
            Market, field, archive, and narrative deltas
          </div>
          <SignalTicker endpoint="/api/border/ticker" />
        </div>

        {/* ROW 5: TIME MACHINE */}
        <ErrorBoundary name="Time Machine">
          <TimeMachine />
        </ErrorBoundary>

        {/* ROW 6: BORDER STATUS STRIP */}
        <ErrorBoundary name="Border Status">
          <BorderStatusStrip brief={brief} />
        </ErrorBoundary>
      </div>

      <div aria-live="polite" className="sr-only" id="live-announcer" />

      {/* MODALS */}
      <ProvinceDashboard province={selectedProvince} onClose={() => setSelectedProvince(null)} />
      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      {dataExplorerEnabled ? (
        <DatabaseExplorerModal
          isOpen={isDataExplorerOpen}
          onClose={() => setIsDataExplorerOpen(false)}
        />
      ) : null}
    </main>
  );
}
