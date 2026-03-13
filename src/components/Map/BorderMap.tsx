"use client";

import { useEffect, useState } from "react";
import type { MapViewState, PickingInfo } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  Globe,
  Map as MapIcon,
  MoonStar,
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
  RegionBorderFeature,
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

const EMPTY_BORDERS: RegionBorderCollection = {
  type: "FeatureCollection",
  features: [],
};

type SatelliteOverlayId = "modisTerra" | "modisAqua" | "viirsTrueColor";

const SATELLITE_OVERLAY_OPTIONS: Array<{
  id: SatelliteOverlayId;
  label: string;
  shortLabel: string;
}> = [
  { id: "viirsTrueColor", label: "VIIRS True Color", shortLabel: "TRUE" },
  { id: "modisTerra", label: "MODIS False Color", shortLabel: "FALSE" },
  { id: "modisAqua", label: "MODIS Relief", shortLabel: "RELIEF" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIncidentFeature(value: unknown): value is IncidentFeature {
  return isRecord(value) && isRecord(value.properties) && typeof value.properties.notes === "string";
}

function isRegionBorderFeature(value: unknown): value is RegionBorderFeature {
  return isRecord(value) && isRecord(value.properties) && typeof value.properties.NAME_0 === "string";
}

function isFireEvent(value: unknown): value is FireEvent {
  return isRecord(value) && typeof value.brightness === "number";
}

function hasLabel(value: unknown): value is RefugeeMovement | RainfallPoint {
  return isRecord(value) && typeof value.label === "string";
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

function getTooltipText(object: unknown): string | null {
  if (isIncidentFeature(object)) return object.properties.notes || object.properties.title;
  if (isRegionBorderFeature(object)) return object.properties.NAME_0 ?? null;
  if (hasLabel(object)) return object.label;
  if (isFireEvent(object)) return `Fire Intensity: ${object.brightness}`;
  return null;
}

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  
  // UI States (Matches Screenshot)
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showNightlights, setShowNightlights] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showRefugees, setShowRefugees] = useState(false);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(true);
  const [satelliteOverlay, setSatelliteOverlay] = useState<SatelliteOverlayId>("viirsTrueColor");
  const [satelliteOpacity, setSatelliteOpacity] = useState(82);
  const [isDetailedMap, setIsDetailedMap] = useState(true);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [rainfall, setRainfall] = useState<RainfallPoint[]>([]);
  const [borders, setBorders] = useState<RegionBorderCollection | null>(null);

  const getSafeDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2); // Closer date for "Live" feel
    return d.toISOString().split("T")[0];
  };

  const safeDate = getSafeDate();
  const activeSatelliteOverlay = SATELLITE_OVERLAY_OPTIONS.find((o) => o.id === satelliteOverlay) ?? SATELLITE_OVERLAY_OPTIONS[0];

  const satelliteLayer = showSatelliteOverlay ? (
    satelliteOverlay === "modisTerra"
      ? createModisTerraLayer(safeDate, satelliteOpacity / 100)
      : satelliteOverlay === "modisAqua"
        ? createModisAquaLayer(safeDate, satelliteOpacity / 100)
        : createViirsTrueColorLayer(safeDate, satelliteOpacity / 100)
  ) : null;

  useEffect(() => {
    const loadData = async () => {
      const [incidentData, fireData, refugeeData, rainfallData, borderData] = await Promise.all([
        fetchJson<IncidentFeature[]>("/api/incidents", []),
        fetchJson<FireEvent[]>("/api/fires", []),
        fetchJson<RefugeeMovement[]>("/api/refugees", []),
        fetchJson<RainfallPoint[]>("/api/rainfall", []),
        fetchJson<RegionBorderCollection>("/data/region_borders.geojson", EMPTY_BORDERS),
      ]);
      setIncidents(incidentData);
      setFires(fireData);
      setRefugees(refugeeData);
      setRainfall(rainfallData);
      setBorders(borderData);
    };
    loadData();
  }, []);

  const layers = [
    satelliteLayer,
    showNightlights && createNightlightLayer(),
    borders && createRegionalBorderLayer(borders),
    showRainfall && createRainfallLayer(rainfall),
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
    showRefugees && createRefugeeLayer(refugees),
  ].filter(Boolean);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) => setViewState(nv as MapViewState)}
        controller={true}
        layers={layers}
        onClick={({ object }) => {
          if (isIncidentFeature(object)) {
            onProvinceSelect?.({
              name: object.properties.location,
              location: object.properties.location,
              notes: object.properties.notes,
              eventDate: object.properties.eventDate,
            });
          } else if (isRegionBorderFeature(object)) {
            onProvinceSelect?.({ name: object.properties.NAME_0 ?? "Regional Sector" });
          }
        }}
        getTooltip={({ object }) => getTooltipText(object)}
      >
        <MapboxMap
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={isDetailedMap ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/dark-v11"}
          attributionControl={false}
        />
      </DeckGL>

      {/* Floating Panel: Core Indicators (Top Left) */}
      <div className="pointer-events-auto absolute left-6 top-6 z-40 bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--line)] shadow-xl w-[220px]">
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-[var(--line)] p-2 rounded bg-[var(--bg)]">
            <div className="text-[8px] font-bold opacity-40 uppercase">SIGNALS</div>
            <div className="text-xl font-black">{incidents.length}</div>
          </div>
          <div className="border border-[var(--line)] p-2 rounded bg-[var(--bg)]">
            <div className="text-[8px] font-bold opacity-40 uppercase">FIRES</div>
            <div className="text-xl font-black">{fires.length}</div>
          </div>
        </div>
        <div className="mt-2 border border-[var(--line)] p-2 rounded bg-[var(--bg-raised)] flex items-center justify-between">
          <div className="text-[8px] font-bold uppercase opacity-40">OVERLAY</div>
          <div className="text-[9px] font-black text-[var(--cool)]">{activeSatelliteOverlay.shortLabel}</div>
        </div>
      </div>

      {/* Floating Panel: Working Layers (Middle Left) */}
      <div className="pointer-events-auto absolute left-6 top-[140px] z-40 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--line-bright)] shadow-2xl w-[260px] backdrop-blur-md">
        <div className="eyebrow mb-4 opacity-50">WORKING LAYERS</div>
        
        <div className="flex gap-1 mb-6">
           {["Thailand", "West border", "Deep south"].map(l => (
             <button key={l} className="px-3 py-1 bg-[var(--bg-raised)] border border-[var(--line)] rounded-full text-[9px] font-bold opacity-50 hover:opacity-100 transition-opacity">
               {l}
             </button>
           ))}
        </div>

        <div className="space-y-1">
          {[
            { id: "heatmap", label: "Incident heatmap", icon: Layers, active: showHeatmap, set: setShowHeatmap },
            { id: "fires", label: "Thermal Hotspots", icon: Flame, active: showFires, set: setShowFires },
            { id: "nightlights", label: "Night Lights", icon: MoonStar, active: showNightlights, set: setShowNightlights },
            { id: "rainfall", label: "Rainfall Anomalies", icon: CloudRain, active: showRainfall, set: setShowRainfall },
            { id: "refugees", label: "Population Movement", icon: Users, active: showRefugees, set: setShowRefugees },
          ].map(l => (
            <button key={l.id} onClick={() => l.set(!l.active)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${l.active ? "bg-[var(--warning)] border-transparent text-white" : "bg-[var(--bg-raised)] border-[var(--line)] text-[var(--ink)] opacity-70 hover:opacity-100"}`}>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold">{l.label}</span>
                <span className="text-[8px] opacity-60">Status: Active</span>
              </div>
              <l.icon size={14} strokeWidth={2.5} />
            </button>
          ))}
        </div>
      </div>

      {/* Floating Panel: Imagery (Top Right) */}
      <div className="pointer-events-auto absolute right-6 top-6 z-40 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--line-bright)] shadow-2xl w-[260px] backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="eyebrow opacity-50">IMAGERY</div>
          <Satellite size={14} className="opacity-40" />
        </div>
        <h3 className="text-sm font-black mb-1">VIIRS True Color</h3>
        <p className="text-[10px] leading-relaxed text-[var(--muted)] mb-4">Natural-color daily scan for first-pass regional review.</p>
        
        <div className="text-[9px] font-bold opacity-40 mb-2 uppercase">{safeDate} · token-free fallback</div>
        
        <div className="grid grid-cols-3 gap-1 mb-5">
           {SATELLITE_OVERLAY_OPTIONS.map(o => (
             <button key={o.id} onClick={() => setSatelliteOverlay(o.id)} className={`px-2 py-2 rounded-lg text-[9px] font-bold border transition-all ${satelliteOverlay === o.id ? "bg-[var(--ink)] text-white" : "bg-[var(--bg-raised)] border-[var(--line)]"}`}>
               {o.shortLabel}
             </button>
           ))}
        </div>

        <div className="space-y-3">
           <div className="flex items-center justify-between bg-[var(--bg-raised)] p-3 rounded-xl border border-[var(--line)]">
              <span className="text-[11px] font-bold">Satellite overlay</span>
              <Globe size={14} opacity={0.4} />
           </div>
           <button onClick={() => setIsDetailedMap(!isDetailedMap)} className={`w-full flex items-center justify-between p-3 rounded-xl border border-[var(--line)] transition-all ${isDetailedMap ? "bg-[var(--warning)] border-transparent text-white" : "bg-[var(--bg-raised)]"}`}>
              <span className="text-[11px] font-bold">Detailed basemap</span>
              <MapIcon size={14} opacity={0.4} />
           </button>
           <div className="p-3">
              <div className="flex items-center justify-between text-[9px] font-bold opacity-40 mb-2 uppercase">Opacity: {satelliteOpacity}%</div>
              <input type="range" min="0" max="100" value={satelliteOpacity} onChange={e => setSatelliteOpacity(parseInt(e.target.value))} className="w-full h-1 bg-[var(--line)] rounded-full appearance-none accent-[var(--ink)]" />
           </div>
        </div>
      </div>
    </div>
  );
}
