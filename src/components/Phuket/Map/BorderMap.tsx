"use client";

import { useEffect, useRef, useState } from "react";
import { WebMercatorViewport } from "@deck.gl/core";
import type { MapViewState, PickingInfo } from "@deck.gl/core";
import dynamic from "next/dynamic";
const DeckGL = dynamic(
  () => import("@deck.gl/react").then((module) => module.default),
  { ssr: false },
);
import {
  Camera,
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
  createKilometerGridLayer,
  createProvinceLabelsLayer,
  createRainfallLayer,
  createRasterOverlayLayer,
  createRefugeeLayer,
  createRegionalBorderLayer,
} from "../../../services/map-engine";
import { luma } from "@luma.gl/core";
import { webgl2Adapter } from "@luma.gl/webgl";
import { getUsableMapboxToken } from "../../../lib/mapbox";
import { buildMapOverlayCatalog } from "../../../lib/map-overlays";
import PublicCameraCard from "../Intelligence/PublicCameraCard";
import type {
  AirQualityPoint,
  ConflictZoneCollection,
  ConflictZoneFeature,
  DashboardDatasetStatus,
  DashboardStatusPayload,
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
  FlightData,
  PublicCamera,
  PublicCameraResponse,
  RainfallPoint,
  RefugeeMovement,
  RegionBorderCollection,
  RegionBorderFeature,
} from "../../../types/dashboard";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const MAPBOX_TOKEN = getUsableMapboxToken(
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
);

// Register WebGL adapter for deck.gl v9
luma.registerAdapters([webgl2Adapter]);

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 98.334,
  latitude: 7.886,
  zoom: 10,
  pitch: 45,
  bearing: -5,
  minZoom: 5,
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

function isPublicCameraResponse(value: unknown): value is PublicCameraResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "cameras" in value &&
    Array.isArray(value.cameras)
  );
}

function isDashboardDatasetStatus(value: unknown): value is DashboardDatasetStatus {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.details === "string" &&
    typeof value.state === "string" &&
    (value.criticality === "core" || value.criticality === "optional")
  );
}

function isDashboardStatusPayload(value: unknown): value is DashboardStatusPayload {
  return (
    isRecord(value) &&
    typeof value.status === "string" &&
    Array.isArray(value.datasets) &&
    value.datasets.every(isDashboardDatasetStatus)
  );
}

interface FeedAlert {
  id: string;
  label: string;
  state: DashboardDatasetStatus["state"];
  details: string;
}

function buildFeedAlerts(
  payload: DashboardStatusPayload | null,
  datasetIds: string[],
): FeedAlert[] {
  if (!payload) {
    return [];
  }

  return datasetIds
    .map((datasetId) =>
      payload.datasets.find((dataset) => dataset.id === datasetId),
    )
    .filter(
      (dataset): dataset is DashboardDatasetStatus =>
        Boolean(
          dataset &&
            (dataset.state === "stale" ||
              dataset.state === "fallback" ||
              dataset.state === "disabled"),
        ),
    )
    .map((dataset) => ({
      id: dataset.id,
      label: dataset.label,
      state: dataset.state,
      details: dataset.details,
    }));
}

function createViewport(
  viewState: MapViewState,
  width: number,
  height: number,
) {
  return new WebMercatorViewport({
    width,
    height,
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    zoom: viewState.zoom,
    pitch: viewState.pitch,
    bearing: viewState.bearing,
  });
}

function projectCameraMarkers(
  cameras: PublicCamera[],
  viewState: MapViewState,
  width: number,
  height: number,
) {
  const viewport = createViewport(viewState, width, height);

  return cameras
    .map((camera) => {
      const [x, y] = viewport.project([camera.lng, camera.lat]);

      return {
        camera,
        x,
        y,
      };
    })
    .filter(
      (marker) =>
        Number.isFinite(marker.x) &&
        Number.isFinite(marker.y) &&
        marker.x >= -24 &&
        marker.x <= width + 24 &&
        marker.y >= -24 &&
        marker.y <= height + 24,
    );
}

function isMapViewState(value: unknown): value is MapViewState {
  return (
    isRecord(value) &&
    typeof value.longitude === "number" &&
    typeof value.latitude === "number" &&
    typeof value.zoom === "number"
  );
}

function getCameraMarkerOffset(cameraId: string) {
  switch (cameraId) {
    case "patong-coast":
      return { x: -20, y: -16 };
    case "bangla-road":
      return { x: 18, y: 16 };
    case "kata-beach":
      return { x: 0, y: 0 };
    case "karon-panorama":
      return { x: -12, y: 12 };
    case "phuket-old-town":
      return { x: 10, y: -10 };
    default:
      return { x: 0, y: 0 };
  }
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
  const mapSurfaceRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [mapSurfaceSize, setMapSurfaceSize] = useState({ width: 0, height: 0 });
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState(62);
  const [isDetailedMap, setIsDetailedMap] = useState(true);
  const [showAerialBasemap, setShowAerialBasemap] = useState(MAPBOX_TOKEN.length === 0);
  const [showStreets, setShowStreets] = useState(MAPBOX_TOKEN.length === 0);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [rainfall, setRainfall] = useState<RainfallPoint[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityPoint[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [cameras, setCameras] = useState<PublicCamera[]>([]);
  const [feedAlerts, setFeedAlerts] = useState<FeedAlert[]>([]);
  const [borders, setBorders] = useState<RegionBorderCollection | null>(null);
  const [conflictZones, setConflictZones] =
    useState<ConflictZoneCollection>(EMPTY_CONFLICT_ZONES);
  const [selectedCamera, setSelectedCamera] = useState<PublicCamera | null>(null);

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
  const rainCount = rainfall.length;
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
  const isDistanceGridVisible =
    mapSurfaceSize.width > 0 &&
    mapSurfaceSize.height > 0 &&
    viewState.zoom >= 9;
  const kilometerGridLayer = isDistanceGridVisible
    ? (() => {
        const viewport = createViewport(
          viewState,
          mapSurfaceSize.width,
          mapSurfaceSize.height,
        );
        const [west, south, east, north] = viewport.getBounds();

        return createKilometerGridLayer({
          west,
          south,
          east,
          north,
        });
      })()
    : null;

  useEffect(() => {
    const element = mapSurfaceRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setMapSurfaceSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

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
        cameraData,
        statusData,
      ] = await Promise.all([
        fetchJson<IncidentFeature[]>("/api/incidents", []),
        fetchJson<FireEvent[]>("/api/fires", []),
        fetchJson<RefugeeMovement[]>("/api/movements", []),
        fetchJson<RainfallPoint[]>("/api/rainfall", []),
        fetchJson<AirQualityPoint[]>("/api/air-quality", []),
        fetchJson<RegionBorderCollection>("/data/region_borders.geojson", EMPTY_BORDERS),
        fetchJson<ConflictZoneCollection>("/data/conflict_zones.geojson", EMPTY_CONFLICT_ZONES),
        fetchJson<FlightData[]>("/api/flights", []),
        fetchJson<PublicCameraResponse>("/api/public-cameras", {
          generatedAt: "",
          cameras: [],
        }),
        fetchJson<DashboardStatusPayload | null>("/api/status", null),
      ]);

      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setFires(Array.isArray(fireData) ? fireData : []);
      setRefugees(Array.isArray(refugeeData) ? refugeeData : []);
      setRainfall(Array.isArray(rainfallData) ? rainfallData : []);
      setAirQuality(Array.isArray(airQualityData) ? airQualityData : []);
      setFlights(Array.isArray(flightData) ? flightData : []);
      setCameras(
        isPublicCameraResponse(cameraData) ? cameraData.cameras : [],
      );
      setFeedAlerts(
        buildFeedAlerts(
          isDashboardStatusPayload(statusData) ? statusData : null,
          ["conflict_events", "fires", "rainfall", "air_quality"],
        ),
      );
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
    kilometerGridLayer,
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
  const focusPresets = [
    {
      id: "phuket-core",
      label: "Phuket island",
      summary: "Town, beaches, airport, and east coast",
      view: INITIAL_VIEW_STATE,
    },
    {
      id: "patong-coast",
      label: "Patong coast",
      summary: "Patong, Karon, Kata, and western access",
      view: {
        longitude: 98.284,
        latitude: 7.842,
        zoom: 11.25,
        pitch: 46,
        bearing: -20,
      },
    },
    {
      id: "airport-link",
      label: "Airport link",
      summary: "Airport, bridge, and northern road corridor",
      view: {
        longitude: 98.315,
        latitude: 8.112,
        zoom: 10.45,
        pitch: 42,
        bearing: -8,
      },
    },
    {
      id: "phang-nga-bay",
      label: "Phang Nga Bay",
      summary: "Bay approaches, piers, and marine routes",
      view: {
        longitude: 98.53,
        latitude: 8.085,
        zoom: 9.75,
        pitch: 38,
        bearing: 14,
      },
    },
  ] as const;
  const mapModeControls = [
    {
      id: "satellite-overlay",
      active: showSatelliteOverlay,
      label: "NASA overlay",
      shortLabel: "NASA",
      icon: Globe,
      onClick: () => setShowSatelliteOverlay((value) => !value),
    },
    {
      id: "aerial-base",
      active: showAerialBasemap,
      label: "ESRI aerial",
      shortLabel: "AERIAL",
      icon: Satellite,
      onClick: () => setShowAerialBasemap((value) => !value),
    },
    {
      id: "roads-base",
      active: showStreets,
      label: "OSM roads",
      shortLabel: "ROADS",
      icon: MapPinned,
      onClick: () => setShowStreets((value) => !value),
    },
    {
      id: "detail-base",
      active: isDetailedMap,
      label: "Detailed map",
      shortLabel: "DETAIL",
      icon: MapIcon,
      onClick: () => setIsDetailedMap((value) => !value),
    },
    {
      id: "night-lights",
      active: enabledOverlays.nightLights,
      label: "Night lights",
      shortLabel: "LIGHTS",
      icon: MoonStar,
      onClick: () => toggleOverlay("nightLights"),
    },
  ] as const;
  const layerControls = [
    ...analyticControls.map((overlay) => ({
      id: overlay.id,
      active: enabledOverlays[overlay.id],
      label: overlay.label,
      shortLabel: overlay.shortLabel,
      detail:
        overlay.id === "thermalHotspots"
          ? `${formatCompactCount(hotspotCount)} hotspots`
          : overlay.id === "aqiHeatmap" || overlay.id === "pm25Heatmap"
            ? `${formatCompactCount(airQuality.length)} stations`
            : overlay.id === "rainfallAnomalies"
              ? `${formatCompactCount(rainCount)} rain nodes`
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
      shortLabel: overlay.shortLabel,
      detail:
        overlay.id === "conflictZones"
          ? `${formatCompactCount(conflictZones.features.length)} zones`
          : overlay.id === "populationMovement"
            ? `${formatCompactCount(refugees.length)} flows`
            : overlay.id === "incidentHeatmap" || overlay.id === "incidentPoints"
              ? `${formatCompactCount(signalCount)} signals`
              : overlay.id === "provinceLabels"
                ? "Province index"
                : overlay.id === "flightPaths"
                  ? `${formatCompactCount(flights.length)} aircraft`
                  : overlay.id === "publicCameras"
                    ? `${formatCompactCount(cameras.length)} cameras`
                  : overlay.shortLabel,
      icon:
        overlay.id === "publicCameras"
          ? Camera
          : overlay.id === "populationMovement"
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
  ];

  const projectedCameraMarkers =
    enabledOverlays.publicCameras && mapSurfaceSize.width > 0 && mapSurfaceSize.height > 0
      ? projectCameraMarkers(
          cameras,
          viewState,
          mapSurfaceSize.width,
          mapSurfaceSize.height,
        )
      : [];

  const toggleOverlay = (overlayId: string) => {
    if (overlayId === "publicCameras" && enabledOverlays.publicCameras) {
      setSelectedCamera(null);
    }

    setEnabledOverlays((current) => ({
      ...current,
      [overlayId]: !current[overlayId],
    }));
  };

  const handleMapClick = ({ object }: PickingInfo<unknown>) => {
    setSelectedCamera(null);

    if (isIncidentFeature(object)) {
      onProvinceSelect?.({
        name: object.properties.location || "Local Sector",
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
        type: "Focus zone",
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
    <div
      ref={mapSurfaceRef}
      data-testid="phuket-map-surface"
      className="relative flex h-full w-full flex-col overflow-hidden"
    >
      {!hasMapboxBaseMap && (
        <div
          className={`absolute inset-0 ${fallbackBackgroundClass}`}
          aria-hidden="true"
        />
      )}

      <DeckGL
        id="phuket-deck"
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) => {
          if (isMapViewState(nextViewState)) {
            setViewState(nextViewState);
          }
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
            reuseMaps
            attributionControl={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[#0c121e]/20 pointer-events-none" />
        )}
      </DeckGL>

      {enabledOverlays.publicCameras ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {projectedCameraMarkers.map(({ camera, x, y }) => (
            (() => {
              const offset = getCameraMarkerOffset(camera.id);

              return (
                <button
                  key={camera.id}
                  type="button"
                  data-testid={`camera-marker-${camera.id}`}
                  aria-label={`View camera marker for ${camera.label}`}
                  title={camera.label}
                  onClick={() => setSelectedCamera(camera)}
                  className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[0_10px_24px_rgba(15,23,42,0.28)] transition-colors ${
                    selectedCamera?.id === camera.id
                      ? "border-[var(--cool)] bg-[var(--cool)] text-white"
                      : "border-[var(--line-bright)] bg-[rgba(248,246,240,0.92)] text-[var(--ink)] hover:border-[var(--cool)] hover:text-[var(--cool)]"
                  }`}
                  style={{
                    left: `${x + offset.x}px`,
                    top: `${y + offset.y}px`,
                    width: "34px",
                    height: "34px",
                  }}
                >
                  <span className="flex items-center justify-center">
                    <Camera size={14} />
                  </span>
                </button>
              );
            })()
          ))}
        </div>
      ) : null}

      {selectedCamera && enabledOverlays.publicCameras ? (
        <div
          data-testid="camera-detail-card"
          className="pointer-events-auto absolute bottom-[72px] right-4 z-30 w-[280px] max-w-[calc(100%-2rem)]"
        >
          <PublicCameraCard camera={selectedCamera} variant="map-detail" />
        </div>
      ) : null}

      <div className="pointer-events-auto absolute inset-x-0 top-0 z-40 border-b border-[var(--line)] bg-[rgba(248,246,240,0.85)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 xl:px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[14px] font-bold tracking-tight text-[var(--ink)] uppercase">Operating Surface</div>
              <div className="h-3 w-[1px] bg-[var(--line)]" />
              <div className="flex gap-3 text-[9px] font-mono font-bold text-[var(--dim)] uppercase tracking-tight">
                <span>SIG {signalCount}</span>
                <span>AQI {airQuality.length}</span>
                <span>FLT {flights.length}</span>
                <span
                  data-testid="distance-grid-indicator"
                  title={
                    isDistanceGridVisible
                      ? "1 km by 1 km distance grid is active on the map."
                      : "Zoom in to reactivate the 1 km by 1 km distance grid."
                  }
                >
                  {isDistanceGridVisible ? "GRID 1KM" : "GRID Z9+"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 border-r border-[var(--line)] pr-2 mr-1">
              {baseOverlays.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={satelliteOverlay === option.id}
                  aria-label={`Select imagery overlay ${option.label}`}
                  data-testid={`imagery-${option.id}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setSatelliteOverlay(option.id);
                  }}
                  onClick={() => setSatelliteOverlay(option.id)}
                  className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    satelliteOverlay === option.id
                      ? "text-[var(--ink)] underline underline-offset-4"
                      : "text-[var(--dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  {option.shortLabel}
                </button>
              ))}
            </div>
            {mapModeControls.slice(0, 3).map((control) => {
              const Icon = control.icon;
              return (
                <button
                  key={control.id}
                  type="button"
                  aria-pressed={control.active}
                  aria-label={`Toggle ${control.label}`}
                  data-testid={`map-mode-${control.id}`}
                  onClick={control.onClick}
                  className={`inline-flex h-7 items-center gap-1.5 border px-2 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    control.active
                      ? "border-[var(--cool)] bg-[rgba(15,111,136,0.06)] text-[var(--cool)]"
                      : "border-[var(--line)] text-[var(--dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={11} />
                  {control.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--line)] px-3 py-1.5 xl:px-4">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {focusPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setViewState((current) => ({
                    ...current,
                    ...preset.view,
                  }))
                }
                className="whitespace-nowrap rounded border border-[var(--line)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        <div className={`flex items-center gap-2 min-w-[140px] ${showSatelliteOverlay ? "opacity-100" : "opacity-40"}`}>
            <span className="text-[9px] font-mono text-[var(--dim)] shrink-0">VIS {satelliteOpacity}%</span>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={satelliteOpacity}
              disabled={!showSatelliteOverlay}
              aria-label="Adjust NASA overlay opacity"
              data-testid="satellite-opacity-slider"
              onChange={(event) => setSatelliteOpacity(Number(event.target.value))}
              className="w-full h-1 bg-[var(--line)] rounded-full appearance-none accent-[var(--cool)] cursor-pointer"
            />
          </div>
        </div>
        {feedAlerts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] px-3 py-1.5 xl:px-4">
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-[#b45309]">
              Feed Integrity
            </span>
            {feedAlerts.map((alert) => (
              <span
                key={alert.id}
                title={alert.details}
                className="rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#9a3412]"
              >
                {alert.label} {alert.state}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[rgba(248,246,240,0.85)] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-1.5 xl:px-4">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {layerControls.map((control) => {
              const Icon = control.icon;
              return (
                <button
                  key={control.id}
                  type="button"
                  aria-pressed={control.active}
                  aria-label={`Toggle ${control.label}`}
                  data-testid={`map-layer-${control.id}`}
                  onClick={control.onClick}
                  className={`border whitespace-nowrap px-2 py-1 transition-colors ${
                    control.active
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-bright)]"
                  }`}
                  title={`${control.label} · ${control.detail}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={10} className="shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {control.shortLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
