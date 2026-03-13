"use client";

import React, { useState } from "react";
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
      {/* ── Absolute Operational Matrix ── */}
      <div className="flex flex-col h-full connected-grid">
        
        {/* ROW 1: MISSION CONTROL HEADER */}
        <header className="grid-cell shrink-0 z-50">
          <TopBar
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
          />
        </header>

        {/* ROW 2: PRIMARY INTELLIGENCE SURFACE */}
        <div className="flex flex-1 min-h-0 connected-grid">
          {/* COL 1: LEFT WATCHPOINTS */}
          <aside className="hidden w-[310px] shrink-0 xl:flex grid-cell flex-col border-r border-black shadow-2xl">
            <Sidebar />
          </aside>

          {/* COL 2: GLOBAL OPS SURFACE */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <ErrorBoundary name="Tactical Map Engine">
              <BorderMap onProvinceSelect={setSelectedProvince} />
            </ErrorBoundary>
          </div>

          {/* COL 3: RIGHT DATA STACK */}
          <aside className="hidden w-[330px] shrink-0 2xl:flex overflow-hidden grid-cell flex-col border-l border-black shadow-2xl">
            <div className="flex flex-col h-full divide-y-[2px] divide-black">
              {/* TOP: MISSION BRIEFING */}
              <section className="p-4 shrink-0 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="eyebrow">STRATEGIC BRIEFING</div>
                  <span className="live-badge scale-90">LIVE FEED</span>
                </div>
                <div className="max-h-[140px] overflow-y-auto no-scrollbar">
                   <BriefingPanel />
                </div>
              </section>
              
              {/* MID: SATELLITE VISUALS (TV) */}
              <section className="p-4 shrink-0 bg-[var(--bg)] border-b border-black">
                <div className="eyebrow mb-3 flex items-center justify-between">
                   SATELLITE SENSORS (6 CH)
                   <span className="text-[7px] font-black opacity-30 tracking-[0.4em]">LIVE SCAN</span>
                </div>
                <div className="max-h-[220px] overflow-y-auto no-scrollbar">
                   <LiveTVPanel />
                </div>
              </section>

              {/* BOTTOM: REAL-TIME INTEL FEEDS */}
              <section className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col bg-white">
                 <div className="eyebrow mb-3">OPERATIONAL INTEL STREAM</div>
                 <div className="flex-1 overflow-y-auto no-scrollbar">
                    <NewsDesk />
                 </div>
              </section>
            </div>
          </aside>
        </div>

        {/* ROW 3: ANALYTIC ANALYTICS CLUSTER (FIXED GRID) */}
        <div className="h-[145px] shrink-0 connected-grid bg-black">
           <div className="w-[310px] grid-cell p-4 flex flex-col justify-between">
              <div>
                 <div className="eyebrow mb-1">DATA INTEGRITY</div>
                 <h3 className="text-[14px] font-black uppercase tracking-[0.2em] leading-tight">Connected Grid V5</h3>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 w-1.5 bg-[var(--safe)] rounded-full animate-pulse" />
                    <span className="text-[9px] font-black opacity-60 uppercase">Pulse: Global Sync Alpha</span>
                 </div>
              </div>
              <p className="text-[8px] font-black opacity-20 uppercase tracking-[0.4em] leading-none">Axiom Strategic // 2026</p>
           </div>
           
           <div className="flex-1 grid-cell p-4">
             <div className="eyebrow mb-2">ECONOMIC TRADE SENSORS</div>
             <EconomicMonitor />
           </div>

           <div className="flex-1 grid-cell p-4">
             <div className="eyebrow mb-2">CONFLICT FATALITY TRENDS</div>
             <ConflictTrends />
           </div>

           <div className="w-[280px] grid-cell p-4 bg-[var(--bg)]">
             <div className="eyebrow mb-3">THREAT MONITOR</div>
             <div className="space-y-1.5">
                {[
                  { type: "WAR", val: "Myanmar civil war", color: "text-[var(--accent)]" },
                  { type: "SEC", val: "Border infiltration", color: "text-[var(--hazard)]" },
                  { type: "OPS", val: "Aeronautics Scan", color: "text-[var(--tech)]" }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-black border-b border-[var(--line-dim)] pb-1.5 last:border-0">
                     <span className={`${s.color} px-1.5 py-0.5 bg-black text-white text-[8px]`}>{s.type}</span>
                     <span className="truncate ml-2 uppercase tracking-tighter">{s.val}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="w-[250px] grid-cell p-4">
             <div className="eyebrow mb-2">INTEL SOURCES</div>
             <SourceStack />
           </div>
        </div>

        {/* ROW 4: SIGNAL TICKER */}
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 mr-8">
             <div className="animate-ping w-2 h-2 bg-[var(--accent)] rounded-full" />
             <div className="text-[10px] font-black uppercase tracking-[0.4em]">X-Signal // RT</div>
          </div>
          <SignalTicker />
        </div>

        {/* ROW 5: STRATEGIC FINE PRINT (FUNDER) */}
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
