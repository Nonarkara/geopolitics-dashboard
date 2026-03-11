import { NextResponse } from "next/server";
import type { AirQualityPoint } from "../../../types/dashboard";

const AIR_QUALITY_LOCATIONS = [
  { label: "Bangkok", lat: 13.7563, lng: 100.5018 },
  { label: "Chiang Mai", lat: 18.7902, lng: 98.9817 },
  { label: "Mae Sot", lat: 16.7161, lng: 98.5678 },
  { label: "Tak", lat: 16.8847, lng: 99.1259 },
  { label: "Mae Hong Son", lat: 19.3013, lng: 97.9654 },
  { label: "Kanchanaburi", lat: 14.0228, lng: 99.5328 },
  { label: "Pattani", lat: 6.8641, lng: 101.2505 },
  { label: "Yala", lat: 6.5411, lng: 101.2804 },
  { label: "Narathiwat", lat: 6.4264, lng: 101.8253 },
  { label: "Yangon", lat: 16.8409, lng: 96.1735 },
  { label: "Myawaddy", lat: 16.6891, lng: 98.5086 },
  { label: "Phnom Penh", lat: 11.5564, lng: 104.9282 },
] as const;

const fallbackAirQuality: AirQualityPoint[] = [
  { label: "Bangkok", lat: 13.7563, lng: 100.5018, aqi: 118, pm25: 42, category: "Unhealthy for Sensitive Groups" },
  { label: "Chiang Mai", lat: 18.7902, lng: 98.9817, aqi: 132, pm25: 51, category: "Unhealthy for Sensitive Groups" },
  { label: "Mae Sot", lat: 16.7161, lng: 98.5678, aqi: 96, pm25: 31, category: "Moderate" },
  { label: "Tak", lat: 16.8847, lng: 99.1259, aqi: 88, pm25: 28, category: "Moderate" },
  { label: "Mae Hong Son", lat: 19.3013, lng: 97.9654, aqi: 109, pm25: 37, category: "Unhealthy for Sensitive Groups" },
  { label: "Kanchanaburi", lat: 14.0228, lng: 99.5328, aqi: 84, pm25: 24, category: "Moderate" },
  { label: "Pattani", lat: 6.8641, lng: 101.2505, aqi: 64, pm25: 17, category: "Moderate" },
  { label: "Yala", lat: 6.5411, lng: 101.2804, aqi: 68, pm25: 19, category: "Moderate" },
  { label: "Narathiwat", lat: 6.4264, lng: 101.8253, aqi: 61, pm25: 15, category: "Moderate" },
  { label: "Yangon", lat: 16.8409, lng: 96.1735, aqi: 92, pm25: 29, category: "Moderate" },
  { label: "Myawaddy", lat: 16.6891, lng: 98.5086, aqi: 101, pm25: 34, category: "Unhealthy for Sensitive Groups" },
  { label: "Phnom Penh", lat: 11.5564, lng: 104.9282, aqi: 74, pm25: 20, category: "Moderate" },
];

function getCategory(aqi: number) {
  if (aqi <= 50) {
    return "Good";
  }

  if (aqi <= 100) {
    return "Moderate";
  }

  if (aqi <= 150) {
    return "Unhealthy for Sensitive Groups";
  }

  if (aqi <= 200) {
    return "Unhealthy";
  }

  if (aqi <= 300) {
    return "Very Unhealthy";
  }

  return "Hazardous";
}

async function fetchPoint(
  label: string,
  lat: number,
  lng: number,
): Promise<AirQualityPoint | null> {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      current?: { us_aqi?: number; pm2_5?: number };
    };
    const aqi = payload.current?.us_aqi;
    const pm25 = payload.current?.pm2_5;

    if (typeof aqi !== "number" || typeof pm25 !== "number") {
      return null;
    }

    return {
      label,
      lat,
      lng,
      aqi,
      pm25,
      category: getCategory(aqi),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      AIR_QUALITY_LOCATIONS.map((point) =>
        fetchPoint(point.label, point.lat, point.lng),
      ),
    );
    const merged = results.map(
      (result, index) => result ?? fallbackAirQuality[index],
    );

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(fallbackAirQuality);
  }
}
