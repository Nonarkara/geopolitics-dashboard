"use client";
import React, { useState } from "react";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import BriefingPanel from "../components/Intelligence/BriefingPanel";
import NewsDesk from "../components/Intelligence/NewsDesk";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import LiveTVPanel from "../components/Intelligence/LiveTVPanel";
import TopBar from "../components/Intelligence/TopBar";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import BorderMap from "../components/Map/BorderMap";
import Sidebar from "../components/Sidebar/Sidebar";
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
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--ink)] theme-border">
      <TopBar
        onOpenManual={() => setIsManualOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenDataExplorer={() => setIsDataExplorerOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Column: Watchpoints */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-raised)] xl:flex">
          <Sidebar />
        </aside>

        {/* Center: Command Map */}
        <div className="relative flex-1 min-w-0 bg-[#d8d0c4]">
          <BorderMap onProvinceSelect={setSelectedProvince} />
        </div>

        {/* Right Column: Briefing & Live Feeds */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--bg-raised)] 2xl:flex overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[var(--line)]">
            <section className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="eyebrow opacity-40">BRIEFING</div>
                <span className="live-badge">Live</span>
              </div>
              <BriefingPanel />
            </section>
            
            <section className="p-6">
              <div className="eyebrow opacity-40 mb-4">REGIONAL MONITORS</div>
              <LiveTVPanel />
            </section>

            <section className="p-6">
               <div className="eyebrow opacity-40 mb-4">LIVE FEED</div>
               <NewsDesk />
            </section>
          </div>
        </aside>
      </div>

      {/* Footer: Multi-Analytic Strip */}
      <footer className="z-40 flex h-[180px] shrink-0 border-t border-[var(--line-bright)] bg-[var(--bg-raised)] divide-x divide-[var(--line)] overflow-hidden">
        <div className="w-[320px] p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="eyebrow opacity-40 mb-2">MARKET RADAR</div>
            <h3 className="text-sm font-black uppercase">Trade & supply</h3>
          </div>
          <div className="text-[10px] leading-relaxed opacity-60">
            Source gaps: Bangkok Post, Matichon, BBC Thai, Deep South Security.
          </div>
        </div>
        
        <div className="flex-1 min-w-0 p-4">
          <div className="eyebrow opacity-40 mb-2">BY AREA</div>
          <EconomicMonitor />
        </div>

        <div className="flex-1 min-w-0 p-4">
          <div className="eyebrow opacity-40 mb-2">FATALITY TREND</div>
          <ConflictTrends />
        </div>

        <div className="w-[300px] p-4 shrink-0 bg-[var(--bg)]">
          <div className="eyebrow opacity-40 mb-2">CONFLICT SIGNALS</div>
          <div className="space-y-2">
             <div className="flex items-center justify-between text-[11px] font-bold border-b border-[var(--line)] pb-1 border-dotted">
                <span className="text-[var(--danger)]">CONFLICT</span>
                <span>Myanmar civil war</span>
             </div>
             <div className="flex items-center justify-between text-[11px] font-bold border-b border-[var(--line)] pb-1 border-dotted">
                <span className="text-[var(--warning)]">DANGER</span>
                <span>Cambodia scan compounds</span>
             </div>
             <div className="flex items-center justify-between text-[11px] font-bold border-b border-[var(--line)] pb-1 border-dotted">
                <span className="text-[var(--danger)]">MILITARY</span>
                <span>Myawaddy fighting</span>
             </div>
          </div>
        </div>

        <div className="w-[280px] p-4 shrink-0">
          <div className="eyebrow opacity-40 mb-2">SOURCES</div>
          <SourceStack />
        </div>
      </footer>

      {/* Global Ticker Footer */}
      <div className="h-8 border-t border-[var(--line)] flex items-center bg-[var(--bg)]">
        <SignalTicker />
      </div>

      <ProvinceDashboard
        province={selectedProvince}
        onClose={() => setSelectedProvince(null)}
      />

      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      <DatabaseExplorerModal isOpen={isDataExplorerOpen} onClose={() => setIsDataExplorerOpen(false)} />
    </main>
  );
}
