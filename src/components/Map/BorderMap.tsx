"use client";

import { useEffect, useState } from "react";
import type { MapViewState, PickingInfo } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  CloudRain,
  Flame,
  Globe,
  Layers,
  Map as MapIcon,
  MoonStar,
  Satellite,
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
  { id: "viirsTrueColor", label: "VIIRS True Color", shortLabel: "VIIRS" },
  { id: "modisTerra", label: "MODIS Terra", shortLabel: "TERRA" },
  { id: "modisAqua", label: "MODIS Aqua", shortLabel: "AQUA" },
];

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

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (province: ProvinceSelection) => void;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showNightlights, setShowNightlights] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [showRefugees, setShowRefugees] = useState(false);
  const [showRainfall, setShowRainfall] = useState(false);
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(true);
  const [satelliteOverlay, setSatelliteOverlay] =
    useState<SatelliteOverlayId>("viirsTrueColor");
  const [satelliteOpacity, setSatelliteOpacity] = useState(72);
  const [showJaxa, setShowJaxa] = useState(false);
  const [isDetailedMap, setIsDetailedMap] = useState(true);

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
  const activeSatelliteOverlay =
    SATELLITE_OVERLAY_OPTIONS.find((option) => option.id === satelliteOverlay) ??
    SATELLITE_OVERLAY_OPTIONS[0];
  const useSatelliteBasemap = isDetailedMap || showSatelliteOverlay;
  const signalCount = incidents.length;
  const hotspotCount = fires.length;
  const selectedFocus =
    signalCount > 0 ? incidents[0]?.properties.location ?? "Thailand" : "Thailand";

  const satelliteLayer =
    !showSatelliteOverlay
      ? null
      : satelliteOverlay === "modisTerra"
        ? createModisTerraLayer(safeDate, satelliteOpacity / 100)
        : satelliteOverlay === "modisAqua"
          ? createModisAquaLayer(safeDate, satelliteOpacity / 100)
          : createViirsTrueColorLayer(safeDate, satelliteOpacity / 100);

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
    satelliteLayer,
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
    <div className="relative flex h-full w-full flex-col overflow-hidden">
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
        <MapboxMap
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={
            useSatelliteBasemap && MAPBOX_TOKEN
              ? "mapbox://styles/mapbox/satellite-streets-v12"
              : MAPBOX_TOKEN
              ? "mapbox://styles/mapbox/dark-v11"
              : "https://tiles.openfreemap.org/styles/dark"
          }
          attributionControl={false}
        />
      </DeckGL>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(24,21,17,0.12)] via-transparent to-[rgba(24,21,17,0.08)]" />

      <div className="pointer-events-auto absolute left-4 top-24 z-40 hidden w-[316px] xl:block">
        <div className="dashboard-panel rounded-[24px] p-5">
          <div className="eyebrow">Map focus</div>
          <h2 className="pt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#171512]">
            Thailand in detailed satellite context
          </h2>
          <p className="pt-3 text-[14px] leading-6 text-[#4d483f]">
            Keep the map readable first: start with the terrain and imagery,
            then add incidents, rainfall, fires, and movement only when you
            need that layer.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-[18px] border border-[#d6cebf] bg-white/55 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                Signals
              </div>
              <div className="pt-2 text-[20px] font-semibold tracking-[-0.04em] text-[#171512]">
                {signalCount}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#d6cebf] bg-white/55 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                Fires
              </div>
              <div className="pt-2 text-[20px] font-semibold tracking-[-0.04em] text-[#171512]">
                {hotspotCount}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#d6cebf] bg-white/55 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#736c61]">
                Focus
              </div>
              <div className="truncate pt-2 text-[15px] font-semibold tracking-[-0.03em] text-[#171512]">
                {selectedFocus}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-24 z-40 w-[304px] xl:right-[404px]">
        <div className="dashboard-panel rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Imagery</div>
              <h3 className="pt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#171512]">
                {activeSatelliteOverlay.label}
              </h3>
              <p className="pt-2 text-[13px] leading-5 text-[#565046]">
                Updated from the last stable day: {safeDate}
              </p>
            </div>
            <div className="rounded-full border border-[#d6cebf] bg-white/60 p-2 text-[#4f6871]">
              <Satellite size={16} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {SATELLITE_OVERLAY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={satelliteOverlay === option.id}
                onClick={() => setSatelliteOverlay(option.id)}
                className={`rounded-full border px-3 py-2 text-[11px] font-medium transition-colors ${
                  satelliteOverlay === option.id
                    ? "border-[#171512] bg-[#171512] text-[#f7f2ea]"
                    : "border-[#d6cebf] bg-white/70 text-[#4d483f] hover:bg-white"
                }`}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              aria-pressed={showSatelliteOverlay}
              onClick={() => setShowSatelliteOverlay(!showSatelliteOverlay)}
              className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                showSatelliteOverlay
                  ? "border-[#4f6871] bg-[#4f6871] text-[#f7f2ea]"
                  : "border-[#d6cebf] bg-white/70 text-[#26231f] hover:bg-white"
              }`}
            >
              <span>
                <span className="block text-[13px] font-medium">Satellite overlay</span>
                <span className="block pt-1 text-[11px] opacity-80">
                  Adds true-color imagery on top of the base map.
                </span>
              </span>
              <Globe size={16} />
            </button>

            <button
              type="button"
              aria-pressed={isDetailedMap}
              onClick={() => setIsDetailedMap(!isDetailedMap)}
              className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                isDetailedMap
                  ? "border-[#8b5a40] bg-[#8b5a40] text-[#f7f2ea]"
                  : "border-[#d6cebf] bg-white/70 text-[#26231f] hover:bg-white"
              }`}
            >
              <span>
                <span className="block text-[13px] font-medium">Detailed basemap</span>
                <span className="block pt-1 text-[11px] opacity-80">
                  Keeps roads, settlements, and terrain legible.
                </span>
              </span>
              <MapIcon size={16} />
            </button>

            <button
              type="button"
              aria-pressed={showNightlights}
              onClick={() => setShowNightlights(!showNightlights)}
              className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                showNightlights
                  ? "border-[#4f6871] bg-[#4f6871] text-[#f7f2ea]"
                  : "border-[#d6cebf] bg-white/70 text-[#26231f] hover:bg-white"
              }`}
            >
              <span>
                <span className="block text-[13px] font-medium">Night lights</span>
                <span className="block pt-1 text-[11px] opacity-80">
                  Useful for comparing settlement intensity after dark.
                </span>
              </span>
              <MoonStar size={16} />
            </button>
          </div>

          <div className={showSatelliteOverlay ? "mt-5 opacity-100" : "mt-5 opacity-45"}>
            <div className="flex items-center justify-between text-[11px] font-medium text-[#736c61]">
              <span>Overlay opacity</span>
              <span className="text-[#171512]">{satelliteOpacity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={satelliteOpacity}
              disabled={!showSatelliteOverlay}
              onChange={(event) => setSatelliteOpacity(Number(event.target.value))}
              className="mt-3 w-full accent-[#4f6871] disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 z-40 w-[332px] xl:bottom-[182px]">
        <div className="dashboard-panel rounded-[24px] p-5">
          <div className="eyebrow">Use the map</div>
          <h3 className="pt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#171512]">
            Start broad, then add a layer
          </h3>

          <div className="mt-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#736c61]">
              Focus presets
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewState({ ...INITIAL_VIEW_STATE })}
                className="rounded-full border border-[#171512] bg-[#171512] px-4 py-2 text-[11px] font-medium text-[#f7f2ea]"
              >
                Thailand
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewState({
                    longitude: 98.7,
                    latitude: 16.5,
                    zoom: 8.4,
                    pitch: 28,
                    bearing: 0,
                  })
                }
                className="rounded-full border border-[#d6cebf] bg-white/70 px-4 py-2 text-[11px] font-medium text-[#26231f] hover:bg-white"
              >
                West border
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewState({
                    longitude: 101.5,
                    latitude: 6.5,
                    zoom: 9.2,
                    pitch: 28,
                    bearing: 0,
                  })
                }
                className="rounded-full border border-[#d6cebf] bg-white/70 px-4 py-2 text-[11px] font-medium text-[#26231f] hover:bg-white"
              >
                Deep south
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#736c61]">
              Working layers
            </div>
            <div className="mt-3 grid gap-2">
              {[
                {
                  active: showHeatmap,
                  label: "Incident heatmap",
                  description: "Turn on density only when you need clustering.",
                  icon: Layers,
                  onClick: () => setShowHeatmap(!showHeatmap),
                },
                {
                  active: showFires,
                  label: "Thermal anomalies",
                  description: `${formatCompactCount(hotspotCount)} recent heat signals available.`,
                  icon: Flame,
                  onClick: () => setShowFires(!showFires),
                },
                {
                  active: showRainfall,
                  label: "Rainfall anomalies",
                  description: "Compare incident areas against recent rain shifts.",
                  icon: CloudRain,
                  onClick: () => setShowRainfall(!showRainfall),
                },
                {
                  active: showJaxa,
                  label: "JAXA precipitation",
                  description: "Use when you need the broader rain field.",
                  icon: CloudRain,
                  onClick: () => setShowJaxa(!showJaxa),
                },
                {
                  active: showRefugees,
                  label: "Population movement",
                  description: `${formatCompactCount(refugees.length)} movement traces available.`,
                  icon: Users,
                  onClick: () => setShowRefugees(!showRefugees),
                },
              ].map((control) => {
                const Icon = control.icon;

                return (
                  <button
                    key={control.label}
                    type="button"
                    aria-pressed={control.active}
                    onClick={control.onClick}
                    className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                      control.active
                        ? "border-[#171512] bg-[#171512] text-[#f7f2ea]"
                        : "border-[#d6cebf] bg-white/70 text-[#26231f] hover:bg-white"
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-medium">{control.label}</span>
                      <span className="block pt-1 text-[11px] opacity-80">
                        {control.description}
                      </span>
                    </span>
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
