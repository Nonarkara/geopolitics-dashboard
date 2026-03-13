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
} from "lucide-react";
import {
  createFireLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createRasterOverlayLayer,
  createViirsTrueColorLayer,
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
  zoom: 6.15,
  pitch: 35,
  bearing: -4,
};

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showSatellite, setShowSatellite] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(82);

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
  }, []);

  const getSafeDate = () => "2024-03-01";
  const safeDate = getSafeDate();

  const aerialLayer = createRasterOverlayLayer(
    {
      id: "esri-aerial",
      label: "ESRI Aerial",
      shortLabel: "AERIAL",
      description: "High-res aerial",
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

  const layers = [
    aerialLayer,
    showSatellite && createViirsTrueColorLayer(safeDate, satelliteOpacity / 100),
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
  ].filter(Boolean);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e0e0dc]">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) => setViewState(nv as MapViewState)}
        controller={true}
        layers={layers}
      >
        {hasMapboxToken ? (
          <MapboxMap mapboxAccessToken={MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/satellite-v9" attributionControl={false} />
        ) : (
          <div className="absolute inset-0 bg-[#0c121e]/5 pointer-events-none" />
        )}
      </DeckGL>

      {/* ── Apple-style Control Capsules ────────────────────────────── */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-2">
         <div className="control-capsule px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest border-r border-[var(--line)] pr-4">Active layers</span>
            <div className="flex gap-1">
               {[
                 { set: setShowHeatmap, active: showHeatmap, icon: Layers },
                 { set: setShowFires, active: showFires, icon: Flame },
               ].map((l, i) => (
                 <button key={i} onClick={() => l.set(!l.active)} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${l.active ? "bg-[var(--ink)] text-white" : "hover:bg-[var(--line)] text-[var(--ink)]"}`}>
                    <l.icon size={12} />
                 </button>
               ))}
            </div>
         </div>
         
         <div className="control-capsule">
            <Globe size={12} className="opacity-40" />
            <input 
              type="range" 
              className="w-24 accent-[var(--ink)]" 
              value={satelliteOpacity} 
              onChange={e => setSatelliteOpacity(parseInt(e.target.value))} 
            />
            <span className="text-[9px] font-black tabular-nums opacity-40 uppercase">{satelliteOpacity}%</span>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-2">
         <button className="control-capsule py-2 px-3 hover:bg-[var(--ink)] hover:text-white transition-all">
            <Compass size={14} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-widest">Recenter</span>
         </button>
         <button className="control-capsule py-2 px-3 hover:bg-[var(--ink)] hover:text-white transition-all">
            <Maximize2 size={14} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-widest">Full Space</span>
         </button>
      </div>
    </div>
  );
}
