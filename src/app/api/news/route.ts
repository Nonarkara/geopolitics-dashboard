
import { NextResponse } from "next/server";
import type { NewsResponse } from "../../../types/dashboard";
import { buildNewsFromPackages } from "../../../lib/intelligence";

export async function GET() {
  try {
    const payload = await buildNewsFromPackages();
    return NextResponse.json(payload, {
      headers: {
        "X-Data-Source": payload.news.length > 0 ? "live" : "unavailable",
      },
    });
  } catch {
    const empty: NewsResponse = {
      news: [],
      generatedAt: new Date().toISOString(),
      errorCode: "LIVE_DATA_UNAVAILABLE",
    };
    return NextResponse.json(empty, {
      headers: { "X-Data-Source": "unavailable" },
    });
  }
}
