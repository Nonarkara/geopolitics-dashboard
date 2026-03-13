"use client";

import { useEffect, useState } from "react";
import type { MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  Globe,
  Layers,
  Flame,
  CloudRain,
  Maximize2,
  Compass,
  Zap,
  Eye,
  Moon,
} from "lucide-react";
import {
  createFireLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createRasterOverlayLayer,
  createViirsTrueColorLayer,
  createModisTerraLayer,
  createModisAquaLayer,
  createModisFalseColorLayer,
  createBlueMarbleLayer,
  createNightlightLayer,
  createJaxaRainLayer,
} from "../../services/map-engine";
import type {
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
} from "../../types/dashboard";
import { getUsableMapboxToken } from "../../lib/mapbox";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const RAW_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_TOKEN = getUsableMapboxToken(RAW_TOKEN);

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85,
  latitude: 14.2,
  zoom: 6.25,
  pitch: 40,
  bearing: 0,
};

type LensType = "VIIRS" | "AQUA" | "TERRA" | "FALSE" | "BLUE" | "NIGHT" | "RAIN";

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(85);
  const [activeLens, setActiveLens] = useState<LensType>("VIIRS");

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);

  const hasMapboxToken = MAPBOX_TOKEN.length > 0;

  useEffect(() => {
    const load = async () => {
      const incidentData = await fetch("/api/incidents").then(res => res.json()).catch(() => []);
      const fireData = await fetch("/api/fires").then(res => res.json()).catch(() => []);
      setIncidents(incidentData);
      setFires(fireData);
    };
    load();
    const poll = setInterval(load, 30000); // 30s Refreshes
    return () => clearInterval(poll);
  }, []);

  const getSafeDate = () => "2024-03-01";
  const safeDate = getSafeDate();

  const aerialLayer = createRasterOverlayLayer(
    {
      id: "esri-aerial",
      label: "ESRI Aerial",
      shortLabel: "AERIAL",
      description: "Fallback surface",
      source: "ESRI",
      family: "imagery",
      role: "base-option",
      kind: "raster" as const,
      defaultOpacity: 1,
      enabledByDefault: true,
      maxZoom: 19,
      tileTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      updatedAt: new Date().toISOString(),
    },
    1
  );

  const satelliteLayers = {
    VIIRS: createViirsTrueColorLayer(safeDate, satelliteOpacity / 100),
    AQUA: createModisAquaLayer(safeDate, satelliteOpacity / 100),
    TERRA: createModisTerraLayer(safeDate, satelliteOpacity / 100),
    FALSE: createModisFalseColorLayer(safeDate, satelliteOpacity / 100),
    BLUE: createBlueMarbleLayer(safeDate, satelliteOpacity / 100),
    NIGHT: createNightlightLayer(),
    RAIN: createJaxaRainLayer(safeDate),
  };

  const layers = [
    aerialLayer,
    satelliteLayers[activeLens],
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
  ].filter(Boolean);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) => setViewState(nv as MapViewState)}
        controller={true}
        layers={layers}
      >
        {hasMapboxToken ? (
          <MapboxMap mapboxAccessToken={MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/satellite-v9" attributionControl={false} />
        ) : (
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        )}
      </DeckGL>

      {/* ── Lens Matrix (Connected Grid) ─────────────────────────── */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-1.5">
         <div className="flex bg-white h-7 connected-grid shadow-2xl">
            {[
              { id: "VIIRS", label: "VRS", desc: "VIIRS True" },
              { id: "AQUA", label: "AQU", desc: "Modis Aqua" },
              { id: "TERRA", label: "TER", desc: "Modis Terra" },
              { id: "FALSE", label: "FLS", desc: "False Color" },
              { id: "BLUE", label: "BLU", desc: "Blue Marble" },
              { id: "NIGHT", label: "NGT", desc: "Nightlights" },
              { id: "RAIN", label: "RNF", desc: "Precipitation" },
            ].map(l => (
              <button 
                key={l.id} 
                onClick={() => setActiveLens(l.id as LensType)} 
                className={`px-3 flex items-center justify-center transition-all group ${activeLens === l.id ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--bg)]"}`}
                title={l.desc}
              >
                 <span className="text-[10px] font-black tracking-widest">{l.label}</span>
              </button>
            ))}
         </div>

         <div className="flex bg-white h-7 connected-grid shadow-2xl">
            {[
              { active: showHeatmap, set: setShowHeatmap, label: "HEATMAP", icon: Layers },
              { active: showFires, set: setShowFires, label: "THERMAL", icon: Flame },
            ].map((t, i) => (
              <button key={i} onClick={() => t.set(!t.active)} className={`px-4 flex items-center gap-2 transition-all ${t.active ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--bg)]"}`}>
                 <t.icon size={10} />
                 <span className="text-[9px] font-black tracking-widest">{t.label}</span>
              </button>
            ))}
         </div>

         <div className="flex bg-white h-7 items-center border border-[var(--line)] px-3 gap-3 shadow-2xl">
            <Eye size={10} className="opacity-40" />
            <input 
              type="range" 
              className="w-20 accent-black scale-y-50" 
              value={satelliteOpacity} 
              onChange={e => setSatelliteOpacity(parseInt(e.target.value))} 
            />
            <span className="text-[9px] font-black tabular-nums opacity-40">{satelliteOpacity}%</span>
         </div>
      </div>

      {/* ── Dashboard Pulse Utility ── */}
      <div className="absolute bottom-6 left-6 z-40">
         <div className="flex items-center gap-3 bg-[var(--ink)] text-white px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
               <Zap size={12} className="text-[var(--accent)] animate-pulse" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black opacity-40 uppercase">Incidents</span>
                  <span className="text-[11px] font-black tabular-nums">{incidents.length}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black opacity-40 uppercase">Thermal</span>
                  <span className="text-[11px] font-black tabular-nums">{fires.length}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-1">
         <button className="h-8 w-8 bg-white border border-[var(--line)] flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Compass size={14} strokeWidth={3} />
         </button>
         <button className="h-8 w-8 bg-white border border-[var(--line)] flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Maximize2 size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
