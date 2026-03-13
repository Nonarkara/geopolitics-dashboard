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
  Plane,
  Users,
  Target,
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
  createFlightPathsLayer,
  createRefugeeLayer,
  createConflictZonesLayer,
  createProvinceLabelsLayer,
} from "../../services/map-engine";
import type {
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
  FlightData,
  RefugeeMovement,
  ConflictZoneCollection,
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
  
  // Intelligence States
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  const [satelliteOpacity, setSatelliteOpacity] = useState(85);
  const [activeLens, setActiveLens] = useState<LensType>("VIIRS");

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [zones, setZones] = useState<ConflictZoneCollection | null>(null);

  const hasMapboxToken = MAPBOX_TOKEN.length > 0;

  useEffect(() => {
    const load = async () => {
      const [inc, fir, flt, ref, zn] = await Promise.all([
        fetch("/api/incidents").then(res => res.json()).catch(() => []),
        fetch("/api/fires").then(res => res.json()).catch(() => []),
        fetch("/api/flights").then(res => res.json()).catch(() => []),
        fetch("/api/refugees").then(res => res.json()).catch(() => []),
        fetch("/api/map/overlays").then(res => res.json()).catch(() => null),
      ]);
      setIncidents(inc);
      setFires(fir);
      setFlights(flt);
      setRefugees(ref);
      setZones(zn);
    };
    load();
    const poll = setInterval(load, 30000); // High-frequency polling
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
    showZones && zones && createConflictZonesLayer(zones),
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
    showRefugees && createRefugeeLayer(refugees),
    showFlights && createFlightPathsLayer(flights),
    showLabels && createProvinceLabelsLayer(),
  ].flat().filter(Boolean);

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
              { active: showHeatmap, set: setShowHeatmap, label: "HEAT", icon: Layers },
              { active: showFires, set: setShowFires, label: "THRM", icon: Flame },
              { active: showFlights, set: setShowFlights, label: "AIR", icon: Plane },
              { active: showRefugees, set: setShowRefugees, label: "REF", icon: Users },
              { active: showZones, set: setShowZones, label: "ZONE", icon: Target },
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

      {/* ── Operational Intelligence HUD ── */}
      <div className="absolute bottom-6 left-6 z-40 space-y-2">
         <div className="flex items-center gap-4 bg-[var(--ink)] text-white px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
               <Zap size={12} className="text-[var(--accent)] animate-pulse" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Tactical Pulse</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: "SIGNALS", val: incidents.length },
                 { label: "THERMAL", val: fires.length },
                 { label: "TRAFFIC", val: flights.length },
                 { label: "DISPL", val: refugees.length },
               ].map(m => (
                 <div key={m.label} className="flex flex-col">
                    <span className="text-[7px] font-black opacity-40 uppercase">{m.label}</span>
                    <span className="text-[11px] font-black tabular-nums leading-none">{m.val}</span>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-white/90 border border-[var(--line)] px-3 py-1.5 shadow-xl">
            <div className={`h-2 w-2 rounded-full ${hasMapboxToken ? 'bg-[var(--safe)]' : 'bg-[var(--hazard)]'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Engine: Deck.GL + {hasMapboxToken ? 'Mapbox Satellite' : 'ESRI Fallback'}</span>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-1">
         <button onClick={() => setViewState(INITIAL_VIEW_STATE)} className="h-8 w-8 bg-white border border-[var(--line)] flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Compass size={14} strokeWidth={3} />
         </button>
         <button className="h-8 w-8 bg-white border border-[var(--line)] flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Maximize2 size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
