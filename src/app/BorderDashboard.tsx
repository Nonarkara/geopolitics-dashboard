"use client";

import React, { useState, useEffect } from "react";
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
import LogoStrip from "../components/Identity/LogoStrip";
import type { ProvinceSelection } from "../types/dashboard";

export default function BorderDashboard() {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--ink)] theme-border">
      {/* ── Top Bar (Connected Grid) ────────────────────────────────── */}
      <div className="connected-border-b">
        <TopBar
          onOpenManual={() => setIsManualOpen(true)}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Left Infrastructure (Connected Grid) ───────────────────── */}
        <aside className="hidden w-[300px] shrink-0 flex-col connected-border-r bg-[var(--bg-raised)] xl:flex">
          <Sidebar />
        </aside>

        {/* ── Primary Ops Surface (Unlimited Focus) ─────────────────── */}
        <div className="relative flex-1 min-w-0 bg-[#f0f0ee]">
          <BorderMap onProvinceSelect={setSelectedProvince} />
        </div>

        {/* ── Right Intel Column (Connected Grid) ────────────────────── */}
        <aside className="hidden w-[320px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--bg-raised)] 2xl:flex overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[var(--line)]">
            <section className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow opacity-60">OPERATIONAL BRIEFING</div>
                <span className="live-badge">Live</span>
              </div>
              <BriefingPanel />
            </section>
            
            <section className="p-4">
              <div className="eyebrow opacity-60 mb-3">SATELLITE INTEL</div>
              <LiveTVPanel />
            </section>

            <section className="p-4">
               <div className="eyebrow opacity-60 mb-3">INCIDENT FEED</div>
               <NewsDesk />
            </section>
          </div>
        </aside>
      </div>

      {/* ── Footer Analytics (Connected Grid) ───────────────────────── */}
      <footer className="z-40 flex h-[150px] shrink-0 border-t border-[var(--line)] bg-[var(--bg-surface)] divide-x divide-[var(--line)] overflow-hidden">
        <div className="w-[300px] p-4 flex flex-col justify-between shrink-0 connected-border-r">
          <div>
            <div className="eyebrow opacity-60 mb-2">PARTNERS</div>
            <LogoStrip className="mb-2 scale-75 origin-left" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-4">Security Surface Alpha</h3>
          </div>
        </div>
        
        <div className="flex-1 min-w-0 p-4">
          <div className="eyebrow opacity-60 mb-2">TRADE RADAR</div>
          <EconomicMonitor />
        </div>

        <div className="flex-1 min-w-0 p-4">
          <div className="eyebrow opacity-60 mb-2">FATALITY TRENDS</div>
          <ConflictTrends />
        </div>

        <div className="w-[280px] p-4 shrink-0 bg-[var(--bg-raised)]">
          <div className="eyebrow opacity-60 mb-2">CONFLICT SIGNALS</div>
          <div className="space-y-1.5 mt-2">
             {[
               { type: "CONFLICT", val: "Myanmar civil war", color: "text-[var(--danger)]" },
               { type: "DANGER", val: "Cambodia scan", color: "text-[var(--warning)]" },
               { type: "MILITARY", val: "Myawaddy sector", color: "text-[var(--danger)]" }
             ].map((s, i) => (
               <div key={i} className="flex items-center justify-between text-[10px] font-bold border-b border-[var(--line)] pb-1 last:border-0">
                  <span className={`${s.color} px-1.5 py-0.5 bg-white border border-[var(--line)] rounded-sm text-[8px]`}>{s.type}</span>
                  <span className="truncate ml-2">{s.val}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="w-[240px] p-4 shrink-0">
          <div className="eyebrow opacity-60 mb-2">INTEL SOURCES</div>
          <SourceStack />
        </div>
      </footer>

      {/* Global Ticker */}
      <div className="h-7 border-t border-[var(--line)] flex items-center bg-black text-white px-4 overflow-hidden">
        <div className="text-[9px] font-black uppercase tracking-widest mr-4 shrink-0">Global Signal Ticker</div>
        <SignalTicker />
      </div>

      <ProvinceDashboard province={selectedProvince} onClose={() => setSelectedProvince(null)} />
      <DashboardManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <DashboardArchitectureModal isOpen={isArchitectureOpen} onClose={() => setIsArchitectureOpen(false)} />
      <DatabaseExplorerModal isOpen={isDataExplorerOpen} onClose={() => setIsDataExplorerOpen(false)} />
    </main>
  );
}
