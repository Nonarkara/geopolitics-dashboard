
import { NextResponse } from "next/server";
import { buildLatestBriefing } from "../../../../lib/intelligence";

export async function GET() {
  try {
    return NextResponse.json(await buildLatestBriefing(), {
      headers: { "X-Data-Source": "live" },
    });
  } catch {
    // No fabricated briefing: fail closed and let the panel show its honest
    // empty state.
    return NextResponse.json(
      { errorCode: "LIVE_DATA_UNAVAILABLE" },
      { status: 503, headers: { "X-Data-Source": "unavailable" } },
    );
  }
}
