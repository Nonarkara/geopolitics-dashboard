"use client";
import { useState } from "react";
import ConflictTrends from "../components/Phuket/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Phuket/Analytics/EconomicMonitor";
import TrendingKeywords from "../components/Phuket/Analytics/TrendingKeywords";
import BriefingPanel from "../components/Phuket/Intelligence/BriefingPanel";
import DashboardArchitectureModal from "../components/Phuket/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Phuket/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Phuket/Intelligence/DashboardManualModal";
import LiveTVPanel from "../components/Phuket/Intelligence/LiveTVPanel";
import NewsDesk from "../components/Phuket/Intelligence/NewsDesk";
import SignalTicker from "../components/Phuket/Intelligence/SignalTicker";
import SourceStack from "../components/Phuket/Intelligence/SourceStack";
import TopBar from "../components/Phuket/Intelligence/TopBar";
import ProvinceDashboard from "../components/Phuket/Analytics/ProvinceDashboard";
import BorderMap from "../components/Phuket/Map/BorderMap";
import Sidebar from "../components/Phuket/Sidebar/Sidebar";
import type { ProvinceSelection } from "../types/dashboard";

export default function PhuketDashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);

  const openManual = () => {
    setIsArchitectureOpen(false);
    setIsDataExplorerOpen(false);
    setIsManualOpen(true);
  };

  const openArchitecture = () => {
    setIsManualOpen(false);
    setIsDataExplorerOpen(false);
    setIsArchitectureOpen(true);
  };

  const openDataExplorer = () => {
    setIsManualOpen(false);
    setIsArchitectureOpen(false);
    setIsDataExplorerOpen(true);
  };

  return (
    <main
      data-surface="phuket-dashboard"
      className="relative grid h-[100dvh] w-screen grid-rows-[auto_1fr_auto] overflow-hidden bg-[var(--bg)] text-[var(--ink)]"
    >
      <TopBar
        onOpenManual={openManual}
        onOpenArchitecture={openArchitecture}
        onOpenDataExplorer={openDataExplorer}
      />

      <div className="flex min-h-0 flex-1 border-t border-[var(--line)] overflow-hidden">
        {/* Left Command Column - Tactical Slim */}
        <aside className="hidden w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--bg-raised)] xl:flex">
          <div className="border-b border-[var(--line)] px-3 py-1.5">
            <Sidebar />
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <section className="border-b border-[var(--line)] p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Tactical Brief</div>
              <BriefingPanel />
            </section>
            <section className="p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Feeds</div>
              <LiveTVPanel />
            </section>
          </div>
        </aside>

        {/* Central Operations Surface (Extreme Dominance) */}
        <div className="flex flex-1 flex-col min-w-0 bg-[var(--bg)]">
          <section className="relative flex-1 overflow-hidden">
            <BorderMap onProvinceSelect={setSelectedProvince} />
          </section>

          {/* Minimal Bottom Strip */}
          <section className="grid h-[120px] shrink-0 border-t border-[var(--line)] md:grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--line)] overflow-hidden bg-[var(--bg-raised)]">
            <div className="overflow-hidden p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Economy</div>
              <EconomicMonitor />
            </div>
            <div className="overflow-hidden p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Conflict</div>
              <ConflictTrends />
            </div>
            <div className="overflow-hidden p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Social</div>
              <TrendingKeywords />
            </div>
            <div className="overflow-hidden p-2">
              <div className="eyebrow mb-1 opacity-50 px-1">Assets</div>
              <SourceStack />
            </div>
          </section>
        </div>

        {/* Right Information Column - Slim */}
        <aside className="hidden w-[260px] shrink-0 flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-raised)] 2xl:flex">
          <section className="flex-1 overflow-y-auto p-2 no-scrollbar">
            <div className="eyebrow mb-2 opacity-50 px-1">Analysis</div>
            <NewsDesk />
          </section>
        </aside>
      </div>

      <div className="border-t border-[var(--line)]">
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
      <DatabaseExplorerModal
        isOpen={isDataExplorerOpen}
        onClose={() => setIsDataExplorerOpen(false)}
      />
    </main>
  );
}
