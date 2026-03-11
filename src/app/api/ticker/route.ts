import { NextResponse } from "next/server";
import {
  fallbackEconomicIndicators,
  fallbackIncidents,
  fallbackTicker,
} from "../../../lib/mock-data";
import {
  buildThailandTicker,
  loadThailandEconomics,
  loadThailandIncidents,
} from "../../../lib/thailand-monitor";

export async function GET() {
  try {
    const [incidents, indicators] = await Promise.all([
      loadThailandIncidents(),
      loadThailandEconomics(),
    ]);

    return NextResponse.json(buildThailandTicker(incidents, indicators));
  } catch {
    try {
      return NextResponse.json(
        buildThailandTicker(fallbackIncidents, fallbackEconomicIndicators),
      );
    } catch {
      return NextResponse.json(fallbackTicker, { status: 200 });
    }
  }
}
