import { NextRequest } from "next/server.js";
import { filterTruthfulBorderOsint } from "../../../../lib/border-osint";
import { createRequestId } from "../../../../lib/http";
import {
  buildSnapshotKey,
  logPlaybackSideEffectFailure,
  noStoreJson,
  PlaybackApiError,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../../lib/playback-api";
import { borderNewsRouteDeps } from "../../../../lib/playback-route-deps";
import type { ArchiveSignal } from "../../../../lib/signal-archive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = createRequestId("border-news");
  const t0 = Date.now();

  try {
    const playback = resolvePlaybackRequest(request.nextUrl.searchParams);

    if (playback.mode === "historical") {
      return noStoreJson(
        await borderNewsRouteDeps.loadHistoricalBorderNews(playback.timeWindow),
        { headers: { "x-request-id": requestId } },
      );
    }

    const [incidents, indicators, osint] = await Promise.all([
      borderNewsRouteDeps.loadBorderIncidents(),
      borderNewsRouteDeps.loadThailandEconomics(),
      borderNewsRouteDeps.loadBorderOsint(),
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
        "No live border news inputs are available.",
      );
    }

    const news = borderNewsRouteDeps.buildBorderNews(incidents, indicators, truthfulOsint);

    if (news.news.length === 0) {
      throw new PlaybackApiError(
        "LIVE_DATA_UNAVAILABLE",
        "No truthful live border headlines are available.",
      );
    }

    const snapshotAt = news.generatedAt;
    const snapshotKey = buildSnapshotKey(snapshotAt);

    const upserts = news.news
      .slice(0, 20)
      .filter((item) => item.title && item.sourceUrl)
      .map((item) =>
        borderNewsRouteDeps.upsertNewsItem({
          source: item.source ?? "border-osint",
          title: item.title,
          summary: item.summary ?? null,
          url: item.sourceUrl!,
          published_at: item.publishedAt ?? snapshotAt,
          severity: item.severity ?? null,
          tags: item.tag ? [item.tag] : [],
          payload: {
            snapshotKey,
          },
        }),
      );

    if (upserts.length > 0) {
      void Promise.allSettled(upserts).then((results) => {
        const failures = results.filter((result) => result.status === "rejected");

        if (failures.length > 0) {
          logPlaybackSideEffectFailure(
            "border/news",
            "upsertNewsItem",
            new Error(`${failures.length} news upserts failed.`),
            { mode: "live", snapshotAt, snapshotKey },
          );
        }
      });
    }

    const signals = news.news.slice(0, 20).map(
      (item): ArchiveSignal => ({
        external_id: item.sourceUrl ?? item.id,
        signal_type: "news",
        source_provider: item.source ?? "border-osint",
        source_url: item.sourceUrl,
        title: item.title,
        summary: item.summary,
        url: item.sourceUrl,
        published_at: item.publishedAt ?? snapshotAt,
        severity: item.severity,
        tags: item.tag ? [item.tag] : [],
        payload: {
          snapshotKey,
          type: "border_news_item",
          tag: item.tag ?? "Archive",
          provider: item.provider ?? null,
          id: item.id,
        },
      }),
    );

    void borderNewsRouteDeps.archiveSignalBatch(signals).catch((error) => {
      logPlaybackSideEffectFailure("border/news", "archiveSignalBatch", error, {
        mode: "live",
        snapshotAt,
        snapshotKey,
      });
    });

    void borderNewsRouteDeps.logFeedHealth({
      feed_id: "border-news",
      status: "ok",
      response_time_ms: Date.now() - t0,
      message: null,
    });

    return noStoreJson({ ...news, mode: "live" as const }, {
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    void borderNewsRouteDeps.logFeedHealth({
      feed_id: "border-news",
      status: "error",
      response_time_ms: Date.now() - t0,
      message: error instanceof Error ? error.message : "build failed",
    });

    const response = playbackErrorResponse(error);
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
