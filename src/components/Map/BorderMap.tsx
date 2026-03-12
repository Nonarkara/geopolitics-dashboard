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
  MapPinned,
  MoonStar,
  Plane,
  Satellite,
  Tag,
  Users,
  Wind,
} from "lucide-react";
import {
  createAirQualityHeatmapLayers,
  createConflictZonesLayer,
  createFireLayer,
  createFlightPathsLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createProvinceLabelsLayer,
  createRainfallLayer,
  createRasterOverlayLayer,
  createRefugeeLayer,
  createRegionalBorderLayer,
} from "../../services/map-engine";
import { getUsableMapboxToken } from "../../lib/mapbox";
import { buildMapOverlayCatalog } from "../../lib/map-overlays";
import type {
  AirQualityPoint,
  ConflictZoneCollection,
  ConflictZoneFeature,
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
  FlightData,
  RainfallPoint,
  RefugeeMovement,
  RegionBorderCollection,
  RegionBorderFeature,
} from "../../types/dashboard";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const MAPBOX_TOKEN = getUsableMapboxToken(
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
);

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85,
  latitude: 14.2,
  zoom: 6.15,
  pitch: 26,
  bearing: -4,
  minZoom: 4,
  maxZoom: 18,
};

const EMPTY_BORDERS: RegionBorderCollection = {
  type: "FeatureCollection",
  features: [],
};

const EMPTY_CONFLICT_ZONES: ConflictZoneCollection = {
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

function isConflictZoneFeature(value: unknown): value is ConflictZoneFeature {
  return (
    isRecord(value) &&
    isRecord(value.properties) &&
    typeof value.properties.name === "string" &&
    typeof value.properties.summary === "string" &&
    typeof value.properties.priority === "number"
  );
}

function isFireEvent(value: unknown): value is FireEvent {
  return isRecord(value) && typeof value.brightness === "number";
}

function hasLabel(value: unknown): value is RefugeeMovement | RainfallPoint {
  return isRecord(value) && typeof value.label === "string";
}

function isAirQualityPoint(value: unknown): value is AirQualityPoint {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.aqi === "number" &&
    typeof value.pm25 === "number"
  );
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

  if (isConflictZoneFeature(object)) {
    return `${object.properties.name}: ${object.properties.summary}`;
  }

  if (isAirQualityPoint(object)) {
    return `${object.label}: AQI ${Math.round(object.aqi)} / PM2.5 ${Math.round(object.pm25)}`;
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
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(62);
  const [isDetailedMap, setIsDetailedMap] = useState(true);
  const [showAerialBasemap, setShowAerialBasemap] = useState(false);
  const [showStreets, setShowStreets] = useState(false);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [rainfall, setRainfall] = useState<RainfallPoint[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityPoint[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [borders, setBorders] = useState<RegionBorderCollection | null>(null);
  const [conflictZones, setConflictZones] =
    useState<ConflictZoneCollection>(EMPTY_CONFLICT_ZONES);

  const getSafeDate = () => {
    // NASA GIBS only serves imagery up to the current real-world date.
    // In this simulated environment (2026), requesting Date.now() returns
    // a future date against NASA's real calendar, resulting in transparent or black tiles.
    return "2024-03-01";
  };

  const safeDate = getSafeDate();
  const overlayCatalog = buildMapOverlayCatalog(safeDate);
  const baseOverlays = overlayCatalog.overlays.filter(
    (overlay) => overlay.role === "base-option",
  );
  const additionalOverlays = overlayCatalog.overlays.filter(
    (overlay) => overlay.role !== "base-option",
  );
  const [satelliteOverlay, setSatelliteOverlay] = useState<string>(
    overlayCatalog.defaultImageryOverlayId,
  );
  const [enabledOverlays, setEnabledOverlays] = useState<Record<string, boolean>>(
    () =>
      overlayCatalog.overlays.reduce<Record<string, boolean>>((memo, overlay) => {
        memo[overlay.id] = overlay.enabledByDefault;
        return memo;
      }, {}),
  );
  const activeSatelliteOverlay =
    baseOverlays.find((overlay) => overlay.id === satelliteOverlay) ??
    baseOverlays[0];
  const signalCount = incidents.length;
  const hotspotCount = fires.length;
  const hasMapboxBaseMap = MAPBOX_TOKEN.length > 0;
  const mapStyle = isDetailedMap
    ? "mapbox://styles/mapbox/satellite-streets-v12"
    : "mapbox://styles/mapbox/light-v11";
  const fallbackBackgroundClass = isDetailedMap
    ? "bg-[radial-gradient(circle_at_top,_var(--line-bright),_var(--bg)_52%),linear-gradient(180deg,_var(--bg)_0%,_var(--bg-surface)_100%)]"
    : "bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_rgba(10,15,26,0.98)_42%),linear-gradient(180deg,_rgba(4,8,15,1)_0%,_rgba(2,6,12,1)_100%)]";

  const provinceLabelsLayer = enabledOverlays.provinceLabels
    ? createProvinceLabelsLayer()
    : null;

  const satelliteLayer =
    showSatelliteOverlay && activeSatelliteOverlay
      ? createRasterOverlayLayer(activeSatelliteOverlay, satelliteOpacity / 100)
      : null;

  const selectedAdditionalOverlays = additionalOverlays.filter(
    (overlay) => enabledOverlays[overlay.id],
  );
  const rasterAnalyticLayers = selectedAdditionalOverlays
    .filter((overlay) => overlay.kind === "raster")
    .map((overlay) => createRasterOverlayLayer(overlay, overlay.defaultOpacity))
    .filter(Boolean);

  useEffect(() => {
    const loadData = async () => {
      const [
        incidentData,
        fireData,
        refugeeData,
        rainfallData,
        airQualityData,
        borderData,
        conflictZoneData,
        flightData,
      ] = await Promise.all([
        fetchJson<IncidentFeature[]>("/api/incidents", []),
        fetchJson<FireEvent[]>("/api/fires", []),
        fetchJson<RefugeeMovement[]>("/api/refugees", []),
        fetchJson<RainfallPoint[]>("/api/rainfall", []),
        fetchJson<AirQualityPoint[]>("/api/air-quality", []),
        fetchJson<RegionBorderCollection>("/data/region_borders.geojson", EMPTY_BORDERS),
        fetchJson<ConflictZoneCollection>("/data/conflict_zones.geojson", EMPTY_CONFLICT_ZONES),
        fetchJson<FlightData[]>("/api/flights", []),
      ]);

      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setFires(Array.isArray(fireData) ? fireData : []);
      setRefugees(Array.isArray(refugeeData) ? refugeeData : []);
      setRainfall(Array.isArray(rainfallData) ? rainfallData : []);
      setAirQuality(Array.isArray(airQualityData) ? airQualityData : []);
      setFlights(Array.isArray(flightData) ? flightData : []);
      setBorders(borderData);
      setConflictZones(conflictZoneData);
    };

    loadData();

    // Refresh map data every 2 minutes
    const mapDataInterval = setInterval(loadData, 2 * 60 * 1000);

    // Refresh flight data every 30 seconds
    const flightInterval = setInterval(async () => {
      const flightData = await fetchJson<FlightData[]>("/api/flights", []);
      setFlights(Array.isArray(flightData) ? flightData : []);
    }, 30000);

    return () => {
      clearInterval(mapDataInterval);
      clearInterval(flightInterval);
    };
  }, []);

  const layers = [
    satelliteLayer,
    ...rasterAnalyticLayers,
    enabledOverlays.borderContext && borders && createRegionalBorderLayer(borders),
    enabledOverlays.conflictZones && createConflictZonesLayer(conflictZones),
    enabledOverlays.rainfallAnomalies && createRainfallLayer(rainfall),
    ...(enabledOverlays.aqiHeatmap
      ? createAirQualityHeatmapLayers(airQuality, "aqi")
      : []),
    ...(enabledOverlays.pm25Heatmap
      ? createAirQualityHeatmapLayers(airQuality, "pm25")
      : []),
    enabledOverlays.incidentHeatmap
      ? createHeatmapLayer(incidents)
      : enabledOverlays.incidentPoints
        ? createIncidentLayer(incidents)
        : null,
    enabledOverlays.thermalHotspots ? createFireLayer(fires) : null,
    enabledOverlays.populationMovement ? createRefugeeLayer(refugees) : null,
    ...(enabledOverlays.flightPaths ? (createFlightPathsLayer(flights) ?? []) : []),
    provinceLabelsLayer,
  ].filter(Boolean);

  const analyticControls = additionalOverlays.filter(
    (overlay) => overlay.role === "analytic",
  );
  const operationalControls = additionalOverlays.filter(
    (overlay) => overlay.role === "operational",
  );

  const toggleOverlay = (overlayId: string) => {
    setEnabledOverlays((current) => ({
      ...current,
      [overlayId]: !current[overlayId],
    }));
  };

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
      return;
    }

    if (isConflictZoneFeature(object)) {
      onProvinceSelect?.({
        name: object.properties.name,
        type: "Conflict zone",
        notes: object.properties.summary,
      });
    }
  };

  // When aerial basemap is on, use ESRI World Imagery tiles (free, no token needed)
  const aerialLayer = showAerialBasemap
    ? createRasterOverlayLayer(
        {
          id: "esri-aerial",
          label: "ESRI Aerial",
          shortLabel: "AERIAL",
          description: "High-resolution aerial imagery",
          source: "ESRI",
          family: "imagery",
          role: "base-option",
          kind: "raster" as const,
          defaultOpacity: 1,
          enabledByDefault: false,
          maxZoom: 19,
          tileTemplate:
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          updatedAt: new Date().toISOString(),
        },
        1,
      )
    : null;

  // OpenStreetMap streets/roads layer (free, no token needed)
  const streetsLayer = showStreets
    ? createRasterOverlayLayer(
        {
          id: "osm-streets",
          label: "OpenStreetMap",
          shortLabel: "OSM",
          description: "Street-level roads and infrastructure",
          source: "OpenStreetMap",
          family: "imagery",
          role: "base-option",
          kind: "raster" as const,
          defaultOpacity: 0.85,
          enabledByDefault: false,
          maxZoom: 19,
          tileTemplate:
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          updatedAt: new Date().toISOString(),
        },
        0.85,
      )
    : null;

  // Prepend basemap layers so they sit below all other layers
  const allLayers = [aerialLayer, streetsLayer, ...layers].filter(Boolean);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {!hasMapboxBaseMap && (
        <div
          className={`absolute inset-0 ${fallbackBackgroundClass}`}
          aria-hidden="true"
        />
      )}

      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) => {
          const next = nextViewState as MapViewState;
          // Enforce zoom bounds
          const zoom = Math.max(4, Math.min(18, next.zoom));
          setViewState({ ...next, zoom });
        }}
        controller={true}
        layers={allLayers}
        onClick={handleMapClick}
        getTooltip={({ object }: PickingInfo<unknown>) => getTooltipText(object)}
      >
        {hasMapboxBaseMap ? (
          <MapboxMap
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={mapStyle}
            attributionControl={false}
          />
        ) : null}
      </DeckGL>

      {/* Map stats overlay - top left */}
      <div className="pointer-events-auto absolute left-3 top-3 z-40">
        <div className="dashboard-panel rounded-lg px-4 py-3">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">Signals</div>
              <div className="text-[18px] font-bold font-mono tabular-nums text-[var(--ink)]">{signalCount}</div>
            </div>
            <div className="h-6 w-px bg-[var(--line-bright)]" />
            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">Fires</div>
              <div className="text-[18px] font-bold font-mono tabular-nums text-[#f59e0b]">{hotspotCount}</div>
            </div>
            <div className="h-6 w-px bg-[var(--line-bright)]" />
            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--dim)]">Overlay</div>
              <div className="text-[11px] font-bold text-[var(--cool)]">{activeSatelliteOverlay.shortLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite overlay controls - top right */}
      <div className="pointer-events-auto absolute right-3 top-3 z-40 w-[240px]">
        <div className="dashboard-panel map-overlay-panel rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Imagery</div>
              <h3 className="pt-1 text-[13px] font-bold text-[var(--ink)]">
                {activeSatelliteOverlay.label}
              </h3>
              <p className="pt-1 text-[10px] leading-4 text-[var(--muted)]">
                {activeSatelliteOverlay.description}
              </p>
              <p className="pt-1 text-[9px] font-mono text-[var(--dim)]">
                {hasMapboxBaseMap
                  ? safeDate
                  : `${safeDate} · token-free fallback`}
              </p>
            </div>
            <div className="rounded-full border border-[var(--line-bright)] bg-[var(--bg-raised)] p-1.5 text-[var(--cool)]">
              <Satellite size={12} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {baseOverlays.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={satelliteOverlay === option.id}
                onClick={() => setSatelliteOverlay(option.id)}
                className={`rounded-md border px-2 py-1.5 text-[9px] font-bold transition-colors ${
                  satelliteOverlay === option.id
                    ? "border-[var(--cool)] bg-[var(--line-bright)] text-[var(--cool)]"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--dim)] hover:text-[var(--muted)]"
                }`}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            {[
              { active: showSatelliteOverlay, label: "Satellite overlay", icon: Globe, onClick: () => setShowSatelliteOverlay(!showSatelliteOverlay), color: "cyan" },
              { active: showAerialBasemap, label: "Aerial view (ESRI)", icon: Satellite, onClick: () => setShowAerialBasemap(!showAerialBasemap), color: "amber" },
              { active: showStreets, label: "Streets & roads (OSM)", icon: MapPinned, onClick: () => setShowStreets(!showStreets), color: "cyan" },
              { active: isDetailedMap, label: "Detailed basemap", icon: MapIcon, onClick: () => setIsDetailedMap(!isDetailedMap), color: "cyan" },
              { active: enabledOverlays.nightLights, label: "Night lights", icon: MoonStar, onClick: () => toggleOverlay("nightLights"), color: "cyan" },
            ].map((ctrl) => {
              const Icon = ctrl.icon;
              const activeClasses = ctrl.color === "amber"
                ? "border-[#f59e0b] bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
                : "border-[var(--cool)] bg-[var(--line-bright)] text-[var(--cool)]";
              return (
                <button
                  key={ctrl.label}
                  type="button"
                  aria-pressed={ctrl.active}
                  onClick={ctrl.onClick}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[10px] font-semibold transition-colors ${
                    ctrl.active
                      ? activeClasses
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--dim)] hover:text-[var(--muted)]"
                  }`}
                >
                  <span>{ctrl.label}</span>
                  <Icon size={12} />
                </button>
              );
            })}
          </div>

          <div className={`mt-3 ${showSatelliteOverlay ? "opacity-100" : "opacity-30"}`}>
            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--dim)]">
              <span>Opacity</span>
              <span className="text-[var(--ink)]">{satelliteOpacity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={satelliteOpacity}
              disabled={!showSatelliteOverlay}
              onChange={(event) => setSatelliteOpacity(Number(event.target.value))}
              className="mt-2 w-full accent-[var(--cool)] disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Working layers - bottom left */}
      <div className="pointer-events-auto absolute bottom-3 left-3 z-40 w-[272px]">
        <div className="dashboard-panel map-overlay-panel rounded-lg p-4">
          <div className="eyebrow">Working layers</div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setViewState({ ...INITIAL_VIEW_STATE })}
              className="map-overlay-preset-primary rounded-md border border-[var(--cool)] px-3 py-1 text-[9px] font-bold text-[var(--cool)]"
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
              className="map-overlay-preset-secondary rounded-md border border-[var(--line)] px-3 py-1 text-[9px] font-bold text-[var(--dim)] hover:text-[var(--muted)]"
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
              className="map-overlay-preset-secondary rounded-md border border-[var(--line)] px-3 py-1 text-[9px] font-bold text-[var(--dim)] hover:text-[var(--muted)]"
            >
              Deep south
            </button>
          </div>

          <div className="mt-3 space-y-1.5">
            {[
              ...analyticControls.map((overlay) => ({
                id: overlay.id,
                active: enabledOverlays[overlay.id],
                label: overlay.label,
                detail: overlay.id === "thermalHotspots"
                  ? `${formatCompactCount(hotspotCount)} hotspots`
                  : overlay.id === "aqiHeatmap" || overlay.id === "pm25Heatmap"
                    ? `${formatCompactCount(airQuality.length)} stations`
                  : overlay.shortLabel,
                icon:
                  overlay.family === "weather"
                    ? CloudRain
                    : overlay.family === "air"
                      ? Wind
                    : overlay.family === "thermal"
                      ? Flame
                      : overlay.family === "lights"
                        ? MoonStar
                        : Layers,
                onClick: () => toggleOverlay(overlay.id),
              })),
              ...operationalControls.map((overlay) => ({
                id: overlay.id,
                active: enabledOverlays[overlay.id],
                label: overlay.label,
                detail:
                  overlay.id === "conflictZones"
                    ? `${formatCompactCount(conflictZones.features.length)} zones`
                    : overlay.id === "rainfallAnomalies"
                      ? "Rain shift overlay"
                      : overlay.id === "populationMovement"
                        ? `${formatCompactCount(refugees.length)} traces`
                        : overlay.id === "incidentHeatmap"
                          ? `${formatCompactCount(signalCount)} signals`
                          : overlay.id === "provinceLabels"
                            ? "77 provinces"
                            : overlay.id === "flightPaths"
                              ? `${formatCompactCount(flights.length)} aircraft`
                              : overlay.shortLabel,
                icon:
                  overlay.id === "populationMovement"
                    ? Users
                    : overlay.id === "conflictZones"
                      ? MapPinned
                    : overlay.id === "rainfallAnomalies"
                      ? CloudRain
                      : overlay.id === "provinceLabels"
                        ? Tag
                        : overlay.id === "flightPaths"
                          ? Plane
                          : Layers,
                onClick: () => toggleOverlay(overlay.id),
              })),
            ].map((control) => {
              const Icon = control.icon;

              return (
                <button
                  key={control.id}
                  type="button"
                  aria-pressed={control.active}
                  onClick={control.onClick}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                    control.active
                      ? "border-[#f59e0b] bg-[rgba(245,158,11,0.1)] text-[#f59e0b]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--dim)] hover:text-[var(--muted)]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold">{control.label}</div>
                    <div className="text-[8px] opacity-70">{control.detail}</div>
                  </div>
                  <Icon size={12} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
