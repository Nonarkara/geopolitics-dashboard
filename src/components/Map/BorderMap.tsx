"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { MapViewState } from "@deck.gl/core";
import dynamic from "next/dynamic";
import { luma } from "@luma.gl/core";
import { webgl2Adapter } from "@luma.gl/webgl";
import {
  Building2, Check, Compass, Eye, Flame, Globe, Grid3x3, Layers, MapPinned, Maximize2, Plane, Radio, Route, Ship, Target, Truck, Users, Zap
} from "lucide-react";
import CommandTooltip from "../Common/CommandTooltip";
import { BASE_MAP_TOOLTIPS, OVERLAY_TOOLTIPS, INTEL_TOGGLE_TOOLTIPS } from "../../lib/tooltip-catalog";
import { useTimeWindow } from "../../contexts/TimeWindowContext";
import { formatBangkokDayLabel } from "../../lib/time-window";
import {
  createConflictZonesLayer,
  createFireLayer,
  createFlightPathsLayer,
  createGIBSLayer,
  createHeatmapLayer,
  createIncidentLayer,
  createInfrastructureLayer,
  createKilometerGridLayer,
  createOperationalCorridorLayers,
  createOperationalNodeLayers,
  createProvinceLabelsLayer,
  createRasterTileLayer,
  createRefugeeLayer,
  createRegionalBorderLayer,
  createSignalPulseLayer,
  type InfrastructureFeature,
  createTrafficIncidentLayers,
  createVesselLayer,
} from "../../services/map-engine";
import type {
  BorderOperationalMapResponse,
  ConflictZoneCollection,
  DashboardDatasetStatus,
  DashboardStatusPayload,
  FireEvent,
  IncidentFeature,
  RegionBorderCollection,
  TrafficIncident,
  ProvinceSelection,
  FlightData,
  RefugeeMovement,
  VesselPosition,
} from "../../types/dashboard";
import { haversineKm } from "../../lib/border-regions";
import { resolveAppUrl } from "../../lib/app-url";

const DeckGL = dynamic(
  () => import("@deck.gl/react").then((module) => module.default),
  { ssr: false },
);
// Mapbox is permanently gone (account deleted) — no MapboxMap underlay,
// no token. The free Deck.gl raster tile layers below are the only base.

try {
  luma.registerAdapters([webgl2Adapter]);
} catch (err) {
  if (typeof window !== "undefined") {
    console.warn("[BorderMap] luma.registerAdapters failed", err);
  }
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85, latitude: 14.2, zoom: 6.25, pitch: 40, bearing: 0,
};

const THAILAND_BORDER_BOUNDS = {
  west: 94.5, east: 107.5, south: 4.5, north: 22.5,
} as const;
const MIN_BORDER_ZOOM = 5.6;
const GENERAL_MAX_BORDER_ZOOM = 12.5;
const DEEP_MAX_BORDER_ZOOM = 15.8;
const DEEP_ZOOM_NODE_RADIUS_KM = 55;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isRegionBorderCollection(value: unknown): value is RegionBorderCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type?: string }).type === "FeatureCollection" &&
    "features" in value &&
    Array.isArray((value as { features?: unknown[] }).features)
  );
}

function isConflictZoneCollection(value: unknown): value is ConflictZoneCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type?: string }).type === "FeatureCollection" &&
    "features" in value &&
    Array.isArray((value as { features?: unknown[] }).features)
  );
}

function isTrafficIncident(value: unknown): value is TrafficIncident {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string" &&
    "lat" in value &&
    typeof (value as { lat?: unknown }).lat === "number" &&
    "lng" in value &&
    typeof (value as { lng?: unknown }).lng === "number" &&
    "category" in value &&
    typeof (value as { category?: unknown }).category === "string"
  );
}

function isBorderOperationalMapResponse(
  value: unknown,
): value is BorderOperationalMapResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "theaters" in value &&
    Array.isArray((value as { theaters?: unknown[] }).theaters) &&
    "nodes" in value &&
    Array.isArray((value as { nodes?: unknown[] }).nodes) &&
    "corridors" in value &&
    Array.isArray((value as { corridors?: unknown[] }).corridors) &&
    "nationalView" in value &&
    typeof (value as { nationalView?: unknown }).nationalView === "object" &&
    value !== null
  );
}

function resolveViewportMaxZoom(
  viewState: Pick<MapViewState, "longitude" | "latitude">,
  operationsMap: BorderOperationalMapResponse | null,
) {
  if (!operationsMap) {
    return GENERAL_MAX_BORDER_ZOOM;
  }

  const center: [number, number] = [viewState.longitude, viewState.latitude];

  for (const node of operationsMap.nodes) {
    if (
      node.allowsDeepZoom &&
      haversineKm(center, node.coordinates) <= DEEP_ZOOM_NODE_RADIUS_KM
    ) {
      return DEEP_MAX_BORDER_ZOOM;
    }
  }

  for (const theater of operationsMap.theaters) {
    const theaterCenter: [number, number] = [
      theater.focusView.longitude,
      theater.focusView.latitude,
    ];

    if (haversineKm(center, theaterCenter) <= theater.deepZoomRadiusKm) {
      return clamp(theater.deepZoom, GENERAL_MAX_BORDER_ZOOM, DEEP_MAX_BORDER_ZOOM);
    }
  }

  return GENERAL_MAX_BORDER_ZOOM;
}

function clampViewState(
  viewState: MapViewState,
  operationsMap: BorderOperationalMapResponse | null = null,
): MapViewState {
  return {
    ...viewState,
    longitude: clamp(viewState.longitude, THAILAND_BORDER_BOUNDS.west, THAILAND_BORDER_BOUNDS.east),
    latitude: clamp(viewState.latitude, THAILAND_BORDER_BOUNDS.south, THAILAND_BORDER_BOUNDS.north),
    zoom: clamp(
      viewState.zoom,
      MIN_BORDER_ZOOM,
      resolveViewportMaxZoom(viewState, operationsMap),
    ),
    pitch: clamp(viewState.pitch ?? INITIAL_VIEW_STATE.pitch ?? 0, 0, 60),
  };
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(resolveAppUrl(url), { cache: "no-store" });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

// NASA GIBS only serves imagery up to the current real-world date.
const NASA_GIBS_SAFE_DATE = "2024-03-01";

// ─── Base Map Catalog (from DrNon Global Satellite Toolkit) ─────────
// Fallback architecture: ESRI aerial always renders underneath.
// Base maps are mutually exclusive — user selects one at a time.
interface BaseMapConfig {
  id: string;
  label: string;
  name: string;
  tileUrl?: string;
  gibsLayer?: string;
  gibsFormat?: "jpg" | "png";
  maxZoom: number;
  useDefaultDate?: boolean;
}

const BASE_MAPS: BaseMapConfig[] = [
  // Priority 4: ESRI — always-available free aerial (also serves as fallback)
  { id: "ESRI", label: "ESRI", name: "Aerial Imagery", maxZoom: 19,
    tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" },
  // EOX Sentinel-2 Cloudless — highest res free imagery (10m)
  { id: "S2C", label: "S2C", name: "Sentinel-2 Cloudless", maxZoom: 15,
    tileUrl: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg" },
  // Priority 2: OpenStreetMap — universal free street map
  { id: "OSM", label: "OSM", name: "OpenStreetMap", maxZoom: 19,
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png" },
  // Priority 4: ESRI World Topographic
  { id: "TOPO", label: "TOPO", name: "ESRI Topographic", maxZoom: 19,
    tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" },
  // Priority 5: CartoDB Positron — clean light base for data overlays
  { id: "LITE", label: "LITE", name: "CartoDB Positron", maxZoom: 20,
    tileUrl: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png" },
  // Priority 5: CartoDB Dark Matter — dark ops base
  { id: "DARK", label: "DARK", name: "CartoDB Dark", maxZoom: 20,
    tileUrl: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png" },
  // NASA GIBS — VIIRS Natural Color
  { id: "VRS", label: "VRS", name: "VIIRS Natural Color", maxZoom: 9,
    gibsLayer: "VIIRS_SNPP_CorrectedReflectance_TrueColor", gibsFormat: "jpg" },
  // NASA GIBS — MODIS Aqua
  { id: "AQU", label: "AQU", name: "Aqua True Color", maxZoom: 9,
    gibsLayer: "MODIS_Aqua_CorrectedReflectance_TrueColor", gibsFormat: "jpg" },
  // NASA GIBS — MODIS Terra
  { id: "TER", label: "TER", name: "Terra True Color", maxZoom: 9,
    gibsLayer: "MODIS_Terra_CorrectedReflectance_TrueColor", gibsFormat: "jpg" },
  // NASA GIBS — Blue Marble terrain relief
  { id: "BLU", label: "BLU", name: "Blue Marble Relief", maxZoom: 8,
    gibsLayer: "BlueMarble_ShadedRelief", gibsFormat: "jpg", useDefaultDate: true },
  // NASA GIBS — Himawari-9 geostationary
  { id: "HIM", label: "HIM", name: "Himawari-9 Visible", maxZoom: 8,
    gibsLayer: "Himawari_AHI_Band3_Red_Visible_1km", gibsFormat: "png", useDefaultDate: true },
  // NASA GIBS — Geo Ring Natural Color composite
  { id: "GRN", label: "GRN", name: "Geo Ring Natural", maxZoom: 7,
    gibsLayer: "Geostationary_Ring_Natural_Color_RGB", gibsFormat: "jpg", useDefaultDate: true },
];

// ─── Data Overlay Catalog (stackable, from DrNon Toolkit) ───────────
interface OverlayConfig {
  id: string;
  label: string;
  name: string;
  category: string;
  tileUrl?: string;
  gibsLayer?: string;
  gibsFormat?: "jpg" | "png";
  maxZoom: number;
  defaultOpacity: number;
  useDefaultDate?: boolean;
}

const DATA_OVERLAYS: OverlayConfig[] = [
  // Thermal & Fire
  { id: "FLS", label: "FLS", name: "Fire & Burn Scars", category: "THERMAL",
    gibsLayer: "MODIS_Terra_CorrectedReflectance_Bands721", gibsFormat: "jpg", maxZoom: 9, defaultOpacity: 0.65 },
  { id: "VFS", label: "VFS", name: "Thermal Anomalies", category: "THERMAL",
    gibsLayer: "VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1", gibsFormat: "jpg", maxZoom: 9, defaultOpacity: 0.6 },
  { id: "SWI", label: "SWI", name: "Shortwave Heat", category: "THERMAL",
    gibsLayer: "MODIS_Terra_SurfaceReflectance_Bands721", gibsFormat: "jpg", maxZoom: 9, defaultOpacity: 0.55 },
  // Atmospheric
  { id: "AOD", label: "AOD", name: "Aerosol Density", category: "ATMOSPHERE",
    gibsLayer: "MODIS_Combined_Value_Added_AOD", gibsFormat: "png", maxZoom: 6, defaultOpacity: 0.5 },
  { id: "LST", label: "LST", name: "Surface Temp", category: "ATMOSPHERE",
    gibsLayer: "MODIS_Terra_LST_Day", gibsFormat: "png", maxZoom: 7, defaultOpacity: 0.5 },
  { id: "CO", label: "CO", name: "Carbon Monoxide", category: "ATMOSPHERE",
    gibsLayer: "MOPITT_Carbon_Monoxide_Total_Column_Day", gibsFormat: "png", maxZoom: 5, defaultOpacity: 0.45 },
  { id: "RNF", label: "RNF", name: "Precipitation", category: "ATMOSPHERE",
    gibsLayer: "IMERG_Precipitation_Rate", gibsFormat: "png", maxZoom: 6, defaultOpacity: 0.5 },
  // Vegetation
  { id: "EVI", label: "EVI", name: "Vegetation Index", category: "VEGETATION",
    gibsLayer: "MODIS_Terra_EVI_8Day", gibsFormat: "png", maxZoom: 9, defaultOpacity: 0.46, useDefaultDate: true },
  // Nighttime & Infrastructure
  { id: "NGT", label: "NGT", name: "Night Lights", category: "INFRASTRUCTURE",
    gibsLayer: "VIIRS_SNPP_DayNightBand_AtSensor_M15", gibsFormat: "png", maxZoom: 8, defaultOpacity: 0.6, useDefaultDate: true },
  // Geostationary Analysis
  { id: "GRI", label: "GRI", name: "Geo Ring IR", category: "GEOSTATIONARY",
    gibsLayer: "Geostationary_Ring_IR108", gibsFormat: "jpg", maxZoom: 7, defaultOpacity: 0.55, useDefaultDate: true },
  { id: "GRA", label: "GRA", name: "Geo Ring Airmass", category: "GEOSTATIONARY",
    gibsLayer: "Geostationary_Ring_Airmass_RGB", gibsFormat: "jpg", maxZoom: 7, defaultOpacity: 0.55, useDefaultDate: true },
  // Hydro & Terrain
  { id: "SWO", label: "SWO", name: "Surface Water", category: "HYDRO",
    tileUrl: "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png", maxZoom: 13, defaultOpacity: 0.6 },
  { id: "SWC", label: "SWC", name: "Water Change", category: "HYDRO",
    tileUrl: "https://storage.googleapis.com/global-surface-water/tiles2021/change/{z}/{x}/{y}.png", maxZoom: 13, defaultOpacity: 0.6 },
  { id: "BAT", label: "BAT", name: "Bathymetry", category: "HYDRO",
    tileUrl: "https://tiles.emodnet-bathymetry.eu/v12/mean_atlas_land_latest/web_mercator/{z}/{x}/{y}.png", maxZoom: 12, defaultOpacity: 0.5 },
];

function buildTileLayer(config: { id: string; tileUrl?: string; gibsLayer?: string; gibsFormat?: "jpg" | "png"; maxZoom: number; useDefaultDate?: boolean }, opacity: number) {
  if (config.tileUrl) {
    return createRasterTileLayer({ id: `tile-${config.id}`, data: config.tileUrl, maxZoom: config.maxZoom, opacity });
  }
  if (config.gibsLayer) {
    return createGIBSLayer({
      id: `gibs-${config.id}`,
      layer: config.gibsLayer,
      date: config.useDefaultDate ? "default" : NASA_GIBS_SAFE_DATE,
      opacity,
      maxZoom: config.maxZoom,
      format: config.gibsFormat || "jpg",
    });
  }
  return null;
}

export default function BorderMap({
  onProvinceSelect,
}: {
  onProvinceSelect?: (p: ProvinceSelection) => void;
}) {
  const { isHistorical, timeWindow } = useTimeWindow();
  const [viewState, setViewState] = useState(() =>
    clampViewState(INITIAL_VIEW_STATE, null),
  );
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRegionalFrame, setShowRegionalFrame] = useState(true);
  const [showOperationalSpines, setShowOperationalSpines] = useState(true);
  const [showOperationalNodes, setShowOperationalNodes] = useState(true);
  const [showRoadAlerts, setShowRoadAlerts] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showVessels, setShowVessels] = useState(false);
  const [showSignalPulse, setShowSignalPulse] = useState(false);
  const [showDams, setShowDams] = useState(true);
  const [dams, setDams] = useState<InfrastructureFeature[]>([]);
  const [areControlsOpen, setAreControlsOpen] = useState(false);
  const [baseMapOpacity, setBaseMapOpacity] = useState(85);
  const [activeBaseId, setActiveBaseId] = useState("ESRI");
  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(
    () => new Set(["NGT"]),
  );
  const [activeTheaterId, setActiveTheaterId] = useState<
    "national" | "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier" | "deep-south"
  >("national");
  const [selectedOperationalNodeId, setSelectedOperationalNodeId] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [regionBorders, setRegionBorders] = useState<RegionBorderCollection | null>(null);
  const [zones, setZones] = useState<ConflictZoneCollection | null>(null);
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [operationsMap, setOperationsMap] = useState<BorderOperationalMapResponse | null>(null);
  const [recentSignals, setRecentSignals] = useState<{ id: string; lat: number; lng: number; signal_type: string; severity: string; published_at: string; title: string }[]>([]);
  const [feedAlerts, setFeedAlerts] = useState<FeedAlert[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, fir, flt, ref, borders, zn, runtimeStatus, ves, traffic, operations, sig] = await Promise.all([
          fetchJson<IncidentFeature[]>("/api/border/incidents", []),
          fetchJson<FireEvent[]>("/api/fires", []),
          fetchJson<FlightData[]>("/api/flights", []),
          fetchJson<RefugeeMovement[]>("/api/border/movements", []),
          fetchJson<unknown>("/data/region_borders.geojson", null),
          fetchJson<unknown>("/data/conflict_zones.geojson", null),
          fetchJson<unknown>("/api/status", null),
          fetchJson<{ vessels?: VesselPosition[] }>("/api/border/vessels", { vessels: [] }),
          fetchJson<unknown>("/api/border/traffic", []),
          fetchJson<unknown>("/api/border/operations-map", null),
          fetchJson<{ signals?: { id: string; lat: number; lng: number; signal_type: string; severity: string; published_at: string; title: string }[] }>(
            `/api/research/signals?from=${new Date(Date.now() - 86400000).toISOString()}&limit=100`,
            { signals: [] },
          ),
        ]);

        setIncidents(Array.isArray(inc) ? inc : []);
        setFires(Array.isArray(fir) ? fir : []);
        setFlights(Array.isArray(flt) ? flt : []);
        setRefugees(Array.isArray(ref) ? ref : []);
        setRegionBorders(isRegionBorderCollection(borders) ? borders : null);
        setZones(isConflictZoneCollection(zn) ? zn : null);
        setVessels(ves?.vessels || []);
        setTrafficIncidents(
          Array.isArray(traffic)
            ? traffic.filter(isTrafficIncident)
            : [],
        );
        setOperationsMap(
          isBorderOperationalMapResponse(operations) ? operations : null,
        );
        setRecentSignals((sig?.signals || []).filter((s: { lat?: number; lng?: number }) => s.lat && s.lng));
        setFeedAlerts(
          buildFeedAlerts(
            isDashboardStatusPayload(runtimeStatus) ? runtimeStatus : null,
            ["conflict_events", "fires", "traffic"],
          ),
        );
      } catch (e) {
        console.error("Map data load error:", e);
      }
    };
    load();
    const poll = setInterval(load, 60000);
    return () => clearInterval(poll);
  }, []);

  // Static infrastructure (dams, datacenters, …) — fetched on demand
  // because the API requires a bbox. Re-fetches when the viewport changes
  // (debounced 600 ms so a pan doesn't fire every frame).
  useEffect(() => {
    if (!showDams) {
      setDams([]);
      return;
    }
    const pad = 1.5;
    const minLon = viewState.longitude - pad;
    const maxLon = viewState.longitude + pad;
    const minLat = viewState.latitude - pad;
    const maxLat = viewState.latitude + pad;
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/infrastructure?kind=dams&bbox=${bbox}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { features: [] }))
        .then((d) => {
          if (Array.isArray(d?.features)) setDams(d.features);
        })
        .catch((e) => {
          if (e?.name !== "AbortError") console.warn("dams fetch failed", e);
        });
    }, 600);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [showDams, viewState.longitude, viewState.latitude]);

  const toggleOverlay = useCallback((id: string) => {
    setActiveOverlayIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const activeBase = useMemo(() => BASE_MAPS.find(b => b.id === activeBaseId) || BASE_MAPS[0], [activeBaseId]);
  const activeTheater = useMemo(
    () =>
      activeTheaterId === "national"
        ? null
        : operationsMap?.theaters.find((theater) => theater.id === activeTheaterId) ?? null,
    [activeTheaterId, operationsMap],
  );
  const focusNodes = useMemo(() => {
    if (!operationsMap) {
      return [];
    }

    if (activeTheaterId === "national") {
      return operationsMap.nodes.filter((node) => node.emphasis === "primary");
    }

    return operationsMap.nodes.filter((node) => node.theaterId === activeTheaterId);
  }, [activeTheaterId, operationsMap]);
  const selectedOperationalNode = useMemo(
    () =>
      operationsMap?.nodes.find((node) => node.id === selectedOperationalNodeId) ?? null,
    [operationsMap, selectedOperationalNodeId],
  );
  const deepZoomUnlocked = useMemo(
    () => resolveViewportMaxZoom(viewState, operationsMap) > GENERAL_MAX_BORDER_ZOOM,
    [viewState, operationsMap],
  );

  const jumpToView = useCallback(
    (nextView: MapViewState) => {
      setViewState(clampViewState(nextView, operationsMap));
    },
    [operationsMap],
  );

  const focusNationalFrame = useCallback(() => {
    setActiveTheaterId("national");
    setSelectedOperationalNodeId(null);
    jumpToView((operationsMap?.nationalView ?? INITIAL_VIEW_STATE) as MapViewState);
  }, [jumpToView, operationsMap]);

  const focusTheater = useCallback((theaterId: "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier" | "deep-south") => {
    const theater = operationsMap?.theaters.find((item) => item.id === theaterId);

    if (!theater) {
      return;
    }

    setActiveTheaterId(theater.id);
    setSelectedOperationalNodeId(null);
    jumpToView(theater.focusView as MapViewState);
  }, [jumpToView, operationsMap]);

  const focusNode = useCallback((nodeId: string) => {
    const node = operationsMap?.nodes.find((item) => item.id === nodeId);

    if (!node) {
      return;
    }

    setActiveTheaterId(node.theaterId);
    setSelectedOperationalNodeId(node.id);
    jumpToView(node.focusView as MapViewState);
  }, [jumpToView, operationsMap]);

  // Base map layers — change only when basemap selection changes
  const baseLayers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

    // 1. ESRI aerial always at bottom as fallback (toolkit fallback chain)
    if (activeBase.id !== "ESRI") {
      result.push(createRasterTileLayer({
        id: "esri-fallback",
        data: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        opacity: 1,
      }));
    }

    // 2. Selected base map
    const baseLayer = buildTileLayer(activeBase, baseMapOpacity / 100);
    if (baseLayer) result.push(baseLayer);

    // 3. Active data overlays (stackable)
    for (const overlay of DATA_OVERLAYS) {
      if (activeOverlayIds.has(overlay.id)) {
        const layer = buildTileLayer(overlay, overlay.defaultOpacity);
        if (layer) result.push(layer);
      }
    }

    return result.flat().filter(Boolean);
  }, [activeBase, baseMapOpacity, activeOverlayIds]);

  // Intelligence layers — change only when data changes
  const intelligenceLayers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

    if (showRegionalFrame && regionBorders) {
      result.push(createRegionalBorderLayer(regionBorders));
    }
    if (showZones && zones) result.push(createConflictZonesLayer(zones));
    result.push(showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents, onProvinceSelect));
    if (showFires) result.push(createFireLayer(fires));
    if (showRefugees) result.push(createRefugeeLayer(refugees));
    if (showFlights) result.push(createFlightPathsLayer(flights));
    if (showVessels && vessels.length > 0) result.push(createVesselLayer(vessels));
    if (showSignalPulse && recentSignals.length > 0) result.push(createSignalPulseLayer(recentSignals));
    if (showDams) result.push(createInfrastructureLayer(dams, "dams"));

    return result.flat().filter(Boolean);
  }, [showRegionalFrame, regionBorders, showZones, zones, showHeatmap, incidents, onProvinceSelect, showFires, fires, showRefugees, refugees, showFlights, flights, showVessels, vessels, showSignalPulse, recentSignals, showDams, dams]);

  // UI/interaction layers — change on viewport (but these are lightweight)
  const uiLayers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

    // Distance grid (from DrNon Toolkit)
    if (showGrid) {
      const gridBounds = {
        west: viewState.longitude - 6,
        east: viewState.longitude + 6,
        south: viewState.latitude - 4,
        north: viewState.latitude + 4,
      };
      const gridLayer = createKilometerGridLayer(gridBounds);
      if (gridLayer) result.push(gridLayer);
    }

    if (showOperationalSpines && operationsMap) {
      result.push(
        createOperationalCorridorLayers(
          operationsMap.corridors,
          viewState.zoom,
          activeTheater?.id ?? null,
        ),
      );
    }
    if (showOperationalNodes && operationsMap) {
      result.push(
        createOperationalNodeLayers(
          operationsMap.nodes,
          viewState.zoom,
          activeTheater?.id ?? null,
          selectedOperationalNodeId,
        ),
      );
    }
    if (showRoadAlerts && trafficIncidents.length > 0) {
      result.push(createTrafficIncidentLayers(trafficIncidents, viewState.zoom));
    }
    if (showLabels) result.push(createProvinceLabelsLayer());

    return result.flat().filter(Boolean);
  }, [viewState.longitude, viewState.latitude, viewState.zoom, showGrid, showOperationalSpines, operationsMap, activeTheater, showOperationalNodes, selectedOperationalNodeId, showRoadAlerts, trafficIncidents, showLabels]);

  // Combine all layer groups
  const layers = [...baseLayers, ...intelligenceLayers, ...uiLayers];

  const activeLayersCount = [showRegionalFrame, showOperationalSpines, showOperationalNodes, showRoadAlerts, showHeatmap, showFires, showFlights, showRefugees, showZones, showLabels, showGrid, showVessels, showSignalPulse, showDams].filter(Boolean).length;
  const activeOverlayCount = activeOverlayIds.size;

  const handleClearAll = () => {
    setShowHeatmap(false);
    setShowFires(true);
    setShowFlights(true);
    setShowRefugees(true);
    setShowZones(true);
    setShowRegionalFrame(true);
    setShowOperationalSpines(true);
    setShowOperationalNodes(true);
    setShowRoadAlerts(true);
    setShowLabels(true);
    setShowGrid(false);
    setShowVessels(false);
    setShowSignalPulse(false);
    setActiveOverlayIds(new Set());
    setActiveBaseId("ESRI");
    focusNationalFrame();
  };

  // Group overlays by category for display
  const overlaysByCategory = useMemo(() => {
    const groups: Record<string, OverlayConfig[]> = {};
    for (const o of DATA_OVERLAYS) {
      if (!groups[o.category]) groups[o.category] = [];
      groups[o.category].push(o);
    }
    return groups;
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      <div className="pointer-events-none absolute inset-0 bg-[#05070a]" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute right-6 top-6 hidden max-w-[260px] border border-white/15 bg-black px-3 py-2 text-[13px] leading-relaxed text-white/70 xl:block">
          <div className="text-[12px] font-black uppercase tracking-[0.22em] text-white/45">
            Tri-Border Operations
          </div>
          <div className="mt-1 font-black uppercase tracking-[0.08em] text-white">
            {selectedOperationalNode?.label ?? activeTheater?.label ?? "Thailand / neighbor frame"}
          </div>
          <div className="mt-1">
            {selectedOperationalNode?.usage ?? activeTheater?.summary ?? "Zoom guardrails stay tight until the viewport reaches a real conflict theater or SEZ."}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[12px] font-black uppercase tracking-[0.14em]">
            <span className={`border px-2 py-1 ${deepZoomUnlocked ? "border-[#f97316]/40 bg-[#f97316]/10 text-[#fdba74]" : "border-white/10 bg-white/5 text-white/45"}`}>
              {deepZoomUnlocked ? "Deep zoom unlocked" : "Strategic frame only"}
            </span>
            <span className="border border-white/10 bg-white/5 px-2 py-1 text-white/55">
              Max zoom {resolveViewportMaxZoom(viewState, operationsMap).toFixed(1)}x
            </span>
          </div>
          {isHistorical && timeWindow ? (
            <div className="mt-2 border-t border-white/10 pt-2 text-[12px] font-black uppercase tracking-[0.18em] text-[#fda4af]">
              Map and overlay feeds stay live during playback for {formatBangkokDayLabel(timeWindow.bangkokDay)}.
            </div>
          ) : null}
        </div>
      </div>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) =>
          setViewState(clampViewState(nv as MapViewState, operationsMap))
        }
        controller={true}
        layers={layers}
        style={{ position: "absolute", inset: "0" }}
      />

      <button
        type="button"
        onClick={() => setAreControlsOpen(true)}
        aria-label="Open map controls"
        className="absolute left-3 top-3 z-40 h-11 border border-white/30 bg-black px-3 text-[13px] font-black uppercase tracking-[0.16em] text-white xl:hidden"
      >
        Map · {activeBase.label}
      </button>

      {/* ── Layer Control Panel ─────────────────────────────── */}
      <div className={`absolute left-3 top-3 z-50 max-h-[calc(100%-24px)] w-[calc(100%-24px)] max-w-[340px] flex-col gap-1.5 overflow-y-auto xl:left-6 xl:top-6 xl:flex xl:max-h-none xl:w-[340px] xl:overflow-visible ${areControlsOpen ? "flex" : "hidden"}`}>

        <div className="bg-white border border-black overflow-hidden">
          <div className="px-3 py-2 bg-black text-white flex items-center gap-2">
            <MapPinned size={13} className="text-[var(--accent)]" />
            <span className="text-[13px] font-black uppercase tracking-[0.2em]">Operations Focus</span>
            <span className="text-[12px] font-mono opacity-40 ml-auto">
              {activeTheater?.counterpart ?? "THA+"}
            </span>
            <button
              type="button"
              onClick={() => setAreControlsOpen(false)}
              aria-label="Close map controls"
              className="ml-1 flex h-8 w-8 items-center justify-center border border-white/20 text-lg xl:hidden"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-[1px] bg-black/10 p-[1px]">
            <button
              onClick={focusNationalFrame}
              className={`px-2 py-2 text-left transition-all ${activeTheaterId === "national" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
            >
              <div className="text-[13px] font-black uppercase tracking-[0.14em]">National frame</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] opacity-50">
                Thailand + neighbors only
              </div>
            </button>
            {(operationsMap?.theaters ?? []).map((theater) => (
              <button
                key={theater.id}
                onClick={() => focusTheater(theater.id)}
                className={`px-2 py-2 text-left transition-all ${activeTheaterId === theater.id ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
              >
                <div className="text-[13px] font-black uppercase tracking-[0.14em]">{theater.label}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] opacity-50">
                  {theater.counterpart} theater
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-black/10 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[12px] font-black uppercase tracking-[0.22em] opacity-40">
                Deep zoom gates
              </div>
              <div className={`text-[12px] font-black uppercase tracking-[0.18em] ${deepZoomUnlocked ? "text-[#ea580c]" : "text-black/35"}`}>
                {deepZoomUnlocked ? "unlocked" : "locked"}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-[1px] bg-black/10 p-[1px]">
              {focusNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => focusNode(node.id)}
                  className={`px-2 py-2 text-left transition-all ${selectedOperationalNodeId === node.id ? "bg-[#111827] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                  <div className="text-[12px] font-black uppercase tracking-[0.14em]">
                    {node.shortLabel}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] opacity-50">
                    {node.type.replace("-", " ")}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[12px] leading-relaxed text-black/55">
              {selectedOperationalNode?.summary ??
                activeTheater?.summary ??
                "Conflict theaters and SEZ gates unlock the maximum zoom. Everywhere else stays on the strategic frame."}
            </div>
          </div>
        </div>

        {/* ── BASE MAP (radio — choose one) ── */}
        <div className="bg-white border border-black overflow-hidden">
          <div className="px-3 py-2 bg-black text-white flex items-center gap-2">
            <Globe size={13} className="text-[var(--accent)]" />
            <span className="text-[13px] font-black uppercase tracking-[0.2em]">Base Map</span>
            <span className="text-[12px] font-mono opacity-40 ml-auto">{activeBase.label}</span>
          </div>
          <div className="grid grid-cols-4 gap-[1px] bg-black/10 p-[1px]">
            {BASE_MAPS.map(bm => {
              const tip = BASE_MAP_TOOLTIPS[bm.id];
              const btn = (
                <button
                  key={bm.id}
                  onClick={() => setActiveBaseId(bm.id)}
                  className={`py-2 px-1 flex flex-col items-center gap-0.5 transition-all w-full ${activeBaseId === bm.id ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
                >
                  <span className="text-[13px] font-black tracking-wider leading-none">{bm.label}</span>
                  <span className="text-[11px] font-medium opacity-40 uppercase leading-tight text-center break-words hyphens-auto w-full">{bm.name}</span>
                </button>
              );
              return tip ? <CommandTooltip key={bm.id} content={tip} position="right">{btn}</CommandTooltip> : btn;
            })}
          </div>
        </div>

        {/* ── DATA OVERLAYS (checkbox — stackable) ── */}
        <div className="bg-white border border-black overflow-hidden">
          <div className="px-3 py-2 bg-black text-white flex items-center gap-2">
            <Layers size={13} className="text-[var(--accent)]" />
            <span className="text-[13px] font-black uppercase tracking-[0.2em]">Data Overlays</span>
            {activeOverlayCount > 0 && (
              <span className="text-[13px] font-black tabular-nums ml-auto bg-[var(--accent)] text-white w-5 h-5 flex items-center justify-center">{activeOverlayCount}</span>
            )}
          </div>
          <div className="max-h-[240px] overflow-y-auto no-scrollbar">
            {Object.entries(overlaysByCategory).map(([cat, overlays]) => (
              <div key={cat} className="border-b border-black/10 last:border-0">
                <div className="px-3 py-1 text-[12px] font-black uppercase tracking-[0.3em] opacity-30 bg-gray-50">{cat}</div>
                <div className="grid grid-cols-3 gap-[1px] bg-black/5 px-[1px] pb-[1px]">
                  {overlays.map(ov => {
                    const active = activeOverlayIds.has(ov.id);
                    const tip = OVERLAY_TOOLTIPS[ov.id];
                    const btn = (
                      <button
                        onClick={() => toggleOverlay(ov.id)}
                        className={`py-1.5 px-2 flex items-center gap-1.5 transition-all w-full ${active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
                      >
                        {active && <Check size={11} strokeWidth={4} />}
                        <div className="min-w-0">
                          <div className="text-[13px] font-black tracking-wider leading-none">{ov.label}</div>
                          <div className="text-[11px] font-medium opacity-40 uppercase truncate leading-tight mt-0.5">{ov.name}</div>
                        </div>
                      </button>
                    );
                    return tip ? <CommandTooltip key={ov.id} content={tip} position="right">{btn}</CommandTooltip> : <div key={ov.id}>{btn}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex bg-white h-8 border border-black overflow-hidden divide-x divide-black">
          {[
            { active: showRegionalFrame, set: setShowRegionalFrame, label: "FRAME", icon: Globe },
            { active: showOperationalSpines, set: setShowOperationalSpines, label: "SPINE", icon: Route },
            { active: showOperationalNodes, set: setShowOperationalNodes, label: "NODE", icon: Building2 },
            { active: showRoadAlerts, set: setShowRoadAlerts, label: "ROAD", icon: Truck },
          ].map((toggle) => (
            <button
              key={toggle.label}
              onClick={() => toggle.set(!toggle.active)}
              className={`flex-1 flex items-center justify-center gap-1 transition-all ${toggle.active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
            >
              <toggle.icon size={12} />
              <span className="text-[12px] font-black tracking-wider">{toggle.label}</span>
            </button>
          ))}
        </div>

        {/* ── Intelligence Overlays ── */}
        <div className="flex bg-white h-8 border border-black overflow-hidden divide-x divide-black">
          {[
            { active: showHeatmap, set: setShowHeatmap, label: "HEAT", icon: Layers },
            { active: showFires, set: setShowFires, label: "THRM", icon: Flame },
            { active: showFlights, set: setShowFlights, label: "AIR", icon: Plane },
            { active: showRefugees, set: setShowRefugees, label: "FLOW", icon: Users },
            { active: showZones, set: setShowZones, label: "ZONE", icon: Target },
            { active: showLabels, set: setShowLabels, label: "LBL", icon: Globe },
            { active: showGrid, set: setShowGrid, label: "GRID", icon: Grid3x3 },
            { active: showVessels, set: setShowVessels, label: "SHIP", icon: Ship },
            { active: showSignalPulse, set: setShowSignalPulse, label: "SIG", icon: Radio },
            { active: showDams, set: setShowDams, label: "DAM", icon: Building2 },
          ].map((t) => {
            const tip = INTEL_TOGGLE_TOOLTIPS[t.label];
            const btn = (
              <button onClick={() => t.set(!t.active)} className={`flex-1 flex items-center justify-center gap-1 transition-all ${t.active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
                <t.icon size={12} />
                <span className="text-[12px] font-black tracking-wider">{t.label}</span>
              </button>
            );
            return tip ? <CommandTooltip key={t.label} content={tip} position="bottom">{btn}</CommandTooltip> : <div key={t.label}>{btn}</div>;
          })}
        </div>

        {/* ── Status bar ── */}
        <div className="flex bg-black text-white h-7 items-center justify-between border border-black px-3">
          <div className="flex items-center gap-2">
            <Layers size={12} className="text-[var(--accent)]" />
            <span className="text-[13px] font-black uppercase tracking-[0.15em]">Active: {activeLayersCount + activeOverlayCount}</span>
            <button
              type="button"
              onClick={() => toggleOverlay("NGT")}
              className={`ml-2 inline-flex items-center gap-1 border px-1.5 py-0.5 text-[12px] font-black uppercase tracking-[0.14em] ${
                activeOverlayIds.has("NGT")
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-white/25 text-white/50"
              }`}
              title="VIIRS night lights — settlement / corridor activity proxy"
            >
              SAT · NGT
              <span className="opacity-50">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </button>
            <span className="text-[12px] font-mono uppercase tracking-[0.12em] text-white/40">
              FIRMS {fires.length}
            </span>
          </div>
          <button onClick={handleClearAll} className="text-[12px] font-black underline uppercase opacity-40 hover:opacity-100 transition-all">Reset</button>
        </div>

        {feedAlerts.length > 0 && (
          <div className="border border-black bg-[#fff7ed] px-3 py-2 text-[#9a3412]">
            <div className="text-[12px] font-black uppercase tracking-[0.22em]">Feed Integrity</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {feedAlerts.map((alert) => (
                <span
                  key={alert.id}
                  title={alert.details}
                  className="border border-[#f59e0b]/40 bg-white px-2 py-1 text-[12px] font-black uppercase tracking-[0.14em]"
                >
                  {alert.label} {alert.state}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Opacity slider ── */}
        <div className="flex bg-white h-7 items-center border border-black px-3 gap-2">
          <Eye size={12} className="opacity-40" />
          <span className="text-[12px] font-black uppercase opacity-30 shrink-0">Base</span>
          <input type="range" className="flex-1 accent-black h-1" value={baseMapOpacity} onChange={e => setBaseMapOpacity(parseInt(e.target.value))} />
          <span className="text-[13px] font-black tabular-nums opacity-40 w-8 text-right">{baseMapOpacity}%</span>
        </div>
      </div>

      {/* ── Operational Intelligence HUD ── */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-40 hidden space-y-2 xl:block">
        <div className="flex items-center gap-4 bg-black text-white px-4 py-2 border border-white/20">
          <Zap size={14} className="text-[var(--accent)] animate-pulse" />
          <span className="text-[14px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex gap-6">
            {[
              { label: "SIGNALS", val: incidents?.length || 0 },
              { label: "ROAD", val: trafficIncidents?.length || 0 },
              { label: "THERMAL", val: fires?.length || 0 },
              { label: "AIR", val: flights?.length || 0 },
              { label: "FLOW", val: refugees?.length || 0 },
              { label: "VESSEL", val: vessels?.length || 0 },
              { label: "PULSE", val: recentSignals?.length || 0 },
            ].map(m => (
              <div key={m.label} className="flex flex-col">
                <span className="text-[13px] font-black opacity-40 uppercase mb-0.5">{m.label}</span>
                <span className="text-[16px] font-black tabular-nums leading-none">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-14 z-40 grid h-10 grid-cols-3 border border-white/20 bg-black text-white xl:hidden">
        {[
          { label: "Signals", value: incidents.length },
          { label: "Road", value: trafficIncidents.length },
          { label: "Thermal", value: fires.length },
        ].map((metric) => (
          <div key={metric.label} className="flex items-center justify-between border-r border-white/10 px-2 last:border-r-0">
            <span className="text-[12px] font-black uppercase tracking-[0.08em] text-white/45">{metric.label}</span>
            <span className="text-[14px] font-black tabular-nums">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-40 flex flex-col gap-1 xl:bottom-6 xl:right-6">
        <button onClick={focusNationalFrame} className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
          <Compass size={15} strokeWidth={3} />
        </button>
        <button
          onClick={() => {
            if (selectedOperationalNode) {
              focusNode(selectedOperationalNode.id);
              return;
            }

            if (activeTheater) {
              focusTheater(activeTheater.id);
              return;
            }

            focusNationalFrame();
          }}
          className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
        >
          <Maximize2 size={15} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
