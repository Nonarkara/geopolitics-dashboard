"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { MapViewState } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import dynamic from "next/dynamic";
import {
  Globe, Layers, Flame, Maximize2, Compass, Zap, Eye, Plane, Users, Target, Check, Grid3x3, Ship, Radio, Wind, MapPin
} from "lucide-react";
import CommandTooltip from "../Common/CommandTooltip";
import { BASE_MAP_TOOLTIPS, OVERLAY_TOOLTIPS, INTEL_TOGGLE_TOOLTIPS } from "../../lib/tooltip-catalog";
import {
  createFireLayer, createHeatmapLayer, createIncidentLayer, createRasterTileLayer, createGIBSLayer, createFlightPathsLayer, createRefugeeLayer, createConflictZonesLayer, createProvinceLabelsLayer, createKilometerGridLayer, createVesselLayer, createSignalPulseLayer, createAirQualityHeatmapLayers
} from "../../services/map-engine";
import type {
  AirQualityPoint,
  DashboardDatasetStatus,
  DashboardStatusPayload,
  FireEvent,
  IncidentFeature,
  ProvinceSelection,
  FlightData,
  RefugeeMovement,
  ConflictZoneCollection,
  VesselPosition,
} from "../../types/dashboard";
import { getUsableMapboxToken } from "../../lib/mapbox";
import { BORDER_AREAS } from "../../lib/border-regions";
import type { BorderAreaId } from "../../lib/border-regions";
import FrontierNewsPanel from "./FrontierNewsPanel";

const MapboxMap = dynamic(() => import("react-map-gl/mapbox"), { ssr: false });
const RAW_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_TOKEN = getUsableMapboxToken(RAW_TOKEN);

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 100.85, latitude: 14.2, zoom: 6.25, pitch: 40, bearing: 0,
};

const THAILAND_BORDER_BOUNDS = {
  west: 94.5, east: 107.5, south: 4.5, north: 22.5,
} as const;
const MIN_BORDER_ZOOM = 5.6;
const MAX_BORDER_ZOOM = 12.5;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampViewState(viewState: MapViewState): MapViewState {
  return {
    ...viewState,
    longitude: clamp(viewState.longitude, THAILAND_BORDER_BOUNDS.west, THAILAND_BORDER_BOUNDS.east),
    latitude: clamp(viewState.latitude, THAILAND_BORDER_BOUNDS.south, THAILAND_BORDER_BOUNDS.north),
    zoom: clamp(viewState.zoom, MIN_BORDER_ZOOM, MAX_BORDER_ZOOM),
    pitch: clamp(viewState.pitch ?? INITIAL_VIEW_STATE.pitch ?? 0, 0, 60),
  };
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
  /** Mapbox style URL — rendered via react-map-gl instead of deck.gl tiles */
  mapboxStyle?: string;
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
  const [viewState, setViewState] = useState(() => clampViewState(INITIAL_VIEW_STATE));
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFires, setShowFires] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showVessels, setShowVessels] = useState(false);
  const [showSignalPulse, setShowSignalPulse] = useState(false);
  const [showAqi, setShowAqi] = useState(false);
  const [activeFrontier, setActiveFrontier] = useState<string | null>(null);
  const [baseMapOpacity, setBaseMapOpacity] = useState(85);
  const [activeBaseId, setActiveBaseId] = useState("ESRI");
  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(new Set());

  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [fires, setFires] = useState<FireEvent[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [refugees, setRefugees] = useState<RefugeeMovement[]>([]);
  const [zones, setZones] = useState<ConflictZoneCollection | null>(null);
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const [aqiData, setAqiData] = useState<AirQualityPoint[]>([]);
  const [recentSignals, setRecentSignals] = useState<{ id: string; lat: number; lng: number; signal_type: string; severity: string; published_at: string; title: string }[]>([]);
  const [feedAlerts, setFeedAlerts] = useState<FeedAlert[]>([]);

  // Mapbox account removed — always use the free Deck.gl tile layers (ESRI /
  // CARTO / OSM) as the base. No token, no account, no billing.
  const hasMapboxToken = false;

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, fir, flt, ref, zn, runtimeStatus, ves, sig, aqi] = await Promise.all([
          fetch("/api/border/incidents", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/fires", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/flights", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/border/movements", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
          fetch("/api/map/overlays", { cache: 'no-store' }).then(res => res.json()).catch(() => null),
          fetch("/api/status", { cache: 'no-store' }).then(res => res.json()).catch(() => null),
          fetch("/api/border/vessels", { cache: 'no-store' }).then(res => res.json()).catch(() => ({ vessels: [] })),
          fetch(`/api/research/signals?from=${new Date(Date.now() - 86400000).toISOString()}&limit=100`, { cache: 'no-store' }).then(res => res.json()).catch(() => ({ signals: [] })),
          fetch("/api/air-quality", { cache: 'no-store' }).then(res => res.json()).catch(() => []),
        ]);
        setIncidents(inc || []);
        setFires(fir || []);
        setFlights(flt || []);
        setRefugees(ref || []);
        setZones(zn || null);
        setVessels(ves?.vessels || []);
        setRecentSignals((sig?.signals || []).filter((s: { lat?: number; lng?: number }) => s.lat && s.lng));
        setAqiData(Array.isArray(aqi) ? aqi : []);
        setFeedAlerts(
          buildFeedAlerts(
            isDashboardStatusPayload(runtimeStatus) ? runtimeStatus : null,
            ["conflict_events", "fires"],
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

  const toggleOverlay = useCallback((id: string) => {
    setActiveOverlayIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const activeBase = useMemo(() => BASE_MAPS.find(b => b.id === activeBaseId) || BASE_MAPS[0], [activeBaseId]);

  const layers = useMemo(() => {
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

    // 4. Distance grid (from DrNon Toolkit)
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

    // 5. Intelligence layers
    if (showZones && zones) result.push(createConflictZonesLayer(zones));
    result.push(showHeatmap ? createHeatmapLayer(incidents) : createIncidentLayer(incidents, onProvinceSelect));
    if (showFires) result.push(createFireLayer(fires));
    if (showRefugees) result.push(createRefugeeLayer(refugees));
    if (showFlights) result.push(createFlightPathsLayer(flights));
    if (showVessels && vessels.length > 0) result.push(createVesselLayer(vessels));
    if (showSignalPulse && recentSignals.length > 0) result.push(createSignalPulseLayer(recentSignals));
    if (showAqi && aqiData.length > 0) result.push(...createAirQualityHeatmapLayers(aqiData, "aqi"));
    if (showLabels) result.push(createProvinceLabelsLayer());

    return result.flat().filter(Boolean);
  }, [activeBase, baseMapOpacity, activeOverlayIds, showGrid, viewState.longitude, viewState.latitude, showZones, zones, showHeatmap, incidents, onProvinceSelect, showFires, fires, showRefugees, refugees, showFlights, flights, showVessels, vessels, showSignalPulse, recentSignals, showAqi, aqiData, showLabels]);

  const activeLayersCount = [showHeatmap, showFires, showFlights, showRefugees, showZones, showLabels, showGrid, showVessels, showSignalPulse, showAqi].filter(Boolean).length;
  const activeOverlayCount = activeOverlayIds.size;

  const handleClearAll = () => {
    setShowHeatmap(false);
    setShowFires(false);
    setShowFlights(false);
    setShowRefugees(false);
    setShowZones(false);
    setShowLabels(false);
    setShowGrid(false);
    setShowVessels(false);
    setShowSignalPulse(false);
    setShowAqi(false);
    setActiveFrontier(null);
    setActiveOverlayIds(new Set());
    setActiveBaseId("ESRI");
  };

  const flyToFrontier = useCallback((areaId: string) => {
    if (activeFrontier === areaId) {
      // Toggle off — return to overview
      setActiveFrontier(null);
      setViewState(clampViewState(INITIAL_VIEW_STATE));
      return;
    }
    const area = BORDER_AREAS.find(a => a.id === areaId);
    if (!area) return;
    setActiveFrontier(areaId);
    setViewState(clampViewState({
      longitude: area.center[0],
      latitude: area.center[1],
      zoom: 8.2,
      pitch: 35,
      bearing: 0,
    }));
  }, [activeFrontier]);

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(255,59,48,0.16),transparent_22%),radial-gradient(circle_at_78%_74%,rgba(20,184,166,0.12),transparent_26%),radial-gradient(circle_at_58%_40%,rgba(245,158,11,0.08),transparent_20%),linear-gradient(180deg,#08111d_0%,#04070c_58%,#010203_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute left-[25%] top-[23%] border border-white/20 bg-black/35 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/80">
          Mae Sot
        </div>
        <div className="absolute left-[69%] top-[48%] border border-white/20 bg-black/35 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/80">
          Aranyaprathet
        </div>
        <div className="absolute left-[56%] top-[73%] border border-white/20 bg-black/35 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/80">
          Sadao
        </div>
      </div>

      {/* ── Frontier Navigation ── */}
      <div className="absolute right-6 top-6 z-40 flex flex-col gap-1.5 w-[220px]">
        <div className="border border-white/15 bg-black/70 backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-2 flex items-center gap-2">
            <MapPin size={10} className="text-[var(--accent)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">Frontier Nav</span>
          </div>
          <div className="flex divide-x divide-white/10">
            {[
              { id: "myanmar-frontier", label: "MYA", color: "var(--accent)" },
              { id: "cambodia-frontier", label: "KHM", color: "var(--hazard)" },
              { id: "malaysia-frontier", label: "MYS", color: "var(--tech)" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => flyToFrontier(f.id)}
                className={`flex-1 py-2 px-1 flex flex-col items-center gap-1 transition-all ${
                  activeFrontier === f.id
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="text-[10px] font-black tracking-wider">{f.label}</span>
                <span
                  className="w-full h-[2px]"
                  style={{ backgroundColor: activeFrontier === f.id ? f.color : "transparent" }}
                />
              </button>
            ))}
          </div>
        </div>
        {activeFrontier ? (
          <FrontierNewsPanel areaId={activeFrontier as BorderAreaId} />
        ) : (
          <div className="border border-white/10 bg-black/50 px-3 py-2 text-[8px] leading-relaxed text-white/50 backdrop-blur-sm">
            <span className="font-black uppercase tracking-[0.12em] text-white/70">
              Thailand Border Focus
            </span>
            <span className="block mt-0.5">
              {`${BASE_MAPS.length} basemaps, ${DATA_OVERLAYS.length} overlays`}
            </span>
          </div>
        )}
      </div>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nv }) =>
          setViewState(clampViewState(nv as MapViewState))
        }
        controller={true}
        layers={layers}
      >
        {hasMapboxToken ? (
          <MapboxMap
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-v9"
            attributionControl={false}
            renderWorldCopies={false}
            maxBounds={[
              [THAILAND_BORDER_BOUNDS.west, THAILAND_BORDER_BOUNDS.south],
              [THAILAND_BORDER_BOUNDS.east, THAILAND_BORDER_BOUNDS.north],
            ]}
          />
        ) : (
          <div className="absolute inset-0 border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)] pointer-events-none" />
        )}
      </DeckGL>

      {/* ── Layer Control Panel ─────────────────────────────── */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-1.5 w-72">

        {/* ── BASE MAP (radio — choose one) ── */}
        <div className="bg-white border border-black overflow-hidden">
          <div className="px-3 py-2 bg-black text-white flex items-center gap-2">
            <Globe size={11} className="text-[var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Base Map</span>
            <span className="text-[8px] font-mono opacity-40 ml-auto">{activeBase.label}</span>
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
                  <span className="text-[9px] font-black tracking-wider leading-none">{bm.label}</span>
                  <span className="text-[5.5px] font-medium opacity-40 uppercase leading-tight text-center">{bm.name}</span>
                </button>
              );
              return tip ? <CommandTooltip key={bm.id} content={tip} position="right">{btn}</CommandTooltip> : btn;
            })}
          </div>
        </div>

        {/* ── DATA OVERLAYS (checkbox — stackable) ── */}
        <div className="bg-white border border-black overflow-hidden">
          <div className="px-3 py-2 bg-black text-white flex items-center gap-2">
            <Layers size={11} className="text-[var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Overlays</span>
            {activeOverlayCount > 0 && (
              <span className="text-[9px] font-black tabular-nums ml-auto bg-[var(--accent)] text-white w-5 h-5 flex items-center justify-center">{activeOverlayCount}</span>
            )}
          </div>
          <div className="max-h-[240px] overflow-y-auto no-scrollbar">
            {Object.entries(overlaysByCategory).map(([cat, overlays]) => (
              <div key={cat} className="border-b border-black/10 last:border-0">
                <div className="px-3 py-1 text-[7px] font-black uppercase tracking-[0.3em] opacity-30 bg-gray-50">{cat}</div>
                <div className="grid grid-cols-3 gap-[1px] bg-black/5 px-[1px] pb-[1px]">
                  {overlays.map(ov => {
                    const active = activeOverlayIds.has(ov.id);
                    const tip = OVERLAY_TOOLTIPS[ov.id];
                    const btn = (
                      <button
                        onClick={() => toggleOverlay(ov.id)}
                        className={`py-1.5 px-2 flex items-center gap-1.5 transition-all w-full ${active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
                      >
                        {active && <Check size={8} strokeWidth={4} />}
                        <div className="min-w-0">
                          <div className="text-[9px] font-black tracking-wider leading-none">{ov.label}</div>
                          <div className="text-[5.5px] font-medium opacity-40 uppercase truncate leading-tight mt-0.5">{ov.name}</div>
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
            { active: showAqi, set: setShowAqi, label: "AQI", icon: Wind },
          ].map((t) => {
            const tip = INTEL_TOGGLE_TOOLTIPS[t.label];
            const btn = (
              <button onClick={() => t.set(!t.active)} className={`flex-1 flex items-center justify-center gap-1 transition-all ${t.active ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
                <t.icon size={9} />
                <span className="text-[6.5px] font-black tracking-wider">{t.label}</span>
              </button>
            );
            return tip ? <CommandTooltip key={t.label} content={tip} position="bottom">{btn}</CommandTooltip> : <div key={t.label}>{btn}</div>;
          })}
        </div>

        {/* ── Status bar ── */}
        <div className="flex bg-black text-white h-7 items-center justify-between border border-black px-3">
          <div className="flex items-center gap-2">
            <Layers size={10} className="text-[var(--accent)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Active: {activeLayersCount + activeOverlayCount}</span>
          </div>
          <button onClick={handleClearAll} className="text-[8px] font-black underline uppercase opacity-40 hover:opacity-100 transition-all">Reset</button>
        </div>

        {feedAlerts.length > 0 && (
          <div className="border border-black bg-[#fff7ed] px-3 py-2 text-[#9a3412]">
            <div className="text-[8px] font-black uppercase tracking-[0.22em]">Feed Integrity</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {feedAlerts.map((alert) => (
                <span
                  key={alert.id}
                  title={alert.details}
                  className="border border-[#f59e0b]/40 bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em]"
                >
                  {alert.label} {alert.state}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Opacity slider ── */}
        <div className="flex bg-white h-7 items-center border border-black px-3 gap-2">
          <Eye size={10} className="opacity-40" />
          <span className="text-[7px] font-black uppercase opacity-30 shrink-0">Base</span>
          <input type="range" className="flex-1 accent-black h-1" value={baseMapOpacity} onChange={e => setBaseMapOpacity(parseInt(e.target.value))} />
          <span className="text-[10px] font-black tabular-nums opacity-40 w-8 text-right">{baseMapOpacity}%</span>
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
              { label: "FLOW", val: refugees?.length || 0 },
              { label: "VESSEL", val: vessels?.length || 0 },
              { label: "AQI", val: showAqi ? aqiData.filter(p => p.aqi > 100).length : 0 },
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
        <button onClick={() => setViewState(clampViewState(INITIAL_VIEW_STATE))} title="Reset view" className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
          <Compass size={14} strokeWidth={3} />
        </button>
        <button
          onClick={() => {
            const el = document.documentElement;
            if (!document.fullscreenElement) {
              el.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          title="Toggle fullscreen"
          className="h-8 w-8 bg-white border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all"
        >
          <Maximize2 size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
