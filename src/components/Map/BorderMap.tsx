"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  Globe, Layers, Flame, Maximize2, Compass, Zap, Eye, Plane, Users, Target, ChevronRight, ChevronDown
} from "lucide-react";
import {
  createFireLayer, createHeatmapLayer, createIncidentLayer, createRasterOverlayLayer, createRasterTileLayer, createGIBSLayer, createFlightPathsLayer, createRefugeeLayer, createConflictZonesLayer, createProvinceLabelsLayer
} from "../../services/map-engine";
import type {
  FireEvent, IncidentFeature, ProvinceSelection, FlightData, RefugeeMovement, ConflictZoneCollection
} from "../../types/dashboard";
import { getUsableMapboxToken } from "../../lib/mapbox";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const RAW_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_TOKEN = getUsableMapboxToken(RAW_TOKEN);

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85, latitude: 14.2, zoom: 6.25, pitch: 40, bearing: 0,
};

// NASA GIBS only serves imagery up to the current real-world date.
// Using a known-good historical date prevents blank/black tiles.
const NASA_GIBS_SAFE_DATE = "2024-03-01";

interface LensConfig {
  id: string; label: string; name: string; layer: string; format: "jpg" | "png"; maxZoom: number; api: "GIBS" | "JAXA" | "COPERNICUS" | "DIRECT";
  tileUrl?: string;
  useDefaultDate?: boolean;
}

const STRATEGIC_LENSES: Record<string, LensConfig[]> = {
  "VISUAL RECON": [
    { id: "VRS", label: "VRS", name: "Natural Color (Satellite)", layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "AQU", label: "AQU", name: "Aqua Baseline", layer: "MODIS_Aqua_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "TER", label: "TER", name: "Terra Baseline", layer: "MODIS_Terra_CorrectedReflectance_TrueColor", format: "jpg", maxZoom: 9, api: "GIBS" },
  ],
  "THERMAL & BURN": [
    { id: "FLS", label: "FLS", name: "Fire & Burn Scars", layer: "MODIS_Terra_CorrectedReflectance_Bands721", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "VFS", label: "VFS", name: "Thermal Anomalies", layer: "VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1", format: "jpg", maxZoom: 9, api: "GIBS" },
    { id: "SWI", label: "SWI", name: "Shortwave Heat Signature", layer: "MODIS_Terra_SurfaceReflectance_Bands721", format: "jpg", maxZoom: 9, api: "GIBS" },
  ],
  "HUMANITARIAN": [
    { id: "NGT", label: "NGT", name: "Infrastructure/Lights", layer: "VIIRS_SNPP_DayNightBand_AtSensor_M15", format: "png", maxZoom: 8, api: "GIBS" },
    { id: "RNF", label: "RNF", name: "Displacement Flood Scan", layer: "IMERG_Precipitation_Rate", format: "png", maxZoom: 6, api: "GIBS" },
  ],
  "ATMOSPHERIC FLUX": [
    { id: "AOD", label: "AOD", name: "Aerosol Density", layer: "MODIS_Terra_Aerosol_Optical_Depth_Land_Ocean", format: "png", maxZoom: 6, api: "GIBS" },
    { id: "LST", label: "LST", name: "Surface Temp Variance", layer: "MODIS_Terra_LST_Day", format: "png", maxZoom: 7, api: "GIBS" },
    { id: "CO", label: "CO", name: "Carbon Monoxide Flux", layer: "MOPITT_Carbon_Monoxide_Total_Column_Day", format: "png", maxZoom: 5, api: "GIBS" },
  ],
  "GEOSTATIONARY": [
    { id: "HIM", label: "HIM", name: "Himawari-9 Red Visible", layer: "Himawari_AHI_Band3_Red_Visible_1km", format: "png", maxZoom: 8, api: "GIBS", useDefaultDate: true },
    { id: "GRN", label: "GRN", name: "Geo Ring Natural Color", layer: "Geostationary_Ring_Natural_Color_RGB", format: "jpg", maxZoom: 7, api: "GIBS", useDefaultDate: true },
    { id: "GRI", label: "GRI", name: "Geo Ring Infrared", layer: "Geostationary_Ring_IR108", format: "jpg", maxZoom: 7, api: "GIBS", useDefaultDate: true },
    { id: "GRA", label: "GRA", name: "Geo Ring Airmass", layer: "Geostationary_Ring_Airmass_RGB", format: "jpg", maxZoom: 7, api: "GIBS", useDefaultDate: true },
  ],
  "HIGH-RES BASELINES": [
    { id: "S2C", label: "S2C", name: "Sentinel-2 Cloudless", layer: "s2cloudless", format: "jpg", maxZoom: 15, api: "DIRECT",
      tileUrl: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg" },
  ],
  "HYDRO & TERRAIN": [
    { id: "SWO", label: "SWO", name: "Surface Water Occurrence", layer: "jrc-occurrence", format: "png", maxZoom: 13, api: "DIRECT",
      tileUrl: "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png" },
    { id: "SWC", label: "SWC", name: "Surface Water Change", layer: "jrc-change", format: "png", maxZoom: 13, api: "DIRECT",
      tileUrl: "https://storage.googleapis.com/global-surface-water/tiles2021/change/{z}/{x}/{y}.png" },
    { id: "BAT", label: "BAT", name: "Ocean Bathymetry", layer: "emodnet-bathy", format: "png", maxZoom: 12, api: "DIRECT",
      tileUrl: "https://tiles.emodnet-bathymetry.eu/v12/mean_atlas_land_latest/web_mercator/{z}/{x}/{y}.png" },
  ],
};

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (p: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(85);
  const [activeLensId, setActiveLensId] = useState("VRS");
  const [openCategory, setOpenCategory] = useState<string | null>("VISUAL RECON");

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [zones, setZones] = useState<ConflictZoneCollection | null>(null);

  const hasMapboxToken = MAPBOX_TOKEN.length > 0;

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, fir, flt, ref, zn] = await Promise.all([
          fetch("/api/incidents", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/fires", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/flights", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/refugees", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/map/overlays", { cache: 'no-store' }).then(res => res.json()).catch(() => null),
        ]);
        setIncidents(inc || []);
        setFires(fir || []);
        setFlights(flt || []);
        setRefugees(ref || []);
        setZones(zn || null);
      } catch (e) {
        console.error("Map data load error:", e);
      }
    };
    load();
    const poll = setInterval(load, 60000);
    return () => clearInterval(poll);
  }, []);

  const activeLens = useMemo(() => {
    for (const cat in STRATEGIC_LENSES) {
      const match = STRATEGIC_LENSES[cat].find(l => l.id === activeLensId);
      if (match) return match;
    }
    return STRATEGIC_LENSES["VISUAL RECON"][0];
  }, [activeLensId]);

  const layers = useMemo(() => {
    const aerialLayer = createRasterOverlayLayer({
      id: "esri-aerial", label: "AERIAL", shortLabel: "AERIAL", description: "Fallback", source: "ESRI", 
      family: "imagery", role: "base-option", kind: "raster" as const, defaultOpacity: 1, 
      enabledByDefault: true, maxZoom: 19,
      tileTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      updatedAt: new Date().toISOString(),
    }, 1);

    const satelliteLayer = activeLens?.tileUrl
      ? createRasterTileLayer({
          id: `direct-${activeLens.id}`,
          data: activeLens.tileUrl,
          maxZoom: activeLens.maxZoom,
          opacity: satelliteOpacity / 100,
        })
      : createGIBSLayer({
          id: `gibs-${activeLens?.id || 'def'}`,
          layer: activeLens?.layer || '',
          date: activeLens?.useDefaultDate ? "default" : NASA_GIBS_SAFE_DATE,
          opacity: satelliteOpacity / 100,
          maxZoom: activeLens?.maxZoom || 9,
          format: activeLens?.format || 'jpg',
        });

    const activeLayers = [
      aerialLayer,
      satelliteLayer,
      showZones && zones && createConflictZonesLayer(zones),
      showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents, onProvinceSelect),
      showFires && createFireLayer(fires),
      showRefugees && createRefugeeLayer(refugees),
      showFlights && createFlightPathsLayer(flights),
      showLabels && createProvinceLabelsLayer(),
    ].flat().filter(Boolean);

    return activeLayers;
  }, [activeLens, satelliteOpacity, showZones, zones, showHeatmap, incidents, onProvinceSelect, showFires, fires, showRefugees, refugees, showFlights, flights, showLabels]);

  const handleToggleCategory = useCallback((cat: string) => {
    setOpenCategory(prev => prev === cat ? null : cat);
  }, []);

  const handleSelectLens = useCallback((id: string) => {
    setActiveLensId(id);
  }, []);

  const activeLayersCount = [showHeatmap, showFires, showFlights, showRefugees, showZones, showLabels].filter(Boolean).length;
  
  const handleClearAll = () => {
    setShowHeatmap(false);
    setShowFires(false);
    setShowFlights(false);
    setShowRefugees(false);
    setShowZones(false);
    setShowLabels(false);
    setActiveLensId("VRS");
  };

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
         <div className="bg-white flex flex-col  overflow-hidden border border-black">
            <div className="px-3 py-2 bg-black text-white flex items-center justify-between border-b border-black">
               <div className="flex items-center gap-2">
                  <Globe size={12} className="text-[var(--accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Strategic Lens Selection</span>
               </div>
            </div>
            
            <div className="max-h-[380px] overflow-y-auto no-scrollbar bg-[var(--bg)]">
               {Object.entries(STRATEGIC_LENSES || {}).map(([category, lenses]) => (
                  <div key={category} className="border-b border-black last:border-0 overflow-hidden">
                     <button 
                        onClick={() => handleToggleCategory(category)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white transition-all group border-b border-black last:border-0"
                     >
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] opacity-50 group-hover:opacity-100">{category}</span>
                        {openCategory === category ? <ChevronDown size={14} className="opacity-40" /> : <ChevronRight size={14} className="opacity-40" />}
                     </button>
                     
                     {openCategory === category && (
                        <div className="grid grid-cols-2 gap-[1px] bg-black p-[1px]">
                           {lenses?.map(l => (
                              <button
                                 key={l.id}
                                 onClick={() => handleSelectLens(l.id)}
                                 className={`p-3 flex flex-col items-start transition-all ${activeLensId === l.id ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
                              >
                                 <div className="flex items-center justify-between w-full mb-1">
                                    <span className="text-[11px] font-black tracking-widest leading-none mb-1">{l.label}</span>
                                 </div>
                                 <span className="text-[8px] font-medium opacity-40 uppercase truncate w-full text-left leading-tight">{l.name}</span>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>
         </div>

         {/* ── Intelligence Overlays ────────────────── */}
         <div className="flex bg-white h-8  border border-black overflow-hidden divide-x divide-black">
            {[
              { active: showHeatmap, set: setShowHeatmap, label: "HEAT", icon: Layers },
              { active: showFires, set: setShowFires, label: "THRM", icon: Flame },
              { active: showFlights, set: setShowFlights, label: "AIR", icon: Plane },
              { active: showRefugees, set: setShowRefugees, label: "REF", icon: Users },
              { active: showZones, set: setShowZones, label: "ZONE", icon: Target },
              { active: showLabels, set: setShowLabels, label: "LBL", icon: Globe },
            ].map((t, i) => (
              <button key={i} onClick={() => t.set(!t.active)} className={`flex-1 flex items-center justify-center gap-2 transition-all ${t.active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
                 <t.icon size={10} />
                 <span className="text-[8px] font-black tracking-widest">{t.label}</span>
              </button>
            ))}
         </div>

          {/* ── Active Layer Awareness ── */}
          <div className="flex bg-black text-white h-8 items-center justify-between border border-black px-3 shadow-2xl">
             <div className="flex items-center gap-2">
                <Layers size={11} className="text-[var(--accent)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Lenses: {activeLayersCount}</span>
             </div>
             <button onClick={handleClearAll} className="text-[9px] font-black underline uppercase opacity-40 hover:opacity-100 transition-all">Clear All</button>
          </div>

          <div className="flex bg-white h-8 items-center border border-black px-3 gap-3 shadow-2xl">
            <Eye size={12} className="opacity-40" />
            <input type="range" className="flex-1 accent-black h-1" value={satelliteOpacity} onChange={e => setSatelliteOpacity(parseInt(e.target.value))} />
            <span className="text-[11px] font-black tabular-nums opacity-40">{satelliteOpacity}%</span>
          </div>
      </div>

      {/* ── Operational Intelligence HUD ── */}
      <div className="absolute bottom-6 left-6 z-40 space-y-2 pointer-events-none">
         <div className="flex items-center gap-4 bg-black text-white px-4 py-2 border border-white/20">
            <Zap size={12} className="text-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="flex gap-6">
               {[
                 { label: "SIGNALS", val: incidents?.length || 0 },
                 { label: "THERMAL", val: fires?.length || 0 },
                 { label: "TRAFFIC", val: flights?.length || 0 },
                 { label: "DISPL", val: refugees?.length || 0 },
               ].map(m => (
                 <div key={m.label} className="flex flex-col">
                    <span className="text-[9px] font-black opacity-40 uppercase mb-0.5">{m.label}</span>
                    <span className="text-[14px] font-black tabular-nums leading-none">{m.val}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-1">
         <button onClick={() => setViewState(INITIAL_VIEW_STATE)} className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all ">
            <Compass size={14} strokeWidth={3} />
         </button>
         <button className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all ">
            <Maximize2 size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
