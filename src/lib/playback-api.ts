import { NextResponse } from "next/server.js";
import { getErrorMessage } from "./errors";
import {
  parseDashboardTimeWindow,
  type DashboardTimeWindow,
} from "./time-window";

export type PlaybackApiErrorCode =
  | "INVALID_PLAYBACK_WINDOW"
  | "INVALID_SPARKLINE_DAYS"
  | "UNSUPPORTED_SPARKLINE_METRIC"
  | "ARCHIVE_UNAVAILABLE"
  | "LIVE_DATA_UNAVAILABLE";

export interface PlaybackApiErrorEnvelope {
  error: {
    code: PlaybackApiErrorCode;
    message: string;
  };
}

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function statusForCode(code: PlaybackApiErrorCode) {
  switch (code) {
    case "INVALID_PLAYBACK_WINDOW":
    case "INVALID_SPARKLINE_DAYS":
    case "UNSUPPORTED_SPARKLINE_METRIC":
      return 400;
    case "ARCHIVE_UNAVAILABLE":
    case "LIVE_DATA_UNAVAILABLE":
      return 503;
    default:
      return 500;
  }
}

export class PlaybackApiError extends Error {
  readonly code: PlaybackApiErrorCode;
  readonly status: number;

  constructor(code: PlaybackApiErrorCode, message: string) {
    super(message);
    this.name = "PlaybackApiError";
    this.code = code;
    this.status = statusForCode(code);
  }
}

export function buildSnapshotKey(timestamp: string) {
  return timestamp.replace(/[:.]/g, "-");
}

export function noStoreJson<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);

  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(key, value);
  }

  return NextResponse.json(body, { ...init, headers });
}

export function playbackErrorResponse(error: unknown) {
  if (error instanceof PlaybackApiError) {
    return noStoreJson<PlaybackApiErrorEnvelope>(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return noStoreJson<PlaybackApiErrorEnvelope>(
    {
      error: {
        code: "LIVE_DATA_UNAVAILABLE",
        message: "Playback backend failed unexpectedly.",
      },
    },
    { status: 503 },
  );
}

export function resolvePlaybackRequest(searchParams: Pick<URLSearchParams, "get">):
  | { mode: "live" }
  | { mode: "historical"; timeWindow: DashboardTimeWindow } {
  const result = parseDashboardTimeWindow(searchParams);

  if (result.mode === "invalid") {
    throw new PlaybackApiError("INVALID_PLAYBACK_WINDOW", result.reason);
  }

  return result;
}

export function parseSparklineDays(value: string | null, defaultDays = 30) {
  if (value === null) {
    return defaultDays;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 90) {
    throw new PlaybackApiError(
      "INVALID_SPARKLINE_DAYS",
      "Sparkline days must be an integer between 1 and 90.",
    );
  }

  return parsed;
}

export type SparklineMetric =
  | { family: "score"; region: string }
  | { family: "aqi"; location: string }
  | { family: "signals"; region: string }
  | { family: "market"; indicator: string };

const SAFE_METRIC_VALUE = /^[^:\u0000-\u001f]{1,80}$/u;
const SAFE_REGION = /^[a-z0-9-]{1,64}$/;

export function parseSparklineMetric(metric: string | null): SparklineMetric {
  const trimmed = metric?.trim() ?? "";

  if (!trimmed) {
    throw new PlaybackApiError(
      "UNSUPPORTED_SPARKLINE_METRIC",
      "Sparkline metric is required.",
    );
  }

  if (trimmed.startsWith("score:")) {
    const region = trimmed.slice("score:".length).trim();

    if (!SAFE_REGION.test(region)) {
      throw new PlaybackApiError(
        "UNSUPPORTED_SPARKLINE_METRIC",
        "Score sparklines require a valid region id.",
      );
    }

    return { family: "score", region };
  }

  if (trimmed.startsWith("signals:")) {
    const region = trimmed.slice("signals:".length).trim();

    if (!SAFE_REGION.test(region)) {
      throw new PlaybackApiError(
        "UNSUPPORTED_SPARKLINE_METRIC",
        "Signal sparklines require a valid region id.",
      );
    }

    return { family: "signals", region };
  }

  if (trimmed.startsWith("aqi:")) {
    const location = trimmed.slice("aqi:".length).trim();

    if (!SAFE_METRIC_VALUE.test(location)) {
      throw new PlaybackApiError(
        "UNSUPPORTED_SPARKLINE_METRIC",
        "AQI sparklines require a valid location label.",
      );
    }

    return { family: "aqi", location };
  }

  if (trimmed.includes(":")) {
    throw new PlaybackApiError(
      "UNSUPPORTED_SPARKLINE_METRIC",
      `Unsupported sparkline metric family: ${trimmed.split(":", 1)[0]}`,
    );
  }

  if (!SAFE_METRIC_VALUE.test(trimmed)) {
    throw new PlaybackApiError(
      "UNSUPPORTED_SPARKLINE_METRIC",
      "Market sparklines require a valid indicator label.",
    );
  }

  return { family: "market", indicator: trimmed };
}

export function logPlaybackSideEffectFailure(
  routeId: string,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  console.error(`[${routeId}] ${operation} failed: ${getErrorMessage(error)}`, context ?? {});
}
