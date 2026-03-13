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
      {/* ── Connected Grid Container ── */}
      <div className="flex flex-col h-full connected-grid">
        
        {/* Row 1: TopBar */}
        <header className="grid-cell shrink-0">
          <TopBar
            onOpenManual={() => setIsManualOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
          />
        </header>

        {/* Row 2: Main Ops Surface */}
        <div className="flex flex-1 min-h-0 connected-grid">
          {/* Col 1: Left Intelligence */}
          <aside className="hidden w-[300px] shrink-0 xl:flex grid-cell">
            <Sidebar />
          </aside>

          {/* Col 2: High Stakes Map */}
          <div className="flex-1 min-w-0 bg-[#e0e0dc] grid-cell">
            <BorderMap onProvinceSelect={setSelectedProvince} />
          </div>

          {/* Col 3: Right Intelligence */}
          <aside className="hidden w-[320px] shrink-0 2xl:flex overflow-hidden grid-cell">
            <div className="flex flex-col h-full divide-y divide-[var(--line)]">
              <section className="p-4 flex-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="eyebrow">BRIEFING</div>
                  <span className="live-badge scale-90">Live</span>
                </div>
                <BriefingPanel />
              </section>
              
              <section className="p-4 flex-none">
                <div className="eyebrow mb-3">SATELLITE</div>
                <LiveTVPanel />
              </section>

              <section className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
                 <div className="eyebrow mb-3">INCIDENTS</div>
                 <div className="flex-1 overflow-y-auto no-scrollbar">
                    <NewsDesk />
                 </div>
              </section>
            </div>
          </aside>
        </div>

        {/* Row 3: Footer Analytics */}
        <footer className="h-[140px] shrink-0 connected-grid grid-cell divide-x divide-[var(--line)]">
          <div className="w-[300px] p-4 flex flex-col justify-between shrink-0">
             <div className="eyebrow opacity-40">ALPHA SURFACE</div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1">Grid Operational</h3>
             <p className="text-[8px] font-bold opacity-30 leading-tight">PRECISION TACTICAL INTERFACE V1.0</p>
          </div>
          
          <div className="flex-1 p-3">
            <div className="eyebrow mb-1">TRADE</div>
            <EconomicMonitor />
          </div>

          <div className="flex-1 p-3">
            <div className="eyebrow mb-1">CONFL</div>
            <ConflictTrends />
          </div>

          <div className="w-[280px] p-3 bg-[var(--bg)] flex flex-col">
            <div className="eyebrow mb-2">SIGNALS</div>
            <div className="space-y-1">
               {[
                 { type: "WAR", val: "Myanmar civil war", color: "text-[var(--danger)]" },
                 { type: "SEC", val: "Cambodia scan", color: "text-[var(--warning)]" },
                 { type: "OPS", val: "Myawaddy sector", color: "text-[var(--danger)]" }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between text-[9px] font-black border-b border-[var(--line)] pb-1 last:border-0 border-dotted">
                    <span className={`${s.color} px-1.5 py-0.5 bg-white border border-[var(--line)] text-[7px]`}>{s.type}</span>
                    <span className="truncate ml-2">{s.val}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="w-[240px] p-3">
            <div className="eyebrow mb-1">SOURCE</div>
            <SourceStack />
          </div>
        </footer>

        {/* Row 4: Global Ticker */}
        <div className="h-7 bg-black text-white flex items-center px-4 overflow-hidden shrink-0">
          <div className="text-[8px] font-black uppercase tracking-widest mr-4">STRL // SIGNALS</div>
          <SignalTicker />
        </div>
      </div>

      <ProvinceDashboard province={selectedProvince} onClose={() => setSelectedProvince(null)} />
      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      <DatabaseExplorerModal isOpen={isDataExplorerOpen} onClose={() => setIsDataExplorerOpen(false)} />
    </main>
  );
}
