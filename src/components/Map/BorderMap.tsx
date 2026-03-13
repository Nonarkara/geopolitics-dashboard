"use client";

import { useEffect, useState } from "react";
import type { MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  Globe,
  Map as MapIcon,
  Satellite,
  Layers,
  Flame,
  CloudRain,
  Users,
} from "lucide-react";
import {
  createFireLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createJaxaRainLayer,
  createModisAquaLayer,
  createModisTerraLayer,
  createNightlightLayer,
  createRainfallLayer,
  createRefugeeLayer,
  createRegionalBorderLayer,
  createViirsTrueColorLayer,
} from "../../services/map-engine";
import type {
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
  RainfallPoint,
  RefugeeMovement,
  RegionBorderCollection,
} from "../../types/dashboard";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85,
  latitude: 14.2,
  zoom: 6.15,
  pitch: 26,
  bearing: -4,
};

const EMPTY_BORDERS: RegionBorderCollection = { type: "FeatureCollection", features: [] };

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showSatellite, setShowSatellite] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(82);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const incidentData = await fetch("/api/incidents").then(res => res.json()).catch(() => []);
      const fireData = await fetch("/api/fires").then(res => res.json()).catch(() => []);
      setIncidents(incidentData);
      setFires(fireData);
    };
    load();
  }, []);

  const layers = [
    showSatellite && createViirsTrueColorLayer(new Date().toISOString().split("T")[0], satelliteOpacity / 100),
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
  ].filter(Boolean);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#121212]">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) => setViewState(nv as MapViewState)}
        controller={true}
        layers={layers}
      >
        <MapboxMap mapboxAccessToken={MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/satellite-v9" attributionControl={false} />
      </DeckGL>

      {/* HERO CLOCK: Black / High Contrast Translucent */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="bg-black bg-opacity-80 px-10 py-6 rounded border border-white border-opacity-10 backdrop-blur-xl group">
           <div className="text-[64px] font-black text-white leading-none tracking-tighter text-numeric">
              11:58:34
           </div>
           <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-[10px] font-black text-white opacity-40 tracking-[0.3em] uppercase">Bangkok Sector</span>
              <span className="text-[10px] font-black text-[var(--accent)]">33°C AQI 128</span>
           </div>
        </div>
      </div>

      {/* FLOATING MAP INSTRUMENTATION: Working Layers */}
      <div className="pointer-events-auto absolute left-8 top-12 z-40 bg-[var(--bg-surface)] border border-[var(--line-bright)] p-6 shadow-2xl w-[280px]">
        <div className="eyebrow mb-4">THAILAND BORDER MONITOR</div>
        <h2 className="text-[18px] font-black uppercase mb-4 tracking-tight">START BROAD, THEN ADD A LAYER</h2>
        <div className="space-y-2">
          {[
            { label: "Incident heatmap", set: setShowHeatmap, active: showHeatmap, icon: Layers },
            { label: "Thermal anomalies", set: setShowFires, active: showFires, icon: Flame },
            { label: "Rainfall anomalies", set: setShowRainfall, active: showRainfall, icon: CloudRain },
          ].map(l => (
            <button key={l.label} onClick={() => l.set(!l.active)} className={`w-full flex items-center justify-between p-3 border transition-all ${l.active ? "bg-[var(--ink)] text-white" : "bg-[var(--bg-raised)] text-[var(--ink)]"}`}>
               <span className="text-[11px] font-black uppercase">{l.label}</span>
               <l.icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* FLOATING MAP INSTRUMENTATION: Imagery */}
      <div className="pointer-events-auto absolute right-8 top-12 z-40 bg-[var(--bg-surface)] border border-[var(--line-bright)] p-6 shadow-2xl w-[280px]">
        <div className="eyebrow mb-4 opacity-40">IMAGERY</div>
        <h2 className="text-[18px] font-black uppercase mb-4 tracking-tight">VIIRS True Color</h2>
        <div className="grid grid-cols-3 gap-1 mb-6">
           {["TRUE", "FALSE", "RELIEF"].map(t => (
             <button key={t} className="px-2 py-2 border border-[var(--line)] bg-[var(--bg-raised)] text-[9px] font-black">{t}</button>
           ))}
        </div>
        <div className="space-y-4">
           <div className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--bg-raised)]">
              <span className="text-[10px] font-black uppercase">Satellite Overlay</span>
              <Globe size={14} opacity={0.4} />
           </div>
           <div className="p-3 bg-[var(--accent)] text-white">
              <span className="text-[10px] font-black uppercase">Detailed Basemap</span>
           </div>
           <div className="pt-2">
              <div className="text-[9px] font-black opacity-30 uppercase mb-2">Opacity: {satelliteOpacity}%</div>
              <input type="range" className="w-full " value={satelliteOpacity} onChange={e => setSatelliteOpacity(parseInt(e.target.value))} />
           </div>
        </div>
      </div>
    </div>
  );
}
