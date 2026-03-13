"use client";

import { useState } from "react";
import TopBar from "../components/Intelligence/TopBar";
import Sidebar from "../components/Sidebar/Sidebar";
import BorderMap from "../components/Map/BorderMap";
import BriefingPanel from "../components/Intelligence/BriefingPanel";
import NewsDesk from "../components/Intelligence/NewsDesk";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import LiveTVPanel from "../components/Intelligence/LiveTVPanel";
import FinePrint from "../components/Intelligence/FinePrint";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import ConvergenceAlerts from "../components/Sidebar/ConvergenceAlerts";
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
          <aside className="hidden w-[280px] shrink-0 xl:flex grid-cell flex-col">
            <Sidebar />
          </aside>

          {/* CENTER: MAP */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>

          {/* RIGHT PANEL */}
          <aside className="hidden w-[320px] shrink-0 2xl:flex overflow-hidden grid-cell flex-col">
            <div className="flex flex-col h-full divide-y-[1.5px] divide-black">

              {/* BRIEFING */}
              <section className="p-3 shrink-0 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="eyebrow">BRIEFING</div>
                  <span className="live-badge scale-90">LIVE</span>
                </div>
                <div className="max-h-[160px] overflow-y-auto no-scrollbar">
                  <BriefingPanel />
                </div>
              </section>

              {/* CONVERGENCE */}
              <section className="p-3 shrink-0 bg-white">
                <div className="eyebrow mb-2">CONVERGENCE ALERTS</div>
                <div className="max-h-[110px] overflow-y-auto no-scrollbar">
                  <ConvergenceAlerts />
                </div>
              </section>

              {/* LIVE TV */}
              <section className="p-3 shrink-0 bg-[var(--bg)]">
                <div className="eyebrow mb-2 flex items-center justify-between">
                  REGIONAL MONITORS
                  <span className="text-[7px] font-black opacity-30 tracking-[0.3em]">LIVE</span>
                </div>
                <div className="max-h-[190px] overflow-y-auto no-scrollbar">
                  <LiveTVPanel />
                </div>
              </section>

              {/* NEWS FEED */}
              <section className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col bg-white">
                <div className="eyebrow mb-2">LIVE FEED</div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <NewsDesk />
                </div>
              </section>
            </div>
          </aside>
        </div>

        {/* ROW 3: ANALYTICS STRIP */}
        <div className="h-[180px] shrink-0 connected-grid bg-black overflow-hidden">

          {/* MARKET RADAR */}
          <div className="w-[280px] shrink-0 grid-cell p-3 overflow-hidden">
            <div className="eyebrow mb-1.5">MARKET RADAR</div>
            <EconomicMonitor />
          </div>

          {/* CONFLICT TRENDS */}
          <div className="flex-1 min-w-0 grid-cell overflow-hidden">
            <ConflictTrends />
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
