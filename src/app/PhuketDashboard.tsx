"use client";
import { useState } from "react";
import BriefingPanel from "../components/Phuket/Intelligence/BriefingPanel";
import BottomIntelRail from "../components/Phuket/Intelligence/BottomIntelRail";
import DashboardArchitectureModal from "../components/Phuket/Intelligence/DashboardArchitectureModal";
import DatabaseExplorerModal from "../components/Phuket/Intelligence/DatabaseExplorerModal";
import DashboardManualModal from "../components/Phuket/Intelligence/DashboardManualModal";
import TopBar from "../components/Phuket/Intelligence/TopBar";
import ProvinceDashboard from "../components/Phuket/Analytics/ProvinceDashboard";
import BorderMap from "../components/Phuket/Map/BorderMap";
import Sidebar from "../components/Phuket/Sidebar/Sidebar";
import MobileDrawer from "../components/Common/MobileDrawer";
import type { ProvinceSelection } from "../types/dashboard";
import { isDataExplorerEnabled } from "../lib/feature-flags";

export default function PhuketDashboard() {
  const dataExplorerEnabled = isDataExplorerEnabled();
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);

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
        onOpenDataExplorer={dataExplorerEnabled ? openDataExplorer : undefined}
      />

      <div className="flex min-h-0 flex-1 border-t border-[var(--line)] overflow-hidden">
        {/* Left Command Column - Tactical Slim. Compressed on tablet (md-lg),
            full width on desktop (lg+). */}
        <aside className="hidden w-[200px] shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--bg-raised)] md:flex lg:w-[240px] xl:flex">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Sidebar />
            <section className="border-t border-[var(--line)] p-3">
              <div className="eyebrow mb-2 opacity-50">Tactical Brief</div>
              <BriefingPanel />
            </section>
          </div>
        </aside>

        {/* Central Operations Surface (Extreme Dominance) */}
        <div className="flex flex-1 flex-col min-w-0 bg-[var(--bg)]">
          <section className="relative flex-1 overflow-hidden">
            <BorderMap onProvinceSelect={setSelectedProvince} />
            {/* MOBILE: command column is hidden below md — surface it (§11.8) */}
            <button
              type="button"
              onClick={() => setIsPanelsOpen(true)}
              aria-label="Open command panels"
              className="absolute left-2 top-2 z-40 flex h-11 items-center gap-2 border border-[var(--line)] bg-[var(--bg-raised)] px-3 text-[14px] font-black uppercase tracking-[0.18em] text-[var(--ink)] md:hidden"
            >
              <span aria-hidden="true">&#9776;</span> Panels
            </button>
          </section>

          <BottomIntelRail />
        </div>
      </div>

      {/* MOBILE COMMAND PANELS (same content as the desktop aside) */}
      <MobileDrawer
        isOpen={isPanelsOpen}
        onClose={() => setIsPanelsOpen(false)}
        title="Command Panels"
      >
        <Sidebar />
        <section className="border-t border-[var(--line)] p-3">
          <div className="eyebrow mb-2 opacity-50">Tactical Brief</div>
          <BriefingPanel />
        </section>
      </MobileDrawer>

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
      {dataExplorerEnabled ? (
        <DatabaseExplorerModal
          isOpen={isDataExplorerOpen}
          onClose={() => setIsDataExplorerOpen(false)}
        />
      ) : null}
    </main>
  );
}
