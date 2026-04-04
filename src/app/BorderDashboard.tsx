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
  const [brief, setBrief] = useState<BorderCommandBrief | null>(null);

  useEffect(() => {
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
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
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
          <aside className="hidden w-[340px] shrink-0 xl:flex grid-cell flex-col overflow-hidden">
            <Sidebar brief={brief} />
          </aside>

          {/* CENTER: MAP */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>
        </div>

        {/* ROW 3: ANALYTICS STRIP */}
        <div className="h-[280px] shrink-0 connected-grid bg-black overflow-hidden">

          {/* MARKET PULSE */}
          <div className="w-[340px] shrink-0 grid-cell overflow-hidden">
            <BorderMarketPulse />
          </div>

          {/* CRITICAL CAMERA RAIL */}
          <div className="flex-1 min-w-0 grid-cell overflow-hidden">
            <CriticalCameraRail />
          </div>

          {/* LIVE BORDER NEWS */}
          <div className="w-[340px] shrink-0 grid-cell overflow-hidden">
            <BorderNewsDesk />
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
        <TimeMachine />

        {/* ROW 6: BORDER STATUS STRIP */}
        <BorderStatusStrip brief={brief} />
      </div>

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
