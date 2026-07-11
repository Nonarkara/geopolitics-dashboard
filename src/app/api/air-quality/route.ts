
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
  { label: "Taipei", lat: 25.0330, lng: 121.5654, tz: "Asia/Taipei" },
  { label: "Washington D.C.", lat: 38.9072, lng: -77.0369, tz: "America/New_York" },
] as const;

export interface GlobalAirQualityPoint extends AirQualityPoint {
  temp?: number;
  condition?: string;
  tz: string;
}

const fallbackAirQuality: GlobalAirQualityPoint[] = [
  { label: "Phuket Town", lat: 7.8804, lng: 98.3923, aqi: 44, pm25: 9, category: "Good", temp: 31, condition: "Clear", tz: "Asia/Bangkok" },
  { label: "Patong", lat: 7.8964, lng: 98.2965, aqi: 41, pm25: 8, category: "Good", temp: 31, condition: "Clear", tz: "Asia/Bangkok" },
  { label: "Bangkok", lat: 13.7563, lng: 100.5018, aqi: 92, pm25: 27, category: "Moderate", temp: 34, condition: "Haze", tz: "Asia/Bangkok" },
  { label: "Jakarta", lat: -6.2088, lng: 106.8456, aqi: 115, pm25: 41, category: "Unhealthy for Sensitive Groups", temp: 32, condition: "Cloudy", tz: "Asia/Jakarta" },
  { label: "Singapore", lat: 1.3521, lng: 103.8198, aqi: 58, pm25: 13, category: "Moderate", temp: 30, condition: "Rain", tz: "Asia/Singapore" },
  { label: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, aqi: 62, pm25: 16, category: "Moderate", temp: 31, condition: "Cloudy", tz: "Asia/Kuala_Lumpur" },
  { label: "Manila", lat: 14.5995, lng: 120.9842, aqi: 75, pm25: 23, category: "Moderate", temp: 32, condition: "Clear", tz: "Asia/Manila" },
  { label: "Hanoi", lat: 21.0285, lng: 105.8542, aqi: 155, pm25: 64, category: "Unhealthy", temp: 24, condition: "Fog", tz: "Asia/Ho_Chi_Minh" },
  { label: "Phnom Penh", lat: 11.5564, lng: 104.9282, aqi: 82, pm25: 26, category: "Moderate", temp: 33, condition: "Haze", tz: "Asia/Phnom_Penh" },
  { label: "Vientiane", lat: 17.9757, lng: 102.6331, aqi: 105, pm25: 37, category: "Unhealthy for Sensitive Groups", temp: 32, condition: "Clear", tz: "Asia/Vientiane" },
  { label: "Naypyidaw", lat: 19.7633, lng: 96.0785, aqi: 68, pm25: 19, category: "Moderate", temp: 31, condition: "Cloudy", tz: "Asia/Yangon" },
  { label: "BSB (Brunei)", lat: 4.8902, lng: 114.9404, aqi: 32, pm25: 6, category: "Good", temp: 29, condition: "Rain", tz: "Asia/Brunei" },
  { label: "Beijing", lat: 39.9042, lng: 116.4074, aqi: 120, pm25: 45, category: "Unhealthy for Sensitive Groups", temp: 12, condition: "Haze", tz: "Asia/Shanghai" },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503, aqi: 45, pm25: 9, category: "Good", temp: 15, condition: "Clear", tz: "Asia/Tokyo" },
  { label: "Seoul", lat: 37.5665, lng: 126.9780, aqi: 88, pm25: 29, category: "Moderate", temp: 13, condition: "Cloudy", tz: "Asia/Seoul" },
  { label: "Taipei", lat: 25.0330, lng: 121.5654, aqi: 52, pm25: 12, category: "Moderate", temp: 22, condition: "Clear", tz: "Asia/Taipei" },
  { label: "Washington D.C.", lat: 38.9072, lng: -77.0369, aqi: 35, pm25: 7, category: "Good", temp: 8, condition: "Cloudy", tz: "America/New_York" },
];

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

async function fetchPoint(
  label: string,
  lat: number,
  lng: number,
  tz: string
): Promise<GlobalAirQualityPoint | null> {
  try {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`;
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`;
    
    const [aqResp, wResp] = await Promise.all([
      fetch(aqUrl, { signal: AbortSignal.timeout(4000) }).then(res => res.json()),
      fetch(wUrl, { signal: AbortSignal.timeout(4000) }).then(res => res.json())
    ]);

    const aqi = aqResp.current?.us_aqi;
    const pm25 = aqResp.current?.pm2_5;
    const temp = wResp.current?.temperature_2m;
    const code = wResp.current?.weather_code;

    if (typeof aqi !== "number") return null;

    return {
      label, lat, lng, aqi, pm25, tz,
      category: getCategory(aqi),
      temp: typeof temp === "number" ? Math.round(temp) : undefined,
      condition: typeof code === "number" ? getWeatherCondition(code) : undefined,
      observedAt: new Date().toISOString(),
      source: "Open-Meteo Precision Core",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      AIR_QUALITY_LOCATIONS.map((point) =>
        fetchPoint(point.label, point.lat, point.lng, point.tz)
      )
    );
    const merged = results.map((result, index) => result ?? fallbackAirQuality[index]);

    // Archive AQI readings — environmental data is critical for longitudinal
    // analysis of air quality trends, haze events, and cross-border pollution.
    try {
      const liveResults = results.filter((r): r is GlobalAirQualityPoint => r !== null);
      if (liveResults.length > 0) {
        const signals: ArchiveSignal[] = liveResults.map((point): ArchiveSignal => ({
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
    } catch {
      // Non-critical
    }

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(fallbackAirQuality);
  }
}
