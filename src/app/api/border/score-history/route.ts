import { NextResponse } from "next/server";
import type { BorderAreaId } from "../../../../lib/border-regions";

export const dynamic = "force-static";

/**
 * GET /api/border/score-history
 *
 * Returns historical escalation scores per theater for the past 30 days.
 * Used by TheaterEscalationGauge sparklines.
 */

const BASE_SCORES: Record<BorderAreaId, number> = {
  "myanmar-frontier": 58,
  "cambodia-frontier": 34,
  "deep-south": 52,
  "malaysia-frontier": 38,
};

export async function GET() {
  // Generate synthetic history based on base scores with realistic variance
  const theaters: Record<string, Array<{ timestamp: string; score: number }>> = {};

  for (const [theaterId, baseScore] of Object.entries(BASE_SCORES)) {
    const history = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Add realistic variance — more volatile for active conflict zones
      const volatility = theaterId === "myanmar-frontier" ? 12 : theaterId === "deep-south" ? 8 : 5;
      const variation =
        Math.sin(i * 0.3) * volatility +
        Math.cos(i * 0.7) * (volatility * 0.5);
      const score = Math.min(96, Math.max(10, Math.round(baseScore + variation)));

      history.push({
        timestamp: date.toISOString(),
        score,
      });
    }

    theaters[theaterId] = history;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    theaters,
  });
}
