"use client";

import { useState } from "react";
import TopBar from "../components/Intelligence/TopBar";
import Sidebar from "../components/Sidebar/Sidebar";
import BorderMap from "../components/Map/BorderMap";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import FinePrint from "../components/Intelligence/FinePrint";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import CriticalCameraRail from "../components/Intelligence/CriticalCameraRail";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import DashboardArchitectureModal from "../components/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Intelligence/DashboardManualModal";
import ErrorBoundary from "../components/Common/ErrorBoundary";
import type { ProvinceSelection } from "../types/dashboard";

export default function BorderDashboard() {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
      <div className="flex flex-col h-full connected-grid">

        {/* ROW 1: HEADER */}
        <header className="grid-cell shrink-0 z-50">
          <TopBar
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
            onOpenDataExplorer={() => setIsDataExplorerOpen(true)}
          />
        </header>

        {/* ROW 2: PRIMARY SURFACE */}
        <div className="flex flex-1 min-h-0 connected-grid">

          {/* LEFT SIDEBAR */}
          <aside className="hidden w-[340px] shrink-0 xl:flex grid-cell flex-col overflow-hidden">
            <Sidebar />
          </aside>

          {/* CENTER: MAP */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>
        </div>

        {/* ROW 3: ANALYTICS STRIP */}
        <div className="h-[210px] shrink-0 connected-grid bg-black overflow-hidden">

          {/* MARKET RADAR */}
          <div className="w-[340px] shrink-0 grid-cell p-3 overflow-hidden">
            <div className="eyebrow mb-1.5">MARKET RADAR</div>
            <EconomicMonitor />
          </div>

          {/* CRITICAL CAMERA RAIL */}
          <div className="flex-1 min-w-0 grid-cell overflow-hidden">
            <CriticalCameraRail />
          </div>

          {/* CONFLICT SIGNALS */}
          <div className="w-[200px] shrink-0 grid-cell p-3 bg-[var(--bg)] overflow-hidden">
            <div className="eyebrow mb-1.5">CONFLICT SIGNALS</div>
            <div className="space-y-2">
              {[
                { type: "CONFLICT", val: "Myanmar civil war", signal: "critical" as const },
                { type: "BORDER", val: "Border infiltration", signal: "warning" as const },
                { type: "MILITARY", val: "Myawaddy fighting", signal: "critical" as const },
                { type: "REFUGEE", val: "Mae Sot influx", signal: "warning" as const },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`stat-pill ${s.signal === "critical" ? "danger" : "warning"}`}>{s.type}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight truncate">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SOURCES */}
          <div className="w-[200px] shrink-0 grid-cell p-3 overflow-hidden">
            <div className="eyebrow mb-1.5">SOURCES</div>
            <SourceStack />
          </div>
        </div>

        {/* ROW 4: TICKER BAR */}
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 mr-6 shrink-0">
            <div className="animate-ping w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
            <div className="text-[11px] font-black uppercase tracking-[0.2em]">SIGNAL</div>
          </div>
          <SignalTicker />
        </div>

        {/* ROW 5: FINE PRINT */}
        <FinePrint />
      </div>

      {/* MODALS */}
      <ProvinceDashboard province={selectedProvince} onClose={() => setSelectedProvince(null)} />
      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      <DatabaseExplorerModal isOpen={isDataExplorerOpen} onClose={() => setIsDataExplorerOpen(false)} />
    </main>
  );
}
