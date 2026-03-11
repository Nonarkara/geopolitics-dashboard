"use client";
import { useState } from "react";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import BriefingPanel from "../components/Intelligence/BriefingPanel";
import NewsDesk from "../components/Intelligence/NewsDesk";
import SignalTicker from "../components/Intelligence/SignalTicker";
import SourceStack from "../components/Intelligence/SourceStack";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import TimelineSlider from "../components/Analytics/TimelineSlider";
import BorderMap from "../components/Map/BorderMap";
import Sidebar from "../components/Sidebar/Sidebar";
import type { ProvinceSelection } from "../types/dashboard";

export default function Dashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#d8d0c3] text-[#121212] selection:bg-[#bfa36e]/50">
      <div className="grid h-full xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="hidden border-r border-[#cfc7b7] bg-[#e7e0d4] xl:block">
          <Sidebar />
        </div>

        <div className="grid min-w-0 grid-rows-[72px_104px_minmax(0,1fr)_280px] bg-[#f4efe7]">
          <div className="border-b border-[#cfc7b7] bg-[#ece6db]">
            <SignalTicker />
          </div>

          <div className="border-b border-[#cfc7b7] bg-[#f4efe7]">
            <EconomicMonitor />
          </div>

          <div className="relative min-h-0 border-b border-[#cfc7b7] bg-[#0d0d0d]">
            <BorderMap onProvinceSelect={setSelectedProvince} />
            <div className="absolute bottom-8 left-1/2 z-50 w-full max-w-[640px] -translate-x-1/2 px-6">
              <TimelineSlider />
            </div>
          </div>

          <div className="min-h-0 bg-[#f4efe7]">
            <ConflictTrends />
          </div>
        </div>

        <div className="hidden border-l border-[#cfc7b7] bg-[#ece6db] xl:grid xl:grid-rows-[320px_minmax(0,1fr)_300px]">
          <BriefingPanel />
          <NewsDesk />
          <SourceStack />
        </div>
      </div>

      <ProvinceDashboard
        province={selectedProvince}
        onClose={() => setSelectedProvince(null)}
      />
    </main>
  );
}
