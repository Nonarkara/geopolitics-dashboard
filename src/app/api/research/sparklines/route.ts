import { NextRequest } from "next/server.js";
import { createRequestId } from "../../../../lib/http";
import {
  noStoreJson,
  PlaybackApiError,
  parseSparklineDays,
  parseSparklineMetric,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../../lib/playback-api";
import { sparklineRouteDeps } from "../../../../lib/playback-route-deps";
import {
  getBangkokDayKey,
  getLookbackWindowEnd,
  getLookbackWindowStart,
} from "../../../../lib/time-window";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/research/sparklines
 *
 * Returns historical values for sparkline micro-charts.
 *
 * Query params:
 *   metric   - "USD/THB", "BTC/USD", "MYR/THB", "SGD/THB" (market_data)
 *            - "score:myanmar-frontier", "score:cambodia-frontier" (signal_archive political)
 *            - "aqi:Bangkok", "aqi:Phuket Town" (air_quality_snapshots)
 *            - "signals:myanmar-frontier" (daily signal counts)
 *   days     - lookback window (default 30, max 90)
 */
export async function GET(request: NextRequest) {
  const requestId = createRequestId("spark");

  let metric = "";
  let days = 30;

  try {
    const { searchParams } = request.nextUrl;
    const playback = resolvePlaybackRequest(searchParams);
    const timeWindow =
      playback.mode === "historical" ? playback.timeWindow : null;
    const metricDescriptor = parseSparklineMetric(searchParams.get("metric"));

    metric =
      metricDescriptor.family === "market"
        ? metricDescriptor.indicator
        : metricDescriptor.family === "aqi"
          ? `aqi:${metricDescriptor.location}`
          : `${metricDescriptor.family}:${metricDescriptor.region}`;
    days = parseSparklineDays(searchParams.get("days"));

    if (!sparklineRouteDeps.isDatabaseConfigured()) {
      if (playback.mode === "live") {
        return noStoreJson(
          { values: [], metric, days, mode: "unavailable" as const },
          {
            headers: {
              "x-request-id": requestId,
              "x-data-source": "unavailable",
            },
          },
        );
      }

      throw new PlaybackApiError(
        "ARCHIVE_UNAVAILABLE",
        "Sparkline storage is not configured for playback queries.",
      );
    }

    const windowEnd = getLookbackWindowEnd(timeWindow);
    const windowStart = getLookbackWindowStart(timeWindow, days);
    const endDay =
      getBangkokDayKey(windowEnd) ??
      new Date(windowEnd).toISOString().slice(0, 10);
    const startDay =
      getBangkokDayKey(windowStart) ??
      new Date(windowStart).toISOString().slice(0, 10);

    let values: number[] = [];

    if (metricDescriptor.family === "score") {
      const result = await sparklineRouteDeps.query<{ score: number }>(
        `SELECT COALESCE((payload->>'score')::float, score * 100) AS score
         FROM signal_archive
         WHERE signal_type = 'political'
           AND source_provider = 'border-command-engine'
           AND region = $1
           AND published_at >= $2
           AND published_at <= $3
         ORDER BY published_at ASC
         LIMIT $4`,
        [metricDescriptor.region, windowStart, windowEnd, days],
      );
      values = result.rows.map((r) => r.score);
    } else if (metricDescriptor.family === "aqi") {
      const result = await sparklineRouteDeps.query<{ aqi: number }>(
        `SELECT aqi FROM air_quality_snapshots
         WHERE location = $1
           AND observed_at >= $2
           AND observed_at <= $3
         ORDER BY observed_at ASC`,
        [metricDescriptor.location, windowStart, windowEnd],
      );
      values = result.rows.map((r) => r.aqi);
    } else if (metricDescriptor.family === "signals") {
      const result = await sparklineRouteDeps.query<{ cnt: number }>(
        `SELECT signal_count AS cnt FROM signal_daily_summary
         WHERE region = $1
           AND summary_date >= $2::date
           AND summary_date <= $3::date
         ORDER BY summary_date ASC`,
        [metricDescriptor.region, startDay, endDay],
      );
      values = result.rows.map((r) => r.cnt);
    } else {
      const result = await sparklineRouteDeps.query<{ value: number }>(
        `SELECT value FROM market_data
         WHERE indicator = $1
           AND created_at <= $2
         ORDER BY ref_date DESC, created_at DESC
         LIMIT $3`,
        [metricDescriptor.indicator, windowEnd, days],
      );
      values = result.rows.map((r) => r.value).reverse(); // oldest first for sparkline
    }

    return noStoreJson(
      { values, metric, days },
      {
        headers: {
          "x-request-id": requestId,
        },
      },
    );
  } catch (error) {
    const response = playbackErrorResponse(
      error instanceof PlaybackApiError
        ? error
        : new PlaybackApiError(
            "ARCHIVE_UNAVAILABLE",
            error instanceof Error
              ? `Sparkline query failed: ${error.message}`
              : "Sparkline query failed.",
          ),
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
