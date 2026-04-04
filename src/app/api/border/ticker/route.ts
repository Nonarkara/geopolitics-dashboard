import { NextRequest } from "next/server.js";
import { filterTruthfulBorderOsint } from "../../../../lib/border-osint";
import {
  buildSnapshotKey,
  logPlaybackSideEffectFailure,
  noStoreJson,
  PlaybackApiError,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../../lib/playback-api";
import { borderTickerRouteDeps } from "../../../../lib/playback-route-deps";
import type { ArchiveSignal } from "../../../../lib/signal-archive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const playback = resolvePlaybackRequest(request.nextUrl.searchParams);

    if (playback.mode === "historical") {
      return noStoreJson(
        await borderTickerRouteDeps.loadHistoricalBorderTicker(playback.timeWindow),
      );
    }

    const [incidents, indicators, osint] = await Promise.all([
      borderTickerRouteDeps.loadBorderIncidents(),
      borderTickerRouteDeps.loadThailandEconomics(),
      borderTickerRouteDeps.loadBorderOsint(),
    ]);
    const truthfulOsint = filterTruthfulBorderOsint(osint);

    if (
      incidents.length === 0 &&
      indicators.length === 0 &&
      truthfulOsint.signals.length === 0 &&
      truthfulOsint.humanitarian.length === 0
    ) {
      throw new PlaybackApiError(
        "LIVE_DATA_UNAVAILABLE",
        "No live border ticker inputs are available.",
      );
    }

    const ticker = borderTickerRouteDeps.buildBorderTicker(
      incidents,
      indicators,
      truthfulOsint,
    );

    if (ticker.items.length === 0) {
      throw new PlaybackApiError(
        "LIVE_DATA_UNAVAILABLE",
        "No truthful live ticker snapshot is available.",
      );
    }

    const snapshotAt = ticker.generatedAt ?? new Date().toISOString();
    const snapshotKey = buildSnapshotKey(snapshotAt);
    const signals: ArchiveSignal[] = [
      {
        external_id: `ticker-snapshot-${snapshotKey}`,
        signal_type: "market",
        source_provider: "border-ticker-engine",
        title: `Ticker snapshot: ${ticker.items.length} indicators`,
        summary: ticker.items.map((item) => `${item.label}: ${item.value} (${item.delta})`).join(" | "),
        published_at: snapshotAt,
        severity: "stable",
        keywords: ticker.items.map((item) => item.label.toLowerCase().replace(/\W+/g, "-")),
        payload: {
          snapshotKey,
          type: "ticker_snapshot",
          items: ticker.items,
          generatedAt: snapshotAt,
        },
      },
    ];

    void borderTickerRouteDeps.archiveSignalBatch(signals).catch((error) => {
      logPlaybackSideEffectFailure("border/ticker", "archiveSignalBatch", error, {
        mode: "live",
        snapshotAt,
        snapshotKey,
      });
    });

    return noStoreJson(
      { ...ticker, generatedAt: snapshotAt, mode: "live" as const },
    );
  } catch (error) {
    return playbackErrorResponse(error);
  }
}
