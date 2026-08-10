"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BASE_MAPS,
  OVERLAYS,
  buildTileUrl,
  gibsDateFor,
  type BaseMapEntry,
  type OverlayEntry,
} from "../../lib/mapLayers";
import BaseMapSelector from "./BaseMapSelector";
import LayerToggle from "./LayerToggle";

// Blank MapLibre style — we render all base maps as raster layers on top.
// No token, no account — free and open-source (mapbox-gl account deleted 2026-07).
const BLANK_STYLE = {
  version: 8 as const,
  name: "blank",
  sources: {},
  layers: [
    {
      id: "bg",
      type: "background" as const,
      paint: { "background-color": "#0a0a0a" },
    },
  ],
};

interface Incident {
  id: string;
  geometry: { coordinates: [number, number] };
  properties: {
    title: string;
    type?: string;
    fatalities?: number;
    notes?: string;
    location?: string;
    eventDate?: string;
  };
}

interface Fire {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence?: string;
  acq_date?: string;
}

const BORDER_VIEWS: Record<string, { longitude: number; latitude: number; zoom: number }> = {
  "myanmar-frontier": { longitude: 98.5, latitude: 17.0, zoom: 7.2 },
  "cambodia-frontier": { longitude: 102.6, latitude: 13.8, zoom: 7.4 },
  "malaysia-frontier": { longitude: 100.4, latitude: 6.6, zoom: 7.6 },
};

export default function BorderMap({
  onSelectIncident,
  focusBorder,
}: {
  onSelectIncident: (i: Incident) => void;
  focusBorder: string | null;
}) {
  const mapRef = useRef<MapRef>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fires, setFires] = useState<Fire[]>([]);
  const [ready, setReady] = useState(false);

  // Base + overlay UI state
  const [activeBaseId, setActiveBaseId] = useState<string>("ESRI_SAT");
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());

  const toggleOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearOverlays = useCallback(() => setActiveOverlays(new Set()), []);

  // Fetch incidents + fires
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [inc, fir] = await Promise.all([
          fetch("/api/border/incidents", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/fires", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        ]);
        if (!alive) return;
        setIncidents(Array.isArray(inc) ? inc : []);
        const fArr: Fire[] = Array.isArray(fir) ? fir : [];
        const inBounds = fArr.filter(
          (f) =>
            f.latitude >= 4 && f.latitude <= 23 &&
            f.longitude >= 92 && f.longitude <= 108,
        );
        inBounds.sort((a, b) => (b.brightness ?? 0) - (a.brightness ?? 0));
        setFires(inBounds.slice(0, 400));
      } catch {}
    };
    load();
    const id = setInterval(load, 120_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Fly to focused border
  useEffect(() => {
    if (!focusBorder || !ready) return;
    const view = BORDER_VIEWS[focusBorder];
    if (!view) return;
    mapRef.current?.flyTo({
      center: [view.longitude, view.latitude],
      zoom: view.zoom,
      duration: 1400,
      essential: true,
    });
  }, [focusBorder, ready]);

  const activeBase = BASE_MAPS.find((b) => b.id === activeBaseId) ?? BASE_MAPS[0];
  const baseUrl = buildTileUrl(activeBase);
  const activeBaseDate = activeBase.needsDate ? gibsDateFor(activeBase.cadence) : undefined;
  const overlayEntries: OverlayEntry[] = OVERLAYS.filter((o) => activeOverlays.has(o.id));

  return (
    <div style={{ flex: 1, minWidth: 0, position: "relative", background: "#0a0a0a" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 100.8, latitude: 15.2, zoom: 5.6, pitch: 0, bearing: 0 }}
        mapStyle={BLANK_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onLoad={() => setReady(true)}
      >
        {/* Base map layer (dynamic) */}
        <Source
          id={`base-${activeBase.id}`}
          key={`base-${activeBase.id}`}
          type="raster"
          tiles={[baseUrl]}
          tileSize={256}
          maxzoom={activeBase.maxZoom}
          attribution={activeBase.source}
        >
          <Layer id={`base-layer-${activeBase.id}`} type="raster" paint={{ "raster-opacity": 1 }} />
        </Source>

        {/* Overlay layers (stackable) */}
        {overlayEntries.map((o) => {
          const url = buildTileUrl(o);
          if (!url) return null;
          return (
            <Source
              id={`ov-${o.id}`}
              key={`ov-${o.id}`}
              type="raster"
              tiles={[url]}
              tileSize={256}
              maxzoom={o.maxZoom}
              attribution={o.source}
            >
              <Layer
                id={`ov-layer-${o.id}`}
                type="raster"
                paint={{ "raster-opacity": o.defaultOpacity }}
              />
            </Source>
          );
        })}

        {/* Border regions (GeoJSON outline) */}
        <Source id="region-borders" type="geojson" data="/data/region_borders.geojson">
          <Layer
            id="border-fill"
            type="fill"
            paint={{ "fill-color": "#e24a3f", "fill-opacity": 0.04 }}
          />
          <Layer
            id="border-outline"
            type="line"
            paint={{ "line-color": "#e24a3f", "line-width": 1.5, "line-opacity": 0.6 }}
          />
        </Source>

        {/* Fire markers */}
        {fires.map((f, i) => (
          <Marker key={`f-${i}`} longitude={f.longitude} latitude={f.latitude} anchor="center">
            <div
              title={`Fire · brightness ${f.brightness?.toFixed(0)}K`}
              style={{
                width: 4,
                height: 4,
                background: "#f59e0b",
                opacity: 0.75,
                pointerEvents: "none",
              }}
            />
          </Marker>
        ))}

        {/* Incident markers */}
        {incidents.map((inc) => {
          const [lng, lat] = inc.geometry?.coordinates ?? [0, 0];
          if (!lng || !lat) return null;
          const fatalities = inc.properties?.fatalities ?? 0;
          const size = fatalities > 0 ? 12 : 8;
          return (
            <Marker key={inc.id} longitude={lng} latitude={lat} anchor="center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIncident(inc);
                }}
                aria-label={inc.properties?.title}
                style={{
                  width: size,
                  height: size,
                  background: fatalities > 0 ? "#e24a3f" : "#f59e0b",
                  border: "1px solid #fff",
                  padding: 0,
                  cursor: "pointer",
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.5)",
                }}
              />
            </Marker>
          );
        })}
      </Map>

      {/* Top-right chip */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          background: "rgba(10,10,10,0.85)",
          border: "1px solid var(--line-bright)",
          padding: "6px 10px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div className="rams-tick rams-tick-ok" />
        <div className="rams-label">Live</div>
        <div className="rams-value" style={{ fontSize: 11 }}>
          {incidents.length} incidents · {fires.length} fires
        </div>
      </div>

      {/* Selectors */}
      <BaseMapSelector activeId={activeBaseId} onSelect={setActiveBaseId} />
      <LayerToggle active={activeOverlays} onToggle={toggleOverlay} onClearAll={clearOverlays} />

      {/* Legend for map markers (bottom-left) */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          background: "rgba(10,10,10,0.85)",
          border: "1px solid var(--line-bright)",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div className="rams-label">Markers</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, background: "#e24a3f", border: "1px solid #fff" }} />
          <div style={{ fontSize: 11, color: "var(--ink)" }}>Incident · fatalities</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, background: "#f59e0b", border: "1px solid #fff" }} />
          <div style={{ fontSize: 11, color: "var(--ink)" }}>Incident</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 4, height: 4, background: "#f59e0b", opacity: 0.75 }} />
          <div style={{ fontSize: 11, color: "var(--ink)" }}>Fire (NASA FIRMS)</div>
        </div>
      </div>

      {/* Base map attribution card (bottom-right) */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          background: "rgba(10,10,10,0.85)",
          border: "1px solid var(--line-bright)",
          padding: "6px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pointerEvents: "auto",
          zIndex: 10,
          maxWidth: 300,
        }}
      >
        <div className="rams-label" style={{ fontSize: 9 }}>Base: {activeBase.name}</div>
        <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>
          {activeBase.sourceUrl ? (
            <a href={activeBase.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--ink-dim)" }}>
              {activeBase.source}
            </a>
          ) : (
            activeBase.source
          )}
          {activeBaseDate && (
            <span style={{ color: "var(--ink-muted)" }}> · {activeBaseDate}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export type { Incident };
