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
import MobileDrawer from "../components/Common/MobileDrawer";
import { TimeWindowProvider } from "../contexts/TimeWindowContext";
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
  const dataExplorerEnabled = isDataExplorerEnabled();
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);
  const [brief, setBrief] = useState<BorderCommandBrief | null>(null);

  useEffect(() => {
    let active = true;

    const loadBrief = async () => {
      try {
        const response = await fetch("/api/border-command/brief", {
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
  }, []);

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
      <TimeWindowProvider>
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

        {/* MOBILE: sidebar is hidden below xl — surface it via a bottom sheet (§11.8) */}
        <button
          type="button"
          onClick={() => setIsPanelsOpen(true)}
          aria-label="Open command panels"
          className="fixed left-2 top-[64px] z-40 flex h-11 items-center gap-2 border border-white/25 bg-black/85 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white xl:hidden"
        >
          <span aria-hidden="true">&#9776;</span> Panels
        </button>

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
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 mr-6 shrink-0">
            <div className="animate-ping w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
            <div className="text-[11px] font-black uppercase tracking-[0.2em]">SIGNAL</div>
          </div>
          <SignalTicker endpoint="/api/border/ticker" />
        </div>

        {/* ROW 5: TIME MACHINE */}
        <TimeMachine />

        {/* ROW 6: BORDER STATUS STRIP */}
        <BorderStatusStrip brief={brief} />
      </div>

      {/* MOBILE COMMAND PANELS (same Sidebar content as the desktop aside).
          Must stay INSIDE TimeWindowProvider — Sidebar calls useTimeWindow(). */}
      <MobileDrawer
        isOpen={isPanelsOpen}
        onClose={() => setIsPanelsOpen(false)}
        title="Command Panels"
      >
        <Sidebar brief={brief} />
      </MobileDrawer>
      </TimeWindowProvider>

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
