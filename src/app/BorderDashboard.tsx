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
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import DashboardArchitectureModal from "../components/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Intelligence/DashboardManualModal";
import type { ProvinceSelection } from "../types/dashboard";

export default function BorderDashboard() {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-black theme-border">
      {/* ── Absolute Operational Grid ── */}
      <div className="flex flex-col h-full connected-grid">
        
        {/* ROW 1: MISSION HEADER */}
        <header className="grid-cell shrink-0 z-50">
          <TopBar
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
          />
        </header>

        {/* ROW 2: PRIMARY INTELLIGENCE SURFACE */}
        <div className="flex flex-1 min-h-0 connected-grid">
          {/* COL 1: LEFT WATCHPOINTS */}
          <aside className="hidden w-[300px] shrink-0 xl:flex grid-cell flex-col">
            <Sidebar />
          </aside>

          {/* COL 2: GLOBAL OPS SURFACE */}
          <div className="flex-1 min-w-0 grid-cell bg-[#111]">
            <BorderMap onProvinceSelect={setSelectedProvince} />
          </div>

          {/* COL 3: RIGHT FEEDS */}
          <aside className="hidden w-[320px] shrink-0 2xl:flex overflow-hidden grid-cell flex-col">
            <div className="flex flex-col h-full divide-y-[1.5px] divide-[var(--line)]">
              {/* TOP: BRIEFING */}
              <section className="p-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="eyebrow">BRIEFING UNIT</div>
                  <span className="live-badge">Live</span>
                </div>
                <BriefingPanel />
              </section>
              
              {/* MID: SATELLITE SENSORS */}
              <section className="p-4 shrink-0 bg-[var(--bg)]">
                <div className="eyebrow mb-3">SATELLITE SENSORS</div>
                <LiveTVPanel />
              </section>

              {/* BOTTOM: LIVE INTEL FEED */}
              <section className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
                 <div className="eyebrow mb-3">LIVE INTEL STREAM</div>
                 <div className="flex-1 overflow-y-auto no-scrollbar">
                    <NewsDesk />
                 </div>
              </section>
            </div>
          </aside>
        </div>

        {/* ROW 3: ANALYTIC FOOTER */}
        <footer className="h-[140px] shrink-0 connected-grid grid-cell divide-x-[1.5px] divide-[var(--line)]">
          <div className="w-[300px] p-4 flex flex-col justify-between shrink-0 bg-white">
             <div>
                <div className="eyebrow mb-1">DATA STATUS</div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] leading-tight">Connected Grid V2</h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-1.5 w-1.5 bg-[var(--safe)] rounded-full animate-pulse" />
                   <span className="text-[9px] font-black opacity-40 uppercase">Satellite Sync Alpha</span>
                </div>
             </div>
             <p className="text-[8px] font-black opacity-20 uppercase tracking-[0.4em]">Axiom // Strategic</p>
          </div>
          
          <div className="flex-1 p-4 bg-white">
            <div className="eyebrow mb-2">TRADE & SUPPLY</div>
            <EconomicMonitor />
          </div>

          <div className="flex-1 p-4 bg-white">
            <div className="eyebrow mb-2">FATALITY SIGNAL</div>
            <ConflictTrends />
          </div>

          <div className="w-[280px] p-4 bg-[var(--bg)] flex flex-col">
            <div className="eyebrow mb-3">CONFLICT MONITOR</div>
            <div className="space-y-1.5">
               {[
                 { type: "WAR", val: "Myanmar civil war", color: "text-[var(--danger)]" },
                 { type: "SEC", val: "Border infiltration", color: "text-[var(--hazard)]" },
                 { type: "OPS", val: "Myawaddy sector", color: "text-[var(--danger)]" }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between text-[10px] font-black border-b border-[var(--line)] pb-1.5 last:border-0 border-dotted">
                    <span className={`${s.color} px-1.5 py-0.5 bg-white border border-[var(--line)] text-[8px]`}>{s.type}</span>
                    <span className="truncate ml-2 uppercase tracking-tighter">{s.val}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="w-[240px] p-4 bg-white">
            <div className="eyebrow mb-2">PRIMARY SOURCE</div>
            <SourceStack />
          </div>
        </footer>

        {/* ROW 4: SIGNAL TICKER */}
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0 border-t border-white/10">
          <div className="flex items-center gap-3 mr-6">
             <div className="animate-ping w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
             <div className="text-[9px] font-black uppercase tracking-[0.4em]">X-Signal // Realtime</div>
          </div>
          <SignalTicker />
        </div>
      </div>

      {/* Overlays */}
      <ProvinceDashboard province={selectedProvince} onClose={() => setSelectedProvince(null)} />
      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      <DatabaseExplorerModal isOpen={isDataExplorerOpen} onClose={() => setIsDataExplorerOpen(false)} />
    </main>
  );
}
