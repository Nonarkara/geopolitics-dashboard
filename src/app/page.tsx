"use client";
import { useState } from "react";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import TrendingKeywords from "../components/Analytics/TrendingKeywords";
import BriefingPanel from "../components/Intelligence/BriefingPanel";
import DashboardArchitectureModal from "../components/Intelligence/DashboardArchitectureModal";
import DashboardManualModal from "../components/Intelligence/DashboardManualModal";
import LiveTVPanel from "../components/Intelligence/LiveTVPanel";
import NewsDesk from "../components/Intelligence/NewsDesk";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import TopBar from "../components/Intelligence/TopBar";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import BorderMap from "../components/Map/BorderMap";
import Sidebar from "../components/Sidebar/Sidebar";
import type { ProvinceSelection } from "../types/dashboard";

export default function Dashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  const openManual = () => {
    setIsArchitectureOpen(false);
    setIsManualOpen(true);
  };

  const openArchitecture = () => {
    setIsManualOpen(false);
    setIsArchitectureOpen(true);
  };

  return (
    <main className="relative flex h-[100dvh] w-screen flex-col overflow-y-auto overflow-x-hidden bg-[var(--bg)] text-[var(--ink)] xl:overflow-hidden">
      {/* Top clock bar */}
      <TopBar onOpenManual={openManual} onOpenArchitecture={openArchitecture} />

      {/* Title bar */}
      <div className="flex h-[44px] items-center justify-center gap-6 border-b border-[var(--line)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4">
          <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-[var(--ink)]">
            Thailand Geopolitical Watch
          </span>
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--cool)]">
            Sentinel X
          </span>
        </div>
        <div className="h-4 w-px bg-[var(--line-bright)]" />
        <span className="text-[9px] tracking-[0.12em] text-[var(--muted)]">
          by Assoc. Prof. Poon Thiengburanathum, PhD
        </span>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        {/* Left sidebar */}
        <div className="order-3 w-full flex-shrink-0 border-b border-[var(--line)] bg-[var(--bg-surface)] xl:order-1 lg:w-[240px] xl:w-[280px] xl:border-b-0 xl:border-r">
          <Sidebar />
        </div>

        {/* Center: Map + bottom panels */}
        <div className="relative flex min-w-0 flex-1 order-1 flex-col xl:order-2">
          {/* Map area */}
          <div className="relative flex-1 min-h-[500px] xl:min-h-0">
            <BorderMap onProvinceSelect={setSelectedProvince} />
          </div>

          {/* Bottom strip: Market + Trends + Charts + Sources */}
          <div className="grid h-auto flex-shrink-0 grid-cols-1 md:grid-cols-2 xl:h-[190px] xl:grid-cols-4 border-t border-[var(--line)]">
            <div className="border-b xl:border-b-0 xl:border-r border-[var(--line)] overflow-hidden">
              <EconomicMonitor />
            </div>
            <div className="border-b md:border-b-0 md:border-r xl:border-r border-[var(--line)] overflow-hidden">
              <ConflictTrends />
            </div>
            <div className="border-b md:border-b-0 xl:border-r border-[var(--line)] overflow-hidden">
              <TrendingKeywords />
            </div>
            <div className="overflow-hidden">
              <SourceStack />
            </div>
          </div>
        </div>

        {/* Right intel panels */}
        <div className="order-2 flex w-full flex-shrink-0 flex-col border-t border-[var(--line)] bg-[var(--bg-surface)] xl:order-3 lg:w-[280px] xl:w-[340px] xl:border-t-0 xl:border-l">
          <div className="h-[300px] overflow-hidden border-b border-[var(--line)] xl:flex-1">
            <BriefingPanel />
          </div>
          <div className="min-h-[280px] h-auto flex-shrink-0 border-b border-[var(--line)] xl:h-[280px] xl:overflow-hidden">
            <LiveTVPanel />
          </div>
          <div className="h-[400px] overflow-hidden xl:flex-1">
            <NewsDesk />
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="flex-shrink-0 border-t border-[var(--line)]">
        <SignalTicker />
      </div>

      <ProvinceDashboard
        province={selectedProvince}
        onClose={() => setSelectedProvince(null)}
      />

      <DashboardManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
      <DashboardArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </main>
  );
}
