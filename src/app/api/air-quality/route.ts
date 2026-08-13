
import { NextResponse } from "next/server";
import type { AirQualityPoint } from "../../../types/dashboard";
import { archiveSignalBatch, type ArchiveSignal } from "../../../lib/signal-archive";

const AIR_QUALITY_LOCATIONS = [
  { label: "Phuket Town", lat: 7.8804, lng: 98.3923, tz: "Asia/Bangkok" },
  { label: "Patong", lat: 7.8964, lng: 98.2965, tz: "Asia/Bangkok" },
  { label: "Bangkok", lat: 13.7563, lng: 100.5018, tz: "Asia/Bangkok" },
  { label: "Jakarta", lat: -6.2088, lng: 106.8456, tz: "Asia/Jakarta" },
  { label: "Singapore", lat: 1.3521, lng: 103.8198, tz: "Asia/Singapore" },
  { label: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, tz: "Asia/Kuala_Lumpur" },
  { label: "Manila", lat: 14.5995, lng: 120.9842, tz: "Asia/Manila" },
  { label: "Hanoi", lat: 21.0285, lng: 105.8542, tz: "Asia/Ho_Chi_Minh" },
  { label: "Phnom Penh", lat: 11.5564, lng: 104.9282, tz: "Asia/Phnom_Penh" },
  { label: "Vientiane", lat: 17.9757, lng: 102.6331, tz: "Asia/Vientiane" },
  { label: "Naypyidaw", lat: 19.7633, lng: 96.0785, tz: "Asia/Yangon" },
  { label: "BSB (Brunei)", lat: 4.8902, lng: 114.9404, tz: "Asia/Brunei" },
  { label: "Beijing", lat: 39.9042, lng: 116.4074, tz: "Asia/Shanghai" },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503, tz: "Asia/Tokyo" },
  { label: "Seoul", lat: 37.5665, lng: 126.9780, tz: "Asia/Seoul" },
  { label: "Taipei", lat: 25.0334, lng: 121.5654, tz: "Asia/Taipei" },
  { label: "Washington D.C.", lat: 38.9072, lng: -77.0369, tz: "America/New_York" },
] as const;

export interface GlobalAirQualityPoint extends AirQualityPoint {
  temp?: number;
  condition?: string;
  tz: string;
}

type CurrentBlock = {
  us_aqi?: number;
  pm2_5?: number;
  temperature_2m?: number;
  weather_code?: number;
};

type OpenMeteoCurrent = {
  current?: CurrentBlock;
};

function getCategory(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getWeatherCondition(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Storm";
  return "Unknown";
}

function asRows(payload: unknown): OpenMeteoCurrent[] {
  if (Array.isArray(payload)) return payload as OpenMeteoCurrent[];
  if (payload && typeof payload === "object") return [payload as OpenMeteoCurrent];
  return [];
}

export async function GET() {
  const latitudes = AIR_QUALITY_LOCATIONS.map((point) => point.lat).join(",");
  const longitudes = AIR_QUALITY_LOCATIONS.map((point) => point.lng).join(",");
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}` +
    `&longitude=${longitudes}&current=us_aqi,pm2_5`;
  const wUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}` +
    `&longitude=${longitudes}&current=temperature_2m,weather_code`;

  try {
    const [aqPayload, weatherPayload] = await Promise.all([
      fetch(aqUrl, { next: { revalidate: 900 } }).then((res) => {
        if (!res.ok) throw new Error(`air ${res.status}`);
        return res.json() as Promise<unknown>;
      }),
      fetch(wUrl, { next: { revalidate: 900 } })
        .then((res) => (res.ok ? (res.json() as Promise<unknown>) : null))
        .catch(() => null),
    ]);

    const aqRows = asRows(aqPayload);
    const weatherRows = weatherPayload ? asRows(weatherPayload) : [];
    const live: GlobalAirQualityPoint[] = [];

    for (let index = 0; index < AIR_QUALITY_LOCATIONS.length; index++) {
      const site = AIR_QUALITY_LOCATIONS[index];
      const aqi = aqRows[index]?.current?.us_aqi;
      const pm25 = aqRows[index]?.current?.pm2_5;
      if (typeof aqi !== "number" || typeof pm25 !== "number") continue;
      const weather = weatherRows[index]?.current;
      const code = weather?.weather_code;
      live.push({
        label: site.label,
        lat: site.lat,
        lng: site.lng,
        aqi,
        pm25,
        category: getCategory(aqi),
        temp: typeof weather?.temperature_2m === "number"
          ? Math.round(weather.temperature_2m)
          : undefined,
        condition: typeof code === "number" ? getWeatherCondition(code) : undefined,
        observedAt: new Date().toISOString(),
        source: "Open-Meteo CAMS",
        tz: site.tz,
      });
    }

    if (live.length > 0) {
      const signals: ArchiveSignal[] = live.map((point): ArchiveSignal => ({
        external_id: `aqi-${point.label.toLowerCase().replace(/\W+/g, "-")}-${new Date().toISOString().slice(0, 13)}`,
        signal_type: "weather",
        source_provider: "Open-Meteo",
        source_url: "https://open-meteo.com",
        title: `AQI ${point.label}: ${point.aqi} (${point.category})`,
        summary: `PM2.5: ${point.pm25 ?? "?"} µg/m³${point.temp !== undefined ? `, ${point.temp}°C` : ""}${point.condition ? `, ${point.condition}` : ""}`,
        published_at: point.observedAt ?? new Date().toISOString(),
        severity: point.aqi > 150 ? "alert" : point.aqi > 100 ? "watch" : "stable",
        score: Math.min(point.aqi / 300, 1),
        lat: point.lat,
        lng: point.lng,
        keywords: ["aqi", "pm25", "air-quality", point.label.toLowerCase().replace(/\W+/g, "-")],
        payload: {
          type: "air_quality_reading",
          aqi: point.aqi,
          pm25: point.pm25,
          category: point.category,
          temp: point.temp,
          condition: point.condition,
          tz: point.tz,
        },
      }));
      void archiveSignalBatch(signals);
    }

    return NextResponse.json(live, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        "X-Data-Source": live.length > 0 ? "live" : "unavailable",
      },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "X-Data-Source": "unavailable" },
    });
  }
}
