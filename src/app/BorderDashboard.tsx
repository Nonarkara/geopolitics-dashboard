"use client";

import { useEffect, useState } from "react";
import BorderNewsDesk from "../components/Intelligence/BorderNewsDesk";
import BorderInsightLab from "../components/Intelligence/BorderInsightLab";
import BorderMarketPulse from "../components/Intelligence/BorderMarketPulse";
import CriticalCameraRail from "../components/Intelligence/CriticalCameraRail";
import TopBar from "../components/Intelligence/TopBar";
import Sidebar from "../components/Sidebar/Sidebar";
import BorderMap from "../components/Map/BorderMap";
import SignalTicker from "../components/Intelligence/SignalTicker";
import BorderStatusStrip from "../components/Intelligence/BorderStatusStrip";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import DashboardArchitectureModal from "../components/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Intelligence/DashboardManualModal";
import ErrorBoundary from "../components/Common/ErrorBoundary";
import MobileDrawer from "../components/Common/MobileDrawer";
import { TimeWindowProvider, useTimeWindow } from "../contexts/TimeWindowContext";
import TimeMachine from "../components/Intelligence/TimeMachine";
import type {
  BorderCommandBrief,
  DashboardStatusPayload,
  ProvinceSelection,
} from "../types/dashboard";
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

function isDashboardStatus(value: unknown): value is DashboardStatusPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "string" &&
    "datasets" in value &&
    Array.isArray(value.datasets)
  );
}

type MobilePanel = "brief" | "news" | "markets" | "cctv" | "insights" | "history";

function BorderDashboardContent() {
  const { buildUrl } = useTimeWindow();
  const dataExplorerEnabled = isDataExplorerEnabled();
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("brief");
  const [brief, setBrief] = useState<BorderCommandBrief | null>(null);
  const [systemStatus, setSystemStatus] = useState<DashboardStatusPayload | null>(null);

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

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (active && response.ok && isDashboardStatus(payload)) {
          setSystemStatus(payload);
        }
      } catch {
        // The header keeps its last verified runtime posture.
      }
    };

    void loadStatus();
    const interval = setInterval(() => void loadStatus(), 5 * 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
      <div className="flex flex-col h-full connected-grid">

        {/* ROW 1: HEADER */}
        <header className="grid-cell shrink-0 z-50">
          <TopBar
            brief={brief}
            status={systemStatus}
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
            onOpenDataExplorer={
              dataExplorerEnabled ? () => setIsDataExplorerOpen(true) : undefined
            }
          />
        </header>

        {/* ROW 2: PRIMARY SURFACE */}
        <div className="flex flex-1 min-h-0 connected-grid">
          <aside className="hidden w-[320px] shrink-0 xl:flex grid-cell flex-col overflow-hidden">
            <Sidebar brief={brief} />
          </aside>

          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPanelsOpen(true)}
          aria-label="Open mobile intelligence panels"
          className="fixed right-3 top-[76px] z-40 flex h-11 items-center gap-2 border border-[var(--accent)] bg-black px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white xl:hidden"
        >
          <span className="h-1.5 w-1.5 bg-[var(--accent)]" aria-hidden="true" /> Intel
        </button>

        {/* ROW 3: Secondary analysis. Mobile reaches this through the Intel drawer. */}
        <div className="hidden h-[260px] shrink-0 connected-grid overflow-hidden bg-black xl:flex 2xl:h-[300px]">
          <div className="flex-1 min-w-0 grid-cell overflow-hidden">
            <ErrorBoundary name="Border Insight Lab">
              <BorderInsightLab brief={brief} />
            </ErrorBoundary>
          </div>
          <div className="w-[320px] shrink-0 grid-cell overflow-hidden">
            <BorderMarketPulse />
          </div>
          <div className="w-[360px] shrink-0 grid-cell overflow-hidden">
            <CriticalCameraRail />
          </div>
          <div className="w-[360px] shrink-0 grid-cell overflow-hidden">
            <BorderNewsDesk />
          </div>
        </div>

        {/* ROW 4: TICKER */}
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 mr-6 shrink-0">
            <div className="h-1.5 w-1.5 animate-ping bg-[var(--accent)]" />
            <div className="text-[11px] font-black uppercase tracking-[0.2em]">SIGNAL</div>
          </div>
          <SignalTicker endpoint="/api/border/ticker" />
        </div>

        <div className="hidden xl:block">
          <TimeMachine />
        </div>
        <div className="hidden xl:block">
          <BorderStatusStrip brief={brief} />
        </div>
      </div>

      <MobileDrawer
        isOpen={isPanelsOpen}
        onClose={() => setIsPanelsOpen(false)}
        title="Command Panels"
      >
        <nav className="grid h-11 grid-cols-6 border-b border-[var(--line)]" aria-label="Mobile intelligence sections">
          {(["brief", "news", "markets", "cctv", "insights", "history"] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => setMobilePanel(panel)}
              aria-pressed={mobilePanel === panel}
              className={`border-r border-[var(--line)] px-2 text-[10px] font-black uppercase tracking-[0.12em] last:border-r-0 ${
                mobilePanel === panel
                  ? "bg-[var(--accent)] text-black"
                  : "bg-black text-white/55"
              }`}
            >
              {panel}
            </button>
          ))}
        </nav>
        {mobilePanel === "brief" ? (
          <div className="h-[70dvh]">
            <Sidebar brief={brief} />
          </div>
        ) : null}
        {mobilePanel === "news" ? (
          <div className="h-[70dvh]">
            <BorderNewsDesk />
          </div>
        ) : null}
        {mobilePanel === "markets" ? (
          <div className="h-[70dvh]">
            <BorderMarketPulse />
          </div>
        ) : null}
        {mobilePanel === "cctv" ? (
          <div className="h-[70dvh]">
            <CriticalCameraRail />
          </div>
        ) : null}
        {mobilePanel === "insights" ? (
          <div className="h-[70dvh]">
            <BorderInsightLab brief={brief} />
          </div>
        ) : null}
        {mobilePanel === "history" ? (
          <div className="min-h-[240px] bg-black px-2 py-4">
            <div className="mb-4 px-2 text-[11px] leading-relaxed text-white/55">
              Select a Bangkok command day to replay the archived picture. Live mode remains the default.
            </div>
            <TimeMachine />
          </div>
        ) : null}
      </MobileDrawer>

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

export default function BorderDashboard() {
  return (
    <TimeWindowProvider>
      <BorderDashboardContent />
    </TimeWindowProvider>
  );
}
