export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { detectEscalation } from "../../../../lib/signal-archive";

/**
 * GET /api/research/escalation?region=myanmar-frontier
 *
 * Compares today's signal activity against the 7-day rolling baseline.
 * Flags escalation if count exceeds 2x baseline or severity jumps >0.5 points.
 */
export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");

  if (!region) {
    // Check all three frontiers
    const [myanmar, cambodia, malaysia] = await Promise.all([
      detectEscalation("myanmar-frontier"),
      detectEscalation("cambodia-frontier"),
      detectEscalation("malaysia-frontier"),
    ]);

    return NextResponse.json({
      regions: [myanmar, cambodia, malaysia].filter(Boolean),
      anyEscalated: [myanmar, cambodia, malaysia].some((r) => r?.escalated),
    });
  }

  const result = await detectEscalation(region);
  return NextResponse.json(result ?? { error: "Database not configured" });
}
