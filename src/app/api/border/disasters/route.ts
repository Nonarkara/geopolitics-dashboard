import { NextResponse } from "next/server";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";
import { logFeedHealth } from "../../../../lib/supabase";

export const revalidate = 600;

export interface RegionalDisaster {
  id: string;
  title: string;
  type: string;
  alertLevel: string;
  lat: number;
  lng: number;
  date: string;
  source: string;
}

interface GDACSFeature {
  properties: {
    eventtype: string;
    eventid: number;
    name: string;
    description: string;
    alertlevel: string;
    alertscore: number;
    fromdate: string;
    todate: string;
    country: string;
    url: { report: string };
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface GDACSResponse {
  type: string;
  features: GDACSFeature[];
}

const SE_ASIA_BOUNDS = {
  minLat: 4,
  maxLat: 24,
  minLng: 92,
  maxLng: 110,
};

function inBounds(lat: number, lng: number): boolean {
  return (
    lat >= SE_ASIA_BOUNDS.minLat &&
    lat <= SE_ASIA_BOUNDS.maxLat &&
    lng >= SE_ASIA_BOUNDS.minLng &&
    lng <= SE_ASIA_BOUNDS.maxLng
  );
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  EQ: "Earthquake",
  FL: "Flood",
  TC: "Cyclone",
  VO: "Volcano",
  DR: "Drought",
  WF: "Wildfire",
};

const FALLBACK: RegionalDisaster[] = [];

export async function GET() {
  const t0 = Date.now();
  try {
    const fromDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = new Date().toISOString().slice(0, 10);

    const res = await fetch(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,FL,TC,VO,WF&fromDate=${fromDate}&toDate=${toDate}&alertlevel=Green;Orange;Red`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      void logFeedHealth({ feed_id: "disasters", status: "error", response_time_ms: Date.now() - t0, message: `HTTP ${res.status}` });
      return NextResponse.json(FALLBACK);
    }

    const json: GDACSResponse = await res.json();

    const disasters: RegionalDisaster[] = (json.features ?? [])
      .filter((f) => {
        if (!f.geometry || f.geometry.type !== "Point") return false;
        const [lng, lat] = f.geometry.coordinates;
        return inBounds(lat, lng);
      })
      .map((f) => ({
        id: `gdacs-${f.properties.eventtype}-${f.properties.eventid}`,
        title: f.properties.name || f.properties.description,
        type: EVENT_TYPE_LABELS[f.properties.eventtype] ?? f.properties.eventtype,
        alertLevel: f.properties.alertlevel ?? "Green",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        date: f.properties.fromdate ?? "",
        source: "GDACS",
      }))
      .slice(0, 15);

    // Archive disaster signals (non-blocking)
    void archiveSignalBatch(disasters.map((d): ArchiveSignal => ({
      external_id: d.id,
      signal_type: "disaster",
      source_provider: "gdacs",
      source_url: "https://www.gdacs.org",
      title: d.title,
      summary: `${d.type} — Alert: ${d.alertLevel}`,
      published_at: d.date || new Date().toISOString(),
      severity: d.alertLevel === "Red" ? "alert" : d.alertLevel === "Orange" ? "watch" : "stable",
      lat: d.lat,
      lng: d.lng,
    })));

    void logFeedHealth({ feed_id: "disasters", status: "ok", response_time_ms: Date.now() - t0, message: `${disasters.length} events` });
    return NextResponse.json(disasters);
  } catch {
    void logFeedHealth({ feed_id: "disasters", status: "error", response_time_ms: Date.now() - t0, message: "fetch failed" });
    return NextResponse.json(FALLBACK);
  }
}
