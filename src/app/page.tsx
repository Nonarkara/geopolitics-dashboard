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
import TopBar from "../components/Intelligence/TopBar";
import type { ProvinceSelection } from "../types/dashboard";

export default function Dashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f3eee5] text-[#171512]">
      <TopBar 
        onOpenManual={() => {}} 
        onOpenArchitecture={() => {}} 
        onOpenDataExplorer={() => {}} 
        variant="original"
      />
      <div className="flex h-full min-h-0">
        <div className="hidden border-r border-[#d6cebf] bg-[#eae3d8] xl:block">
          <Sidebar />
        </div>

        <div className="relative min-w-0 flex-1 bg-[#d8d0c4]">
          <BorderMap onProvinceSelect={setSelectedProvince} />

          <div className="pointer-events-none absolute inset-0">
            <div className="pointer-events-auto absolute left-4 top-4 z-40 max-w-[340px] xl:hidden">
              <div className="dashboard-panel-strong rounded-[26px] p-5">
                <div className="eyebrow">Thailand border monitor</div>
                <h1 className="pt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#171512]">
                  Satellite detail first, context second.
                </h1>
                <p className="pt-3 text-[14px] leading-6 text-[#4a453d]">
                  Read the map as the primary surface, then use the briefing,
                  live feed, and market panels to understand why the pattern
                  matters.
                </p>
              </div>
            </div>

            <div className="pointer-events-auto absolute left-4 right-4 top-4 z-40 xl:left-4 xl:right-[404px]">
              <div className="dashboard-panel overflow-hidden rounded-[24px]">
                <SignalTicker />
              </div>
            </div>

            <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-40 hidden xl:grid xl:right-[404px] xl:grid-cols-[292px_minmax(0,1fr)] xl:gap-4">
              <div className="dashboard-panel overflow-hidden rounded-[24px]">
                <EconomicMonitor />
              </div>
              <div className="dashboard-panel overflow-hidden rounded-[24px]">
                <ConflictTrends />
              </div>
            </div>

            <div className="pointer-events-auto absolute bottom-4 right-4 top-24 z-40 hidden w-[376px] xl:grid xl:grid-rows-[312px_minmax(0,1fr)_244px] gap-4">
              <div className="dashboard-panel-strong overflow-hidden rounded-[24px]">
                <BriefingPanel />
              </div>
              <div className="dashboard-panel overflow-hidden rounded-[24px]">
                <NewsDesk />
              </div>
              <div className="dashboard-panel overflow-hidden rounded-[24px]">
                <SourceStack />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProvinceDashboard
        province={selectedProvince}
        onClose={() => setSelectedProvince(null)}
      />
    </main>
  );
}
