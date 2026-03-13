"use client";

import { useEffect, useState, useMemo } from "react";
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
  ChevronRight,
  ChevronDown,
  Activity,
  Waves,
  Wind,
} from "lucide-react";
import {
  createFireLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createRasterOverlayLayer,
  createGIBSLayer,
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

interface LensConfig {
  id: string;
  label: string;
  name: string;
  layer: string;
  format: "jpg" | "png";
  maxZoom: number;
  api: "GIBS" | "JAXA" | "COPERNICUS";
  description?: string;
}

const STRATEGIC_LENSES: Record<string, LensConfig[]> = {
  "TRUE COLOR (OPTICAL)": [
    { id: "VRS", label: "VRS", name: "VIIRS SNPP True Color", layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "AQU", label: "AQU", name: "MODIS Aqua True Color", layer: "MODIS_Aqua_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "TER", label: "TER", name: "MODIS Terra True Color", layer: "MODIS_Terra_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "N20", label: "N20", name: "VIIRS NOAA-20 True Color", layer: "VIIRS_NOAA20_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
  ],
  "FALSE COLOR (MULTISPECTRAL)": [
    { id: "FLS", label: "MOD", name: "MODIS Terra Bands 721", layer: "MODIS_Terra_CorrectedReflectance_Bands721", format: "jpg", maxZoom: 9, api: "GIBS", description: "Vegetation & Burn Scar detection" },
    { id: "VFS", label: "VRS", name: "VIIRS False Color", layer: "VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "SWI", label: "SWI", name: "Shortwave Infrared (Bands 7-2-1)", layer: "MODIS_Terra_SurfaceReflectance_Bands721", format: "jpg", maxZoom: 9, api: "GIBS" },
  ],
  "ATMOSPHERIC & SENSORS": [
    { id: "NGT", label: "NGT", name: "VIIRS Night Lights", layer: "VIIRS_SNPP_DayNightBand_AtSensor_M15", format: "png", maxZoom: 8, api: "GIBS" },
    { id: "RNF", label: "RNF", name: "IMERG Precipitation Rate", layer: "IMERG_Precipitation_Rate", format: "png", maxZoom: 6, api: "GIBS" },
    { id: "AOD", label: "AOD", name: "MODIS Aerosol Optical Depth", layer: "MODIS_Terra_Aerosol_Optical_Depth_Land_Ocean", format: "png", maxZoom: 6, api: "GIBS" },
    { id: "LST", label: "LST", name: "MODIS Land Surface Temp", layer: "MODIS_Terra_LST_Day", format: "png", maxZoom: 7, api: "GIBS" },
    { id: "NO2", label: "NO2", name: "OMPS Nitrogen Dioxide", layer: "OMPS_NPP_NO2_Total_Column_Daily", format: "png", maxZoom: 6, api: "GIBS" },
  ],
  "JAXA/ENVIRONMENTAL": [
    { id: "JRN", label: "GPM", name: "JAXA GPM Rainfall", layer: "JAXA_GPM_L3_Rainfall_Rate_Monthly", format: "png", maxZoom: 6, api: "GIBS" },
    { id: "CO", label: "CO", name: "MOPITT Carbon Monoxide", layer: "MOPITT_Carbon_Monoxide_Total_Column_Day", format: "png", maxZoom: 5, api: "GIBS" },
    { id: "SM", label: "SM", name: "SMAP Soil Moisture (Passive)", layer: "SMAP_L3_Passive_Soil_Moisture_6km_Total_Column_Day", format: "png", maxZoom: 6, api: "GIBS" },
  ]
};

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  
  // Tactical States
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  const [satelliteOpacity, setSatelliteOpacity] = useState(85);
  const [activeLensId, setActiveLensId] = useState("VRS");
  const [openCategory, setOpenCategory] = useState<string | null>("TRUE COLOR (OPTICAL)");

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
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);

  const safeDate = "2024-03-01";

  const activeLens = useMemo(() => {
    for (const cat in STRATEGIC_LENSES) {
      const match = STRATEGIC_LENSES[cat].find(l => l.id === activeLensId);
      if (match) return match;
    }
    return STRATEGIC_LENSES["TRUE COLOR (OPTICAL)"][0];
  }, [activeLensId]);

  const satelliteLayer = useMemo(() => {
    return createGIBSLayer({
      id: `gibs-${activeLens.id}`,
      layer: activeLens.layer,
      date: activeLens.id === "NGT" ? "default" : safeDate,
      opacity: satelliteOpacity / 100,
      maxZoom: activeLens.maxZoom,
      format: activeLens.format,
    });
  }, [activeLens, satelliteOpacity]);

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

  const layers = [
    aerialLayer,
    satelliteLayer,
    showZones && zones && createConflictZonesLayer(zones),
    showHeatmap ? createHeatmapLayer(incidents || []) : createIncidentLayer(incidents || []),
    showFires && createFireLayer(fires || []),
    showRefugees && createRefugeeLayer(refugees || []),
    showFlights && createFlightPathsLayer(flights || []),
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

      {/* ── Lens Matrix (Categorized & High Density) ─────────────────────────── */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-2 w-72">
         <div className="bg-white connected-grid shadow-2xl overflow-hidden border border-black">
            <div className="px-3 py-2 bg-[var(--ink)] text-white flex items-center justify-between border-b border-black">
               <div className="flex items-center gap-2">
                  <Globe size={12} className="text-[var(--accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategic Lens Selection</span>
               </div>
            </div>
            
            <div className="max-h-[340px] overflow-y-auto no-scrollbar bg-[var(--bg)]">
               {Object.entries(STRATEGIC_LENSES).map(([category, lenses]) => (
                  <div key={category} className="border-b border-[var(--line)] last:border-0">
                     <button 
                        onClick={() => setOpenCategory(openCategory === category ? null : category)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white transition-colors group"
                     >
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{category}</span>
                        {openCategory === category ? <ChevronDown size={10} className="opacity-40" /> : <ChevronRight size={10} className="opacity-40" />}
                     </button>
                     
                     {openCategory === category && (
                        <div className="grid grid-cols-2 gap-[1px] bg-[var(--line)] p-[1px]">
                           {lenses.map(l => (
                              <button
                                 key={l.id}
                                 onClick={() => setActiveLensId(l.id)}
                                 className={`p-3 flex flex-col items-start transition-all border border-transparent ${activeLensId === l.id ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--bg)] hover:border-[var(--line-dim)]"}`}
                              >
                                 <div className="flex items-center justify-between w-full mb-1">
                                    <span className="text-[10px] font-black tracking-widest">{l.label}</span>
                                    <span className="text-[7px] font-black opacity-30">{l.api}</span>
                                 </div>
                                 <span className="text-[7px] font-medium opacity-40 uppercase truncate w-full text-left">{l.name}</span>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>
         </div>

         {/* ── Intelligence Overlays ────────────────── */}
         <div className="flex bg-white h-8 connected-grid shadow-2xl border border-black">
            {[
              { active: showHeatmap, set: setShowHeatmap, label: "HEAT", icon: Layers },
              { active: showFires, set: setShowFires, label: "THRM", icon: Flame },
              { active: showFlights, set: setShowFlights, label: "AIR", icon: Plane },
              { active: showRefugees, set: setShowRefugees, label: "REF", icon: Users },
              { active: showZones, set: setShowZones, label: "ZONE", icon: Target },
            ].map((t, i) => (
              <button key={i} onClick={() => t.set(!t.active)} className={`flex-1 flex items-center justify-center gap-2 transition-all border-r border-[var(--line)] last:border-r-0 ${t.active ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)] hover:bg-[var(--bg)]"}`}>
                 <t.icon size={10} />
                 <span className="text-[8px] font-black tracking-widest">{t.label}</span>
              </button>
            ))}
         </div>

         {/* ── Opacity Calibrator ────────────────── */}
         <div className="flex bg-white h-8 items-center border border-black px-3 gap-3 shadow-2xl">
            <Eye size={10} className="opacity-40" />
            <input 
              type="range" 
              className="flex-1 accent-black scale-y-50" 
              value={satelliteOpacity} 
              onChange={e => setSatelliteOpacity(parseInt(e.target.value))} 
            />
            <span className="text-[9px] font-black tabular-nums opacity-40">{satelliteOpacity}%</span>
         </div>
      </div>

      {/* ── Operational Intelligence HUD ── */}
      <div className="absolute bottom-6 left-6 z-40 space-y-2">
         <div className="flex items-center gap-4 bg-[var(--ink)] text-white px-4 py-2 shadow-2xl border border-white/10">
            <div className="flex items-center gap-2">
               <Zap size={12} className="text-[var(--accent)] animate-pulse" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: "SIGNALS", val: incidents?.length || 0 },
                 { label: "THERMAL", val: fires?.length || 0 },
                 { label: "TRAFFIC", val: flights?.length || 0 },
                 { label: "DISPL", val: refugees?.length || 0 },
               ].map(m => (
                 <div key={m.label} className="flex flex-col">
                    <span className="text-[7px] font-black opacity-40 uppercase">{m.label}</span>
                    <span className="text-[11px] font-black tabular-nums leading-none">{m.val}</span>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="flex items-center gap-2 bg-white border border-black px-3 py-1.5 shadow-xl">
            <div className={`h-2 w-2 rounded-full ${hasMapboxToken ? 'bg-[var(--safe)]' : 'bg-[var(--hazard)]'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Engine: Deck.GL + {hasMapboxToken ? 'Mapbox Satellite' : 'ESRI Fallback'}</span>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-1">
         <button onClick={() => setViewState(INITIAL_VIEW_STATE)} className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Compass size={14} strokeWidth={3} />
         </button>
         <button className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-xl">
            <Maximize2 size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
