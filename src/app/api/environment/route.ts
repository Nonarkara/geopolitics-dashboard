import { NextResponse } from "next/server";

/**
 * Capital cities for SE Asian countries.
 * Open-Meteo API is completely free — no API key needed.
 */
const SE_ASIAN_CAPITALS: {
  country: string;
  code: string;
  lat: number;
  lon: number;
}[] = [
  { country: "Thailand", code: "THA", lat: 13.75, lon: 100.52 },
  { country: "Myanmar", code: "MMR", lat: 16.87, lon: 96.20 },
  { country: "Laos", code: "LAO", lat: 17.97, lon: 102.63 },
  { country: "Vietnam", code: "VNM", lat: 21.03, lon: 105.85 },
  { country: "Cambodia", code: "KHM", lat: 11.56, lon: 104.92 },
  { country: "Malaysia", code: "MYS", lat: 3.14, lon: 101.69 },
  { country: "Singapore", code: "SGP", lat: 1.29, lon: 103.85 },
  { country: "Philippines", code: "PHL", lat: 14.60, lon: 120.98 },
  { country: "Indonesia", code: "IDN", lat: -6.21, lon: 106.85 },
];

interface EnvironmentData {
  code: string;
  country: string;
  temperature: number | null;
  aqi: number | null;
}

const fallbackData: EnvironmentData[] = [
  { code: "THA", country: "Thailand", temperature: 33, aqi: 120 },
  { code: "MMR", country: "Myanmar", temperature: 31, aqi: 95 },
  { code: "LAO", country: "Laos", temperature: 30, aqi: 80 },
  { code: "VNM", country: "Vietnam", temperature: 28, aqi: 110 },
  { code: "KHM", country: "Cambodia", temperature: 34, aqi: 90 },
  { code: "MYS", country: "Malaysia", temperature: 31, aqi: 65 },
  { code: "SGP", country: "Singapore", temperature: 30, aqi: 55 },
  { code: "PHL", country: "Philippines", temperature: 32, aqi: 70 },
  { code: "IDN", country: "Indonesia", temperature: 29, aqi: 85 },
];

async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ temperature: number | null }> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { temperature: null };
    const data = (await res.json()) as {
      current_weather?: { temperature?: number };
    };
    return { temperature: data.current_weather?.temperature ?? null };
  } catch {
    return { temperature: null };
  }
}

async function fetchAQI(
  lat: number,
  lon: number,
): Promise<{ aqi: number | null }> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { aqi: null };
    const data = (await res.json()) as {
      current?: { us_aqi?: number };
    };
    return { aqi: data.current?.us_aqi ?? null };
  } catch {
    return { aqi: null };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      SE_ASIAN_CAPITALS.map(async (city) => {
        const [weather, airQuality] = await Promise.all([
          fetchWeather(city.lat, city.lon),
          fetchAQI(city.lat, city.lon),
        ]);

        return {
          code: city.code,
          country: city.country,
          temperature: weather.temperature,
          aqi: airQuality.aqi,
        };
      }),
    );

    // Use fallback values where API returned null
    const merged = results.map((result, i) => ({
      ...result,
      temperature: result.temperature ?? fallbackData[i]?.temperature ?? null,
      aqi: result.aqi ?? fallbackData[i]?.aqi ?? null,
    }));

    return NextResponse.json(merged);
  } catch (error: unknown) {
    console.error(
      "Environment data error:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(fallbackData);
  }
}
