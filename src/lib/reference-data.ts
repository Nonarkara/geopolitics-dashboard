import type {
  ApiSourceResponse,
  CopernicusPreviewResponse,
  EconomicIndicator,
} from "../types/dashboard";

const DEFAULT_REFERENCE_DASHBOARD_URL =
  "https://dr-non-operating-systems.onrender.com/api/dashboard";
const DEFAULT_FX_RATES_URL = "https://open.er-api.com/v6/latest/USD";
const DEFAULT_BINANCE_TICKER_URL =
  "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT";
const REQUEST_TIMEOUT_MS = 12_000;

interface ReferenceSummary {
  apiCount: number;
  activeCount: number;
  appsWithApis: number;
  liveCount: number;
  medianResponseMs: number;
  fastest?: {
    label: string;
    responseTimeMs: number;
  };
}

interface ReferenceApi {
  label: string;
  url: string;
  kind?: string;
}

interface ReferenceTarget {
  id: string;
  label: string;
  responseTimeMs: number;
  apis: ReferenceApi[];
}

interface ReferenceDashboardPayload {
  generatedAt: string;
  summary: ReferenceSummary;
  targets: ReferenceTarget[];
}

interface FxRatesResponse {
  result: string;
  rates: Record<string, number>;
}

interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Reference request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function isReferenceApi(value: unknown): value is ReferenceApi {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.url === "string" &&
    (typeof value.kind === "undefined" || typeof value.kind === "string")
  );
}

function isReferenceTarget(value: unknown): value is ReferenceTarget {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.responseTimeMs === "number" &&
    Array.isArray(value.apis) &&
    value.apis.every(isReferenceApi)
  );
}

function isReferenceDashboardPayload(
  value: unknown,
): value is ReferenceDashboardPayload {
  return (
    isRecord(value) &&
    typeof value.generatedAt === "string" &&
    isRecord(value.summary) &&
    typeof value.summary.apiCount === "number" &&
    typeof value.summary.activeCount === "number" &&
    typeof value.summary.appsWithApis === "number" &&
    typeof value.summary.liveCount === "number" &&
    typeof value.summary.medianResponseMs === "number" &&
    Array.isArray(value.targets) &&
    value.targets.every(isReferenceTarget)
  );
}

function isBinanceTickerResponse(value: unknown): value is BinanceTickerResponse {
  return (
    isRecord(value) &&
    typeof value.symbol === "string" &&
    typeof value.lastPrice === "string" &&
    typeof value.priceChangePercent === "string"
  );
}

function findTargetApiUrl(
  dashboard: ReferenceDashboardPayload,
  targetId: string,
  label: string,
) {
  return dashboard.targets
    .find((target) => target.id === targetId)
    ?.apis.find((api) => api.label === label)?.url;
}

function findTarget(
  dashboard: ReferenceDashboardPayload,
  targetId: string,
) {
  return dashboard.targets.find((target) => target.id === targetId) ?? null;
}

export async function fetchReferenceDashboard() {
  const dashboardUrl =
    process.env.REFERENCE_DASHBOARD_URL ?? DEFAULT_REFERENCE_DASHBOARD_URL;
  const payload = await fetchJson<unknown>(dashboardUrl);

  if (!isReferenceDashboardPayload(payload)) {
    throw new Error("Reference dashboard payload was not recognized");
  }

  return payload;
}

export async function fetchReferenceEconomicIndicators() {
  const dashboard = await fetchReferenceDashboard();
  const fxUrl =
    findTargetApiUrl(dashboard, "tech-monitor", "FX rates") ??
    DEFAULT_FX_RATES_URL;
  const discoveredTickerUrl =
    findTargetApiUrl(dashboard, "tech-monitor", "Binance ticker") ??
    DEFAULT_BINANCE_TICKER_URL;
  const tickerUrl = discoveredTickerUrl.includes("symbol=")
    ? discoveredTickerUrl
    : `${discoveredTickerUrl}?symbol=BTCUSDT`;

  const [fxPayload, btcPayload] = await Promise.all([
    fetchJson<FxRatesResponse>(fxUrl),
    fetchJson<unknown>(tickerUrl),
  ]);

  if (
    fxPayload.result !== "success" ||
    typeof fxPayload.rates.THB !== "number" ||
    typeof fxPayload.rates.MMK !== "number" ||
    typeof fxPayload.rates.EUR !== "number"
  ) {
    throw new Error("Reference FX payload was incomplete");
  }

  const ticker =
    isBinanceTickerResponse(btcPayload)
      ? btcPayload
      : Array.isArray(btcPayload)
        ? btcPayload.find(
            (value): value is BinanceTickerResponse =>
              isBinanceTickerResponse(value) && value.symbol === "BTCUSDT",
          ) ?? null
        : null;

  if (!ticker) {
    throw new Error("Reference Binance payload was incomplete");
  }

  const btcPrice = Number(ticker.lastPrice);
  const btcChange = Number(ticker.priceChangePercent);

  if (!Number.isFinite(btcPrice) || !Number.isFinite(btcChange)) {
    throw new Error("Reference Binance payload was incomplete");
  }

  const thbPerUsd = fxPayload.rates.THB;
  const mmkPerUsd = fxPayload.rates.MMK;
  const eurPerUsd = fxPayload.rates.EUR;

  return [
    {
      label: "THB/MMK",
      value: Number((mmkPerUsd / thbPerUsd).toFixed(2)),
      change: 0,
      up: true,
      category: "FX",
      source: "dr-non-operating-systems",
    },
    {
      label: "USD/THB",
      value: Number(thbPerUsd.toFixed(2)),
      change: 0,
      up: true,
      category: "FX",
      source: "dr-non-operating-systems",
    },
    {
      label: "EUR/USD",
      value: Number((1 / eurPerUsd).toFixed(2)),
      change: 0,
      up: true,
      category: "FX",
      source: "dr-non-operating-systems",
    },
    {
      label: "BTC/USD",
      value: Number(btcPrice.toFixed(0)),
      change: Number(btcChange.toFixed(2)),
      up: btcChange >= 0,
      category: "Crypto",
      source: "dr-non-operating-systems",
    },
  ] satisfies EconomicIndicator[];
}

export async function fetchReferenceApiCatalog(): Promise<ApiSourceResponse> {
  const dashboard = await fetchReferenceDashboard();
  const sources = [
    "middle-east-monitor",
    "tech-monitor",
  ].flatMap((targetId) => {
    const target = findTarget(dashboard, targetId);

    if (!target) {
      return [];
    }

    return target.apis.map((api, index) => ({
      id: `${target.id}-${index + 1}`,
      label: api.label,
      url: api.url,
      kind: api.kind ?? "internal",
      target: target.label,
    }));
  });

  return {
    generatedAt: dashboard.generatedAt,
    sources,
  };
}

export function buildCopernicusPreview(focusDate: string): CopernicusPreviewResponse {
  return {
    updatedAt: new Date().toISOString(),
    focusDate,
    imagerySources: [
      {
        id: "viirsTrueColor",
        label: "VIIRS True Color",
        description: "Broad daily true-color composite for first-pass regional scanning.",
      },
      {
        id: "modisTerra",
        label: "MODIS Terra",
        description: "Daytime surface composite for clouds, river systems, and terrain contrast.",
      },
      {
        id: "modisAqua",
        label: "MODIS Aqua",
        description: "Companion true-color pass for second-look atmospheric verification.",
      },
    ],
  };
}

export async function fetchReferenceStatusSummary() {
  const dashboard = await fetchReferenceDashboard();

  return {
    generatedAt: dashboard.generatedAt,
    liveCount: dashboard.summary.liveCount,
    activeCount: dashboard.summary.activeCount,
    apiCount: dashboard.summary.apiCount,
    appsWithApis: dashboard.summary.appsWithApis,
    medianResponseMs: dashboard.summary.medianResponseMs,
    fastestLabel: dashboard.summary.fastest?.label ?? null,
    fastestResponseMs: dashboard.summary.fastest?.responseTimeMs ?? null,
  };
}
