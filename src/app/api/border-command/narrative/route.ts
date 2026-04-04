import { NextRequest } from "next/server.js";
import { generateNarrative } from "../../../../lib/ai-narrative";
import { buildHistoricalNarrativeFromSignals } from "../../../../lib/border-history";
import { getErrorMessage } from "../../../../lib/errors";
import { createRequestId } from "../../../../lib/http";
import {
  noStoreJson,
  playbackErrorResponse,
  resolvePlaybackRequest,
} from "../../../../lib/playback-api";
import { querySignals } from "../../../../lib/signal-archive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const borderCommandNarrativeRouteDeps = {
  generateNarrative,
  querySignals,
};

export async function GET(request: NextRequest) {
  const requestId = createRequestId("narrative");

  try {
    const playback = resolvePlaybackRequest(request.nextUrl.searchParams);

    if (playback.mode === "historical") {
      const result = await borderCommandNarrativeRouteDeps.querySignals({
        from: playback.timeWindow.from,
        to: playback.timeWindow.to,
        limit: 30,
      });

      return noStoreJson(
        buildHistoricalNarrativeFromSignals(playback.timeWindow, result.signals),
        { headers: { "x-request-id": requestId } },
      );
    }

    const result = await borderCommandNarrativeRouteDeps.generateNarrative();

    return noStoreJson({ ...result, mode: "live" as const }, {
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    console.error(
      `[${requestId}] Border command narrative route error:`,
      getErrorMessage(error),
    );

    const response = playbackErrorResponse(error);
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
