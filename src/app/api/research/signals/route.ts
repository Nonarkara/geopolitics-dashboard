import { NextRequest, NextResponse } from "next/server.js";
import { getErrorMessage } from "../../../../lib/errors";
import { createRequestId, parseIntegerParam } from "../../../../lib/http";
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
  const requestId = createRequestId("signals");
  const { searchParams } = request.nextUrl;
  const limit = parseIntegerParam(searchParams.get("limit"), {
    defaultValue: 50,
    min: 1,
    max: 200,
  });
  const offset = parseIntegerParam(searchParams.get("offset"), {
    defaultValue: 0,
    min: 0,
    max: 10_000,
  });

  try {
    const result = await querySignals({
      region: searchParams.get("region") ?? undefined,
      signal_type: searchParams.get("type") ?? undefined,
      source_provider: searchParams.get("provider") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      keyword: searchParams.get("keyword") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      {
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
          limit,
          offset,
        },
      },
      {
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  } catch (error: unknown) {
    console.error(
      `[${requestId}] Research signals route error:`,
      getErrorMessage(error),
    );

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }
}
