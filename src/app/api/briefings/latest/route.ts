import { NextResponse } from "next/server";
import {
  fallbackBriefing,
  fallbackEconomicIndicators,
  fallbackIncidents,
} from "../../../../lib/mock-data";
import {
  buildThailandBriefing,
  loadThailandEconomics,
  loadThailandIncidents,
} from "../../../../lib/thailand-monitor";

export async function GET() {
  try {
    const [incidents, indicators] = await Promise.all([
      loadThailandIncidents(),
      loadThailandEconomics(),
    ]);

    return NextResponse.json(buildThailandBriefing(incidents, indicators));
  } catch {
    try {
      return NextResponse.json(
        buildThailandBriefing(fallbackIncidents, fallbackEconomicIndicators),
      );
    } catch {
      return NextResponse.json(fallbackBriefing, { status: 200 });
    }
  }
}
