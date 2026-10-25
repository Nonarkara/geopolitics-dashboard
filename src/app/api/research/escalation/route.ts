
import { NextRequest, NextResponse } from "next/server";
import { detectEscalation } from "../../../../lib/signal-archive";
import { researchAnalysisDeps, researchUnavailable } from "../../../../lib/research-analysis";

/**
 * GET /api/research/escalation?region=myanmar-frontier
 *
 * Compares today's signal activity against the 7-day rolling baseline.
 * Flags escalation if count exceeds 2x baseline or severity jumps >0.5 points.
 */
export async function GET(request: NextRequest) {
  if (!researchAnalysisDeps.isDatabaseConfigured()) return researchUnavailable({ regions: [], anyEscalated: null });
  const region = request.nextUrl.searchParams.get("region");

  if (!region) {
    // Check all three frontiers
    const [myanmar, cambodia, malaysia] = await Promise.all([
      detectEscalation("myanmar-frontier"),
      detectEscalation("cambodia-frontier"),
      detectEscalation("malaysia-frontier"),
    ]);
    if ([myanmar, cambodia, malaysia].some(result => result === null)) {
      return researchUnavailable({ regions: [], anyEscalated: null });
    }

    return NextResponse.json({
      regions: [myanmar, cambodia, malaysia].filter(Boolean),
      anyEscalated: [myanmar, cambodia, malaysia].some((r) => r?.escalated),
    });
  }

  const result = await detectEscalation(region);
  return result ? NextResponse.json(result, { headers: { "cache-control": "no-store" } })
    : researchUnavailable({ regions: [], anyEscalated: null });
}
