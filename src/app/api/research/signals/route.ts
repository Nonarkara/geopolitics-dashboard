export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { querySignals } from "../../../../lib/signal-archive";

/**
 * GET /api/research/signals
 *
 * Query the signal archive for research and trend analysis.
 * Supports filtering by region, signal_type, source_provider, date range, keyword,
 * and full-text search across title, summary, region, and keywords.
 *
 * Query params:
 *   region         - myanmar-frontier | cambodia-frontier | malaysia-frontier | general
 *   type           - news | incident | humanitarian | market | seismic | traffic | disaster | commodity | osint | ...
 *   provider       - gdelt | bbc_rss | usgs | longdo | gdacs | nabc | acled | unhcr | ...
 *   from           - ISO date (e.g. 2025-01-01)
 *   to             - ISO date (e.g. 2025-12-31)
 *   keyword        - keyword to match in extracted keywords array
 *   search         - full-text search query (uses PostgreSQL websearch_to_tsquery)
 *   limit          - max results (default 50, max 200)
 *   offset         - pagination offset
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await querySignals({
    region: searchParams.get("region") ?? undefined,
    signal_type: searchParams.get("type") ?? undefined,
    source_provider: searchParams.get("provider") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    keyword: searchParams.get("keyword") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit: searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    offset: searchParams.has("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined,
  });

  return NextResponse.json({
    signals: result.signals,
    total: result.total,
    query: {
      region: searchParams.get("region"),
      type: searchParams.get("type"),
      provider: searchParams.get("provider"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      keyword: searchParams.get("keyword"),
      search: searchParams.get("search"),
    },
  });
}
