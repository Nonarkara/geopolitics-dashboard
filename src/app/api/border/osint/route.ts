export const runtime = 'edge';

import { NextResponse } from "next/server";
import { loadBorderOsint } from "../../../../lib/border-osint";
import { logFeedHealth } from "../../../../lib/supabase";

export const revalidate = 900;

export async function GET() {
  const t0 = Date.now();
  try {
    const data = await loadBorderOsint();
    void logFeedHealth({ feed_id: "osint", status: "ok", response_time_ms: Date.now() - t0, message: `${data.signals?.length ?? 0} signals` });
    return NextResponse.json(data);
  } catch {
    void logFeedHealth({ feed_id: "osint", status: "error", response_time_ms: Date.now() - t0, message: "load failed" });
    return NextResponse.json({ signals: [], sources: [], humanitarian: [] });
  }
}
