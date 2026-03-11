"use client";

import { useEffect, useState } from "react";
import type { MapViewState, PickingInfo } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  CloudRain,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Layers,
  Target,
  Users,
} from "lucide-react";
import {
  createCopernicusLayer,
  createFireLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createJaxaRainLayer,
  createNightlightLayer,
  createRainfallLayer,
  createRefugeeLayer,
  createRegionalBorderLayer,
  createSentinelLayer,
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

const Map = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.5,
  latitude: 14.5,
  zoom: 5.5,
  pitch: 30,
  bearing: 0,
};

const EMPTY_BORDERS: RegionBorderCollection = {
  type: "FeatureCollection",
  features: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIncidentFeature(value: unknown): value is IncidentFeature {
  return (
    isRecord(value) &&
    isRecord(value.properties) &&
    typeof value.properties.notes === "string"
  );
}

function isRegionBorderFeature(value: unknown): value is RegionBorderFeature {
  return (
    isRecord(value) &&
    isRecord(value.properties) &&
    typeof value.properties.NAME_0 === "string"
  );
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
    if (!res.ok) {
      return fallback;
    }

    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

function getTooltipText(object: unknown): string | null {
  if (isIncidentFeature(object)) {
    return object.properties.notes || object.properties.title;
  }

  if (isRegionBorderFeature(object)) {
    return object.properties.NAME_0 ?? null;
  }

  if (hasLabel(object)) {
    return object.label;
  }

  if (isFireEvent(object)) {
    return `Fire Intensity: ${object.brightness}`;
  }

  return null;
}

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showNightlights, setShowNightlights] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showRefugees, setShowRefugees] = useState(false);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showSentinel, setShowSentinel] = useState(true);
  const [showCopernicus, setShowCopernicus] = useState(false);
  const [showJaxa, setShowJaxa] = useState(false);
  const [isDetailedMap, setIsDetailedMap] = useState(false);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [rainfall, setRainfall] = useState<RainfallPoint[]>([]);
  const [borders, setBorders] = useState<RegionBorderCollection | null>(null);

  const getSafeDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  };

  const safeDate = getSafeDate();

  useEffect(() => {
    const loadData = async () => {
      const [
        incidentData,
        fireData,
        refugeeData,
        rainfallData,
        borderData,
      ] = await Promise.all([
        fetchJson<IncidentFeature[]>("/api/incidents", []),
        fetchJson<FireEvent[]>("/api/fires", []),
        fetchJson<RefugeeMovement[]>("/api/refugees", []),
        fetchJson<RainfallPoint[]>("/api/rainfall", []),
        fetchJson<RegionBorderCollection>("/data/region_borders.geojson", EMPTY_BORDERS),
      ]);

      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setFires(Array.isArray(fireData) ? fireData : []);
      setRefugees(Array.isArray(refugeeData) ? refugeeData : []);
      setRainfall(Array.isArray(rainfallData) ? rainfallData : []);
      setBorders(borderData);
    };

    loadData();
  }, []);

  const layers = [
    showSentinel && createSentinelLayer(safeDate),
    showCopernicus && createCopernicusLayer(safeDate),
    showJaxa && createJaxaRainLayer(safeDate),
    showNightlights && createNightlightLayer(safeDate),
    borders && createRegionalBorderLayer(borders),
    showRainfall && createRainfallLayer(rainfall),
    showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents),
    showFires && createFireLayer(fires),
    showRefugees && createRefugeeLayer(refugees),
  ].filter(Boolean);

  const handleMapClick = ({ object }: PickingInfo<unknown>) => {
    if (isIncidentFeature(object)) {
      onProvinceSelect?.({
        name: object.properties.location || "Tactical Sector",
        location: object.properties.location,
        type: object.properties.type,
        notes: object.properties.notes,
        fatalities: object.properties.fatalities,
        eventDate: object.properties.eventDate,
      });
      return;
    }

    if (isRegionBorderFeature(object)) {
      onProvinceSelect?.({
        name: object.properties.NAME_0 ?? "Regional Sector",
        iso: object.properties.ISO_A3 || object.properties.ADM0_A3,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) =>
          setViewState(nextViewState as MapViewState)
        }
        controller={true}
        layers={layers}
        onClick={handleMapClick}
        getTooltip={({ object }: PickingInfo<unknown>) => getTooltipText(object)}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={
            isDetailedMap
              ? "mapbox://styles/mapbox/satellite-v9"
              : MAPBOX_TOKEN
                ? "mapbox://styles/mapbox/dark-v11"
                : "https://tiles.openfreemap.org/styles/dark"
          }
          attributionControl={false}
        />
      </DeckGL>

      <div className="absolute top-10 right-10 z-50 grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowSentinel(!showSentinel)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showSentinel ? "bg-[#00d5ff] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Sentinel-2 Overlay"
        >
          <Target size={18} />
        </button>
        <button
          onClick={() => setIsDetailedMap(!isDetailedMap)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${isDetailedMap ? "bg-[#ff4d00] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Detailed High-Res Satellite"
        >
          <Compass size={18} />
        </button>
        <button
          onClick={() => setShowCopernicus(!showCopernicus)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showCopernicus ? "bg-[#00d5ff] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Copernicus Sentinel-2"
        >
          <Globe size={18} />
        </button>
        <button
          onClick={() => setShowJaxa(!showJaxa)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showJaxa ? "bg-[#ff4d00] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle JAXA GSMaP Precipitation"
        >
          <CloudRain size={18} />
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showHeatmap ? "bg-[#ff4d00] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Tactical Heatmap"
        >
          <Layers size={18} />
        </button>
        <button
          onClick={() => setShowNightlights(!showNightlights)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showNightlights ? "bg-[#00d5ff] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle VIIRS Nightlights"
        >
          {showNightlights ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button
          onClick={() => setShowFires(!showFires)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showFires ? "bg-[#ff4d00] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="NASA FIRMS Thermal Anomalies"
        >
          <Flame size={18} />
        </button>
        <button
          onClick={() => setShowRefugees(!showRefugees)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showRefugees ? "bg-[#ff4d00] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Refugee Movements"
        >
          <Users size={18} />
        </button>
        <button
          onClick={() => setShowRainfall(!showRainfall)}
          className={`w-12 h-12 flex items-center justify-center transition-all ${showRainfall ? "bg-[#00d5ff] text-white" : "bg-[#1a1a1a] text-[#7a7a7a] hover:bg-[#222]"}`}
          title="Toggle Rainfall Anomalies"
        >
          <CloudRain size={18} />
        </button>
      </div>

      <div className="absolute bottom-12 left-10 z-50 flex flex-col gap-10 pointer-events-none">
        <div className="flex gap-[1px] bg-[#1a1a1a] pointer-events-auto">
          <button
            onClick={() => setViewState({ ...INITIAL_VIEW_STATE, zoom: 5.5 })}
            className="bg-[#0a0a0a] px-6 py-4 text-[10px] font-black text-[#7a7a7a] uppercase tracking-[0.2em] hover:text-[#e5e5e5] transition-all"
          >
            NATIONAL
          </button>
          <button
            onClick={() =>
              setViewState({
                longitude: 98.7,
                latitude: 16.5,
                zoom: 8,
                pitch: 30,
                bearing: 0,
              })
            }
            className="bg-[#0a0a0a] px-6 py-4 text-[10px] font-black text-[#7a7a7a] uppercase tracking-[0.2em] hover:text-[#00d5ff] transition-all"
          >
            NORTH_WEST
          </button>
          <button
            onClick={() =>
              setViewState({
                longitude: 101.5,
                latitude: 6.5,
                zoom: 9,
                pitch: 30,
                bearing: 0,
              })
            }
            className="bg-[#0a0a0a] px-6 py-4 text-[10px] font-black text-[#7a7a7a] uppercase tracking-[0.2em] hover:text-[#ff4d00] transition-all"
          >
            SOUTH_SECTOR
          </button>
        </div>

        <div className="bg-[#0a0a0a] p-10 space-y-6 pointer-events-auto min-w-[300px]">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e5e5e5]">
              SIGNAL_LEGEND
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#444] uppercase tracking-wider">
              <span>TACTICAL_FORCE</span>
              <div className="w-4 h-[2px] bg-[#ff4d00]"></div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-[#444] uppercase tracking-wider">
              <span>THERMAL_FLUX</span>
              <div className="w-4 h-[2px] bg-[#00d5ff]"></div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-[#444] uppercase tracking-wider">
              <span>GEOGRAPHIC_MASK</span>
              <div className="w-4 h-[2px] bg-[#1a1a1a]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
