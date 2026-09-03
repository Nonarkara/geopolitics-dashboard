import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import * as borderNewsRouteModule from "../src/app/api/border/news/route.ts";
import * as borderTickerRouteModule from "../src/app/api/border/ticker/route.ts";
import * as briefRouteModule from "../src/app/api/border-command/brief/route.ts";
import * as marketsRouteModule from "../src/app/api/markets/route.ts";
import * as sparklinesRouteModule from "../src/app/api/research/sparklines/route.ts";
import * as borderHistoryModule from "../src/lib/border-history.ts";
import * as playbackRouteDepsModule from "../src/lib/playback-route-deps.ts";
import * as playbackApiModule from "../src/lib/playback-api.ts";
import * as timeWindowModule from "../src/lib/time-window.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const borderNewsExports = unwrapModule(borderNewsRouteModule);
const borderTickerExports = unwrapModule(borderTickerRouteModule);
const briefRouteExports = unwrapModule(briefRouteModule);
const marketsRouteExports = unwrapModule(marketsRouteModule);
const sparklinesRouteExports = unwrapModule(sparklinesRouteModule);
const borderHistoryExports = unwrapModule(borderHistoryModule);
const playbackRouteDepsExports = unwrapModule(playbackRouteDepsModule);
const playbackApiExports = unwrapModule(playbackApiModule);
const timeWindowExports = unwrapModule(timeWindowModule);

const { GET: getBorderNews } = borderNewsExports;
const { GET: getBorderTicker } = borderTickerExports;
const { GET: getBrief } = briefRouteExports;
const { GET: getMarkets } = marketsRouteExports;
const { GET: getSparklines } = sparklinesRouteExports;
const {
  borderHistoryDeps,
  loadHistoricalBorderCommandBrief,
  loadHistoricalMarketRadar,
} = borderHistoryExports;
const {
  borderNewsRouteDeps,
  borderTickerRouteDeps,
  marketsRouteDeps,
  sparklineRouteDeps,
} = playbackRouteDepsExports;
const { parseSparklineDays, parseSparklineMetric } = playbackApiExports;
const { parseDashboardTimeWindow } = timeWindowExports;

const canonicalWindow = {
  bangkokDay: "2026-03-14",
  from: "2026-03-13T17:00:00.000Z",
  to: "2026-03-14T16:59:59.999Z",
};

function patchDeps<T extends Record<string, unknown>>(target: T, patch: Partial<T>) {
  const original = {} as Partial<T>;

  for (const key of Object.keys(patch) as Array<keyof T>) {
    original[key] = target[key];
  }

  Object.assign(target, patch);

  return () => {
    Object.assign(target, original);
  };
}

function hasPlaybackErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

test("parseDashboardTimeWindow accepts only canonical Bangkok-day playback windows", () => {
  const canonical = parseDashboardTimeWindow(
    new URLSearchParams({
      from: canonicalWindow.from,
      to: canonicalWindow.to,
    }),
  );
  assert.deepEqual(canonical, {
    mode: "historical",
    timeWindow: canonicalWindow,
  });

  assert.deepEqual(parseDashboardTimeWindow(new URLSearchParams()), {
    mode: "live",
  });

  assert.equal(
    parseDashboardTimeWindow(
      new URLSearchParams({
        from: canonicalWindow.from,
      }),
    ).mode,
    "invalid",
  );

  assert.equal(
    parseDashboardTimeWindow(
      new URLSearchParams({
        from: canonicalWindow.from,
        to: "2026-03-15T16:59:59.999Z",
      }),
    ).mode,
    "invalid",
  );

  assert.equal(
    parseDashboardTimeWindow(
      new URLSearchParams({
        from: "2026-03-13T17:00:00Z",
        to: canonicalWindow.to,
      }),
    ).mode,
    "invalid",
  );
});

test("sparkline contract rejects unsupported metric families and invalid day ranges", () => {
  assert.deepEqual(parseSparklineMetric("score:cambodia-frontier"), {
    family: "score",
    region: "cambodia-frontier",
  });
  assert.equal(parseSparklineDays(null), 30);
  assert.equal(parseSparklineDays("14"), 14);

  assert.throws(
    () => parseSparklineMetric("foo:bar"),
    (error) => hasPlaybackErrorCode(error, "UNSUPPORTED_SPARKLINE_METRIC"),
  );

  assert.throws(
    () => parseSparklineDays("0"),
    (error) => hasPlaybackErrorCode(error, "INVALID_SPARKLINE_DAYS"),
  );
});

test("historical brief returns historical-empty only for real no-data and throws on archive unavailability", async (t) => {
  let restore = patchDeps(borderHistoryDeps, {
    isDatabaseConfigured: () => true,
    query: async () => ({ rows: [] }),
  });
  t.after(restore);

  const emptyPayload = await loadHistoricalBorderCommandBrief(canonicalWindow);
  assert.equal(emptyPayload.mode, "historical-empty");

  restore();
  restore = patchDeps(borderHistoryDeps, {
    isDatabaseConfigured: () => false,
  });
  t.after(restore);

  await assert.rejects(
    () => loadHistoricalBorderCommandBrief(canonicalWindow),
    (error) => hasPlaybackErrorCode(error, "ARCHIVE_UNAVAILABLE"),
  );
});

test("historical market loader queries the nearest stored snapshot at or before the playback window", async (t) => {
  const queries: string[] = [];
  const restore = patchDeps(borderHistoryDeps, {
    isDatabaseConfigured: () => true,
    query: async (text: string) => {
      queries.push(text);
      return { rows: [] };
    },
  });
  t.after(restore);

  const payload = await loadHistoricalMarketRadar(canonicalWindow);
  assert.equal(payload.mode, "historical-empty");
  assert.match(queries[0] ?? "", /created_at <= \$1/);
  assert.doesNotMatch(queries[0] ?? "", /created_at >=/);
  assert.match(queries[1] ?? "", /captured_at <= \$1/);
  assert.doesNotMatch(queries[1] ?? "", /captured_at >=/);
});

test("brief route rejects partial playback params with a 400 error envelope", async () => {
  const response = await getBrief(
    new NextRequest(`http://localhost/api/border-command/brief?from=${encodeURIComponent(canonicalWindow.from)}`),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body.error.code, "INVALID_PLAYBACK_WINDOW");
});

test("live news route fails closed instead of returning fallback news", async (t) => {
  const restore = patchDeps(borderNewsRouteDeps, {
    loadBorderIncidents: async () => [],
    loadThailandEconomics: async () => [],
    loadBorderOsint: async () => ({
      generatedAt: canonicalWindow.to,
      signals: [],
      humanitarian: [],
      sources: [
        {
          id: "gdelt-doc-2",
          label: "GDELT DOC 2",
          url: "https://api.gdeltproject.org",
          status: "offline",
          checkedAt: canonicalWindow.to,
          responseTimeMs: null,
          message: "offline",
        },
        {
          id: "unhcr-refugee-data-finder",
          label: "UNHCR Refugee Data Finder",
          url: "https://api.unhcr.org",
          status: "offline",
          checkedAt: canonicalWindow.to,
          responseTimeMs: null,
          message: "offline",
        },
      ],
    }),
    logFeedHealth: async () => undefined,
    upsertNewsItem: async () => undefined,
    archiveSignalBatch: async () => undefined,
  });
  t.after(restore);

  const response = await getBorderNews(new NextRequest("http://localhost/api/border/news"));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "LIVE_DATA_UNAVAILABLE");
  assert.equal("news" in body, false);
});

test("live ticker route fails closed instead of returning fallback ticker", async (t) => {
  const restore = patchDeps(borderTickerRouteDeps, {
    loadBorderIncidents: async () => [],
    loadThailandEconomics: async () => [],
    loadBorderOsint: async () => ({
      generatedAt: canonicalWindow.to,
      signals: [],
      humanitarian: [],
      sources: [
        {
          id: "gdelt-doc-2",
          label: "GDELT DOC 2",
          url: "https://api.gdeltproject.org",
          status: "offline",
          checkedAt: canonicalWindow.to,
          responseTimeMs: null,
          message: "offline",
        },
        {
          id: "unhcr-refugee-data-finder",
          label: "UNHCR Refugee Data Finder",
          url: "https://api.unhcr.org",
          status: "offline",
          checkedAt: canonicalWindow.to,
          responseTimeMs: null,
          message: "offline",
        },
      ],
    }),
    archiveSignalBatch: async () => undefined,
  });
  t.after(restore);

  const response = await getBorderTicker(new NextRequest("http://localhost/api/border/ticker"));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "LIVE_DATA_UNAVAILABLE");
  assert.equal("items" in body, false);
});

test("markets route fails closed when neither live nor stored snapshots exist", async (t) => {
  const restore = patchDeps(marketsRouteDeps, {
    fetchReferenceEconomicIndicators: async () => [],
    fetchAseanGdpSnapshot: async () => [],
    loadStoredMarketIndicatorSnapshot: async () => null,
    loadLatestStoredAseanGdpSnapshotWithTimestamp: async () => null,
    persistMarketIndicators: async () => undefined,
    persistAseanGdpSnapshot: async () => undefined,
  });
  t.after(restore);

  const response = await getMarkets(new NextRequest("http://localhost/api/markets"));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "LIVE_DATA_UNAVAILABLE");
  assert.equal("data" in body, false);
});

test("sparklines degrade quietly in live mode but keep playback truthful", async (t) => {
  let response = await getSparklines(
    new NextRequest("http://localhost/api/research/sparklines?metric=foo:bar"),
  );
  let body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "UNSUPPORTED_SPARKLINE_METRIC");

  const restore = patchDeps(sparklineRouteDeps, {
    isDatabaseConfigured: () => false,
  });
  t.after(restore);

  response = await getSparklines(
    new NextRequest("http://localhost/api/research/sparklines?metric=USD/THB"),
  );
  body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.values, []);
  assert.equal(body.mode, "unavailable");

  response = await getSparklines(
    new NextRequest(
      `http://localhost/api/research/sparklines?metric=USD/THB&from=${encodeURIComponent(canonicalWindow.from)}&to=${encodeURIComponent(canonicalWindow.to)}`,
    ),
  );
  body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "ARCHIVE_UNAVAILABLE");
});
