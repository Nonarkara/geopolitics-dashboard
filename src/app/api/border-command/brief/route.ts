import { NextRequest } from "next/server.js";
import { loadBorderCommandBrief } from "../../../../lib/border-command";
import { loadHistoricalBorderCommandBrief } from "../../../../lib/border-history";
import { getErrorMessage } from "../../../../lib/errors";
import { createRequestId } from "../../../../lib/http";
import {
  buildSnapshotKey,
  logPlaybackSideEffectFailure,
  noStoreJson,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../../lib/playback-api";
import { archiveSignalBatch, type ArchiveSignal } from "../../../../lib/signal-archive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const borderCommandBriefRouteDeps = {
  loadBorderCommandBrief,
  loadHistoricalBorderCommandBrief,
  archiveSignalBatch,
};

export async function GET(request: NextRequest) {
  const requestId = createRequestId("brief");

  try {
    const playback = resolvePlaybackRequest(request.nextUrl.searchParams);

    if (playback.mode === "historical") {
      return noStoreJson(
        await borderCommandBriefRouteDeps.loadHistoricalBorderCommandBrief(playback.timeWindow),
        { headers: { "x-request-id": requestId } },
      );
    }

    const brief = await borderCommandBriefRouteDeps.loadBorderCommandBrief();
    const snapshotAt = brief.generatedAt ?? new Date().toISOString();
    const snapshotKey = buildSnapshotKey(snapshotAt);
    const signals: ArchiveSignal[] = [];

    signals.push({
      external_id: `brief-posture-${snapshotKey}`,
      signal_type: "political",
      source_provider: "border-command-engine",
      title: `Border command posture: ${brief.overallPosture} (score ${brief.overallScore})`,
      summary:
        brief.headline ??
        `${brief.areas.length} areas assessed. Posture: ${brief.overallPosture}.`,
      published_at: snapshotAt,
      severity:
        brief.overallPosture === "priority"
          ? "alert"
          : brief.overallPosture === "watch"
            ? "watch"
            : "stable",
      score: brief.overallScore / 100,
      payload: {
        snapshotKey,
        type: "brief_posture",
        overallPosture: brief.overallPosture,
        overallScore: brief.overallScore,
        generatedAt: snapshotAt,
        headline: brief.headline,
        summary: brief.summary,
        overallScoreMethod: brief.overallScoreMethod,
        sources: brief.sources,
      },
    });

    for (const area of brief.areas) {
      signals.push({
        external_id: `brief-area-${area.id}-${snapshotKey}`,
        signal_type: "political",
        source_provider: "border-command-engine",
        title: `${area.label}: ${area.posture} (score ${area.score})`,
        summary: area.summary,
        published_at: snapshotAt,
        region: area.id,
        severity:
          area.posture === "priority"
            ? "alert"
            : area.posture === "watch"
              ? "watch"
              : "stable",
        score: area.score / 100,
        keywords: area.watchpoints ?? [],
        payload: {
          snapshotKey,
          type: "area_assessment",
          areaId: area.id,
          posture: area.posture,
          label: area.label,
          counterpart: area.counterpart,
          score: area.score,
          incidentCount: area.incidentCount,
          fatalityCount: area.fatalityCount,
          verifiedCameras: area.verifiedCameras,
          candidateCameras: area.candidateCameras,
          watchpoints: area.watchpoints,
          scoreBreakdown: area.scoreBreakdown,
          summary: area.summary,
          recommendedAction: area.recommendedAction,
          signals: area.signals,
        },
      });
    }

    for (const concern of brief.topConcerns.slice(0, 5)) {
      signals.push({
        external_id: `brief-concern-${concern.id}-${snapshotKey}`,
        signal_type: "political",
        source_provider: "border-command-engine",
        title: `Concern: ${concern.label} (${concern.areaLabel})`,
        summary: concern.detail,
        published_at: snapshotAt,
        region: concern.areaId,
        severity: "watch",
        payload: {
          snapshotKey,
          type: "top_concern",
          metric: concern.metric,
          areaId: concern.areaId,
          areaLabel: concern.areaLabel,
          label: concern.label,
          posture: concern.posture,
          detail: concern.detail,
        },
      });
    }

    void borderCommandBriefRouteDeps.archiveSignalBatch(signals).catch((error) => {
      logPlaybackSideEffectFailure("border-command/brief", "archiveSignalBatch", error, {
        mode: "live",
        snapshotAt,
        snapshotKey,
      });
    });

    return noStoreJson(
      {
        ...brief,
        generatedAt: snapshotAt,
        mode: "live" as const,
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    console.error(
      `[${requestId}] Border command brief route error:`,
      getErrorMessage(error),
    );

    const response = playbackErrorResponse(error);
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
