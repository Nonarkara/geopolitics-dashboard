import { NextResponse } from "next/server";

export const revalidate = 120;

interface LongdoEvent {
  eid: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  latitude: string;
  longitude: string;
  type: string;
  start: string;
  stop: string;
  icon: string;
  severity: number | string;
}

export interface TrafficIncident {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  severity: number;
  start: string;
  stop: string;
}

const BORDER_BOUNDS = {
  minLat: 5.5,
  maxLat: 20.5,
  minLng: 97.0,
  maxLng: 106.0,
};

function isNearBorder(lat: number, lng: number): boolean {
  return (
    lat >= BORDER_BOUNDS.minLat &&
    lat <= BORDER_BOUNDS.maxLat &&
    lng >= BORDER_BOUNDS.minLng &&
    lng <= BORDER_BOUNDS.maxLng
  );
}

const FALLBACK: TrafficIncident[] = [];

export async function GET() {
  try {
    const response = await fetch("https://event.longdo.com/feed/json", {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      return NextResponse.json(FALLBACK);
    }

    const events: LongdoEvent[] = await response.json();

    const incidents: TrafficIncident[] = events
      .map((event) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        return {
          id: event.eid,
          title: event.title_en || event.title,
          description: event.description_en || event.description,
          lat,
          lng,
          category: event.icon || "misc",
          severity: typeof event.severity === "number" ? event.severity : 0,
          start: event.start,
          stop: event.stop,
        };
      })
      .filter((incident) => isNearBorder(incident.lat, incident.lng));

    return NextResponse.json(incidents);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
