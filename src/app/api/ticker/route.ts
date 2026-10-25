
import { NextResponse } from "next/server";
import type { TickerResponse } from "../../../types/dashboard";
import { buildTickerFromPackages } from "../../../lib/intelligence";

export async function GET() {
  try {
    const payload = await buildTickerFromPackages();
    return NextResponse.json(payload, {
      headers: {
        "X-Data-Source": payload.items.length > 0 ? "live" : "unavailable",
      },
    });
  } catch {
    const empty: TickerResponse = {
      items: [],
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(empty, {
      headers: { "X-Data-Source": "unavailable" },
    });
  }
}
