import type {
  ConflictTrendsResponse,
  EconomicIndicator,
  IncidentFeature,
} from "@/types/dashboard";

const DEFAULT_REFERENCE_DASHBOARD_URL =
  "https://dr-non-operating-systems.onrender.com/api/dashboard";
const DEFAULT_CITY_REPORTER_REPORTS_URL =
  "https://city-reporter-bot.onrender.com/api/reports";
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

interface CityReporterReport {
  report_id: string;
  ticket_number: string;
  timestamp: string;
  problem_type: string;
  description: string;
  location_text: string;
  latitude: string;
  longitude: string;
  ai_summary: string;
  urgency: string;
  status: string;
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
    typeof value.url === "string"
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

function isCityReporterReport(value: unknown): value is CityReporterReport {
  return (
    isRecord(value) &&
    typeof value.report_id === "string" &&
    typeof value.ticket_number === "string" &&
    typeof value.timestamp === "string" &&
    typeof value.problem_type === "string" &&
    typeof value.description === "string" &&
    typeof value.location_text === "string" &&
    typeof value.latitude === "string" &&
    typeof value.longitude === "string" &&
    typeof value.ai_summary === "string" &&
    typeof value.urgency === "string" &&
    typeof value.status === "string"
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

function parseCoordinate(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRegionalCoordinate(lat: number, lng: number) {
  return lat >= 0 && lat <= 25 && lng >= 90 && lng <= 110;
}

function getUrgencyScore(urgency: string) {
  const normalized = urgency.trim().toLowerCase();

  if (
    normalized.includes("สูง") ||
    normalized.includes("high") ||
    normalized.includes("critical")
  ) {
    return 2;
  }

  if (normalized.includes("ต่ำ") || normalized.includes("low")) {
    return 0;
  }

  return 1;
}

function normalizeCategory(value: string) {
  return value.trim() || "Unclassified";
}

function toDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfUtcWeek(value: Date) {
  const date = new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  ));
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date;
}

function formatWeekLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
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

export async function fetchReferenceReports() {
  const dashboard = await fetchReferenceDashboard();
  const reportsUrl =
    findTargetApiUrl(dashboard, "city-reporter-bot", "Reports") ??
    DEFAULT_CITY_REPORTER_REPORTS_URL;
  const payload = await fetchJson<unknown>(reportsUrl);

  if (!Array.isArray(payload)) {
    throw new Error("Reference reports payload was not an array");
  }

  return payload.filter(isCityReporterReport);
}

export function buildReferenceIncidentFeatures(reports: CityReporterReport[]) {
  return reports
    .map((report): IncidentFeature | null => {
      if (!report.report_id || report.report_id === "TEST_CONNECTION") {
        return null;
      }

      const lat = parseCoordinate(report.latitude);
      const lng = parseCoordinate(report.longitude);

      if (lat === null || lng === null || !isRegionalCoordinate(lat, lng)) {
        return null;
      }

      const urgencyScore = getUrgencyScore(report.urgency);
      const notes =
        report.ai_summary.trim() ||
        report.description.trim() ||
        "No reference narrative available.";

      return {
        id: report.report_id,
        geometry: { coordinates: [lng, lat] },
        properties: {
          title: normalizeCategory(report.problem_type),
          type: normalizeCategory(report.problem_type),
          fatalities: urgencyScore,
          notes,
          location: report.location_text.trim() || "Reference field report",
          eventDate: report.timestamp,
        },
      };
    })
    .filter((feature): feature is IncidentFeature => feature !== null)
    .sort((a, b) => b.properties.eventDate.localeCompare(a.properties.eventDate));
}

export function buildReferenceConflictTrends(
  reports: CityReporterReport[],
): ConflictTrendsResponse | null {
  const datedReports = reports
    .map((report) => {
      const timestamp = toDate(report.timestamp);
      return timestamp ? { report, timestamp } : null;
    })
    .filter(
      (
        item,
      ): item is {
        report: CityReporterReport;
        timestamp: Date;
      } => item !== null,
    );

  if (datedReports.length === 0) {
    return null;
  }

  const latestTimestamp = datedReports.reduce(
    (latest, current) =>
      current.timestamp > latest ? current.timestamp : latest,
    datedReports[0].timestamp,
  );
  const currentWindowStart = new Date(latestTimestamp);
  currentWindowStart.setUTCDate(currentWindowStart.getUTCDate() - 30);
  const previousWindowStart = new Date(latestTimestamp);
  previousWindowStart.setUTCDate(previousWindowStart.getUTCDate() - 60);

  const countsByCategory = new Map<
    string,
    { current: number; previous: number }
  >();

  for (const { report, timestamp } of datedReports) {
    const label = normalizeCategory(report.problem_type);
    const bucket = countsByCategory.get(label) ?? { current: 0, previous: 0 };

    if (timestamp >= currentWindowStart) {
      bucket.current += 1;
    } else if (timestamp >= previousWindowStart) {
      bucket.previous += 1;
    }

    countsByCategory.set(label, bucket);
  }

  const topCategories = [...countsByCategory.entries()]
    .sort(
      (a, b) =>
        b[1].current +
        b[1].previous -
        (a[1].current + a[1].previous),
    )
    .slice(0, 6);

  const latestWeek = startOfUtcWeek(latestTimestamp);
  const weeklyTotals = new Map<string, number>();

  for (let index = 5; index >= 0; index -= 1) {
    const weekStart = new Date(latestWeek);
    weekStart.setUTCDate(weekStart.getUTCDate() - index * 7);
    weeklyTotals.set(weekStart.toISOString(), 0);
  }

  for (const { report, timestamp } of datedReports) {
    const weekStart = startOfUtcWeek(timestamp).toISOString();

    if (!weeklyTotals.has(weekStart)) {
      continue;
    }

    weeklyTotals.set(
      weekStart,
      (weeklyTotals.get(weekStart) ?? 0) + getUrgencyScore(report.urgency) + 1,
    );
  }

  return {
    provincialData: {
      labels: topCategories.map(([label]) => label),
      current: topCategories.map(([, counts]) => counts.current),
      yoy: topCategories.map(([, counts]) => counts.previous),
    },
    fatalities: {
      labels: [...weeklyTotals.keys()].map((week) =>
        formatWeekLabel(new Date(week)),
      ),
      data: [...weeklyTotals.values()],
    },
  };
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
