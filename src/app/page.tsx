"use client";
import { useState } from "react";
import ConflictTrends from "../components/Analytics/ConflictTrends";
import EconomicMonitor from "../components/Analytics/EconomicMonitor";
import ProvinceDashboard from "../components/Analytics/ProvinceDashboard";
import TimelineSlider from "../components/Analytics/TimelineSlider";
import BorderMap from "../components/Map/BorderMap";
import Sidebar from "../components/Sidebar/Sidebar";
import type { ProvinceSelection } from "../types/dashboard";

export default function Dashboard() {
  const [selectedProvince, setSelectedProvince] =
    useState<ProvinceSelection | null>(null);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black selection:bg-blue-500/30">
      {/* Fixed Sidebar - Hidden on small screens or reduced width to preserve map space */}
      <div className="hidden xl:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">

        {/* Top Header / Stats Row - Glassmorphic Overlay */}
        <div className="absolute top-6 left-6 right-6 z-20 pointer-events-none">
          <div className="flex justify-start gap-4 h-24 pointer-events-auto">
            <div className="flex-1 max-w-5xl h-full">
              <EconomicMonitor />
            </div>
          </div>
        </div>

        {/* Map Engine - Full Screen background but interactive */}
        <div className="flex-1 relative z-0">
          <BorderMap onProvinceSelect={setSelectedProvince} />

          {/* Temporal Control Overlay */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[600px] px-6 z-50">
            <TimelineSlider />
          </div>
        </div>

        <ProvinceDashboard
          province={selectedProvince}
          onClose={() => setSelectedProvince(null)}
        />

        {/* Bottom Analytics Dock */}
        <div className="h-[30%] border-t border-white/5 bg-black/80 backdrop-blur-2xl p-6 relative z-10 shadow-[0_-30px_60px_rgba(0,0,0,0.9)] overflow-hidden">
          <ConflictTrends />
        </div>

        {/* Mobile Navigation / Toggle - Placeholder for future implementation */}
        <div className="xl:hidden absolute top-4 left-4 z-50">
          {/* Hamburger toggle could go here */}
        </div>

        {/* Global HUD Decorations */}
        <div className="absolute top-2 right-4 p-2 opacity-30 pointer-events-none uppercase text-[7px] font-mono tracking-widest leading-relaxed text-right md:block hidden">
          Operational Security Level: 4<br />
          System: Sentinel-X Strategic<br />
          Ref: {new Date().toISOString().split('T')[0]}
        </div>
      </div>
    </main>
  );
}
