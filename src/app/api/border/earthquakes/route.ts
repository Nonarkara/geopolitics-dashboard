import { NextResponse } from "next/server";

export const revalidate = 300;

export interface SeismicEvent {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lng: number;
  depth: number;
  time: string;
  url: string;
}

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSResponse {
  type: string;
  features: USGSFeature[];
}

const SE_ASIA_BOUNDS = {
  minlatitude: 4,
  maxlatitude: 24,
  minlongitude: 92,
  maxlongitude: 110,
};

const FALLBACK: SeismicEvent[] = [];

export async function GET() {
  try {
    const params = new URLSearchParams({
      format: "geojson",
      starttime: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      minmagnitude: "3.0",
      minlatitude: String(SE_ASIA_BOUNDS.minlatitude),
      maxlatitude: String(SE_ASIA_BOUNDS.maxlatitude),
      minlongitude: String(SE_ASIA_BOUNDS.minlongitude),
      maxlongitude: String(SE_ASIA_BOUNDS.maxlongitude),
      orderby: "time",
      limit: "20",
    });

    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return NextResponse.json(FALLBACK);

    const json: USGSResponse = await res.json();

    const events: SeismicEvent[] = json.features.map((f) => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      time: new Date(f.properties.time).toISOString(),
      url: f.properties.url,
    }));

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
