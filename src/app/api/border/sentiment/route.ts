import { NextRequest, NextResponse } from "next/server";
import { BORDER_AREAS, type BorderAreaId } from "../../../../lib/border-regions";

export const dynamic = "force-static";

/**
 * GET /api/border/sentiment?theater=myanmar-frontier
 *
 * Returns a 14-day GDELT tone timeline for a specific theater zone.
 *
 * Fails closed: when GDELT is unreachable the route returns an empty timeline
 * and `X-Data-Source: unavailable`, matching every sibling route under
 * `/api/*`. The synthetic timeline below is `Math.sin`/`Math.random` output —
 * it is legitimate ONLY in the static GitHub Pages demo
 * (`NEXT_PUBLIC_STATIC_EXPORT=true`), per the data honesty invariant in
 * `context.md`. Serving it in production drew a fabricated sentiment curve
 * that was pixel-identical to a real one.
 */

const GDELT_TONE_API = "https://api.gdeltproject.org/api/v2/doc/doc";

function buildGdeltQuery(theaterId: BorderAreaId): string {
  const area = BORDER_AREAS.find((a) => a.id === theaterId);
  if (!area) return "Thailand border";

  const queryTerms = area.aliases.slice(0, 5).join(" OR ");
  return `(${queryTerms}) AND (Thailand OR border OR conflict OR security)`;
}

interface GdeltTimelinePoint {
  date: string;
  toneneg: number;
  tonepos: number;
  tone: number;
  numarts: number;
}

export async function GET(request: NextRequest) {
  const theaterId = (request.nextUrl.searchParams.get("theater") ?? "myanmar-frontier") as BorderAreaId;

  if (!BORDER_AREAS.find((a) => a.id === theaterId)) {
    return unavailable();
  }

  // In static export, skip the GDELT fetch — the demo is the one place a
  // synthetic timeline may render.
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json(
      {
        timeline: generateFallbackTimeline(theaterId),
        source: "static-demo",
      },
      { headers: { "X-Data-Source": "static-demo" } },
    );
  }

  try {
    const query = buildGdeltQuery(theaterId);
    const url = new URL(GDELT_TONE_API);
    url.searchParams.set("query", query);
    url.searchParams.set("mode", "TimelineTone");
    url.searchParams.set("timespan", "14d");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return unavailable();
    }

    const data = await response.json();
    const timeline = parseGdeltTimeline(data);

    if (timeline.length === 0) {
      return unavailable();
    }

    return NextResponse.json(
      { timeline, source: "gdelt" },
      { headers: { "X-Data-Source": "live", "X-Data-Tier": "gdelt" } },
    );
  } catch {
    return unavailable();
  }
}

/** No live GDELT tone. Return nothing rather than inventing a curve. */
function unavailable() {
  return NextResponse.json(
    { timeline: [], source: "unavailable" },
    { headers: { "X-Data-Source": "unavailable", "X-Data-Tier": "gdelt" } },
  );
}

function parseGdeltTimeline(
  data: { timeline?: Array<{ data?: GdeltTimelinePoint[] }> } | null,
) {
  if (!data?.timeline?.[0]?.data) return [];

  return data.timeline[0].data.map((point) => ({
    date: point.date,
    tone: point.tone ?? 0,
    articleCount: point.numarts ?? 0,
  }));
}

function generateFallbackTimeline(theaterId: BorderAreaId) {
  const baseMap: Record<BorderAreaId, number> = {
    "myanmar-frontier": -2.5,
    "cambodia-frontier": -0.8,
    "deep-south": -1.8,
    "malaysia-frontier": 0.5,
  };

  const base = baseMap[theaterId] ?? -1;
  const timeline = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variation = (Math.sin(i * 0.7) + Math.cos(i * 1.3)) * 1.2;

    timeline.push({
      date: date.toISOString().slice(0, 10),
      tone: Math.round((base + variation) * 100) / 100,
      articleCount: Math.floor(Math.random() * 20 + 5),
    });
  }

  return timeline;
}
