"use client";
import { useState } from "react";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import BriefingPanel from "../components/Intelligence/BriefingPanel";
import NewsDesk from "../components/Intelligence/NewsDesk";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import BorderMap from "../components/Map/BorderMap";
import Sidebar from "../components/Sidebar/Sidebar";
import type { ProvinceSelection } from "../types/dashboard";

export default function BorderDashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);

  return (
    <main className="relative grid h-[100dvh] w-screen grid-rows-[auto_1fr_auto] overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Banner - Signal Ticker */}
      <div className="z-50 border-b border-[var(--line)] bg-[var(--bg-raised)]">
        <SignalTicker />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Command Column */}
        <aside className="hidden w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--bg-raised)] xl:flex">
          <div className="border-b border-[var(--line)] px-3 py-1.5">
            <Sidebar />
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <section className="border-b border-[var(--line)] p-4">
              <div className="eyebrow mb-1 opacity-50">Operational Brief</div>
              <BriefingPanel />
            </section>
          </div>
        </aside>

        {/* Central Map Surface */}
        <div className="relative flex flex-1 flex-col min-w-0 bg-[#d8d0c4]">
          <BorderMap onProvinceSelect={setSelectedProvince} />
          
          {/* Dashboard Overlay - Minimal & Crisp */}
          <div className="pointer-events-none absolute inset-0 p-6">
            <div className="pointer-events-auto max-w-[340px]">
              <div className="dashboard-panel-strong rounded-2xl p-6">
                <div className="eyebrow">Thailand border monitor</div>
                <h1 className="pt-2 text-[24px] font-bold tracking-[-0.03em] text-[var(--ink)]">
                  Tactical awareness.
                </h1>
                <p className="pt-3 text-[13px] leading-relaxed text-[var(--muted)]">
                  Primary satellite monitoring with integrated regional briefing and market stress signals.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Dock */}
          <section className="pointer-events-none absolute bottom-6 left-6 right-6 z-40 hidden xl:grid xl:grid-cols-2 xl:gap-6">
            <div className="pointer-events-auto dashboard-panel overflow-hidden rounded-2xl h-[180px]">
              <div className="h-full overflow-y-auto no-scrollbar">
                <EconomicMonitor />
              </div>
            </div>
            <div className="pointer-events-auto dashboard-panel overflow-hidden rounded-2xl h-[180px]">
              <div className="h-full overflow-y-auto no-scrollbar">
                <ConflictTrends />
              </div>
            </div>
          </section>
        </div>

        {/* Right Intel Column */}
        <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-raised)] 2xl:flex">
          <section className="border-b border-[var(--line)] p-4">
            <div className="eyebrow mb-2 opacity-50">Local Analysis</div>
            <NewsDesk />
          </section>
          <section className="p-4">
            <div className="eyebrow mb-2 opacity-50">Assets</div>
            <SourceStack />
          </section>
        </aside>
      </div>

      <ProvinceDashboard
        province={selectedProvince}
        onClose={() => setSelectedProvince(null)}
      />
    </main>
  );
}
