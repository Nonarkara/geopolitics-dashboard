import { NextResponse } from "next/server";

export const revalidate = 1800;

export interface RiverDischarge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentDischarge: number;
  forecastPeak: number;
  forecastPeakDate: string;
  trend: "rising" | "falling" | "stable";
  riskLevel: "low" | "moderate" | "high" | "critical";
}

const BORDER_RIVERS = [
  { id: "moei", name: "Moei River (Mae Sot)", lat: 16.71, lng: 98.57 },
  { id: "mekong-chiangsaen", name: "Mekong (Chiang Saen)", lat: 20.27, lng: 100.09 },
  { id: "mekong-nongkhai", name: "Mekong (Nong Khai)", lat: 17.87, lng: 102.74 },
  { id: "mekong-mukdahan", name: "Mekong (Mukdahan)", lat: 16.54, lng: 104.73 },
  { id: "kolok", name: "Kolok River (Narathiwat)", lat: 6.03, lng: 101.97 },
  { id: "sai-burin", name: "Sai Buri River", lat: 6.63, lng: 101.62 },
];

interface OpenMeteoFloodResponse {
  daily?: {
    time?: string[];
    river_discharge?: number[];
  };
}

function classifyRisk(current: number, peak: number): RiverDischarge["riskLevel"] {
  if (peak > 5000 || current > 4000) return "critical";
  if (peak > 2000 || current > 1500) return "high";
  if (peak > 500 || current > 300) return "moderate";
  return "low";
}

function classifyTrend(current: number, peak: number, peakIdx: number, totalDays: number): RiverDischarge["trend"] {
  if (peakIdx > totalDays * 0.6 && peak > current * 1.2) return "rising";
  if (peakIdx < totalDays * 0.3 && current < peak * 0.8) return "falling";
  return "stable";
}

async function fetchRiverDischarge(river: typeof BORDER_RIVERS[number]): Promise<RiverDischarge> {
  const fallback: RiverDischarge = {
    ...river,
    currentDischarge: 0,
    forecastPeak: 0,
    forecastPeakDate: "",
    trend: "stable",
    riskLevel: "low",
  };

  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${river.lat}&longitude=${river.lng}&daily=river_discharge&past_days=7&forecast_days=7`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return fallback;

    const json: OpenMeteoFloodResponse = await res.json();
    const times = json.daily?.time ?? [];
    const discharges = json.daily?.river_discharge ?? [];

    if (discharges.length === 0) return fallback;

    const current = discharges[discharges.length - 1] ?? 0;
    let peakVal = 0;
    let peakIdx = 0;
    for (let i = 0; i < discharges.length; i++) {
      if ((discharges[i] ?? 0) > peakVal) {
        peakVal = discharges[i] ?? 0;
        peakIdx = i;
      }
    }

    return {
      ...river,
      currentDischarge: Math.round(current * 10) / 10,
      forecastPeak: Math.round(peakVal * 10) / 10,
      forecastPeakDate: times[peakIdx] ?? "",
      trend: classifyTrend(current, peakVal, peakIdx, discharges.length),
      riskLevel: classifyRisk(current, peakVal),
    };
  } catch {
    return fallback;
  }
}

export async function GET() {
  const results = await Promise.all(BORDER_RIVERS.map(fetchRiverDischarge));
  return NextResponse.json(results);
}
