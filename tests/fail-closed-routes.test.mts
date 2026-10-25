import assert from "node:assert/strict";
import test from "node:test";
import * as incidentsRouteModule from "../src/app/api/incidents/route.ts";
import * as movementsRouteModule from "../src/app/api/movements/route.ts";
import * as airQualityRouteModule from "../src/app/api/air-quality/route.ts";
import * as eonetRouteModule from "../src/app/api/border/eonet/route.ts";
import * as sentimentRouteModule from "../src/app/api/border/sentiment/route.ts";
import * as thailandMonitorModule from "../src/lib/thailand-monitor.ts";
import * as nextServerModule from "next/server.js";
import * as dataSourcesModule from "../src/lib/data-sources.ts";
import * as useFetchModule from "../src/hooks/useFetch.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const { GET: getIncidents } = unwrapModule(incidentsRouteModule);
const { GET: getMovements } = unwrapModule(movementsRouteModule);
const { GET: getAirQuality } = unwrapModule(airQualityRouteModule);
const { GET: getEonet } = unwrapModule(eonetRouteModule);
const { GET: getSentiment } = unwrapModule(sentimentRouteModule);
const { buildThailandNews } = unwrapModule(thailandMonitorModule);
const { DATA_SOURCE_CATALOG, formatCadence } = unwrapModule(dataSourcesModule);
const { normalizeDeclaredDataSource } = unwrapModule(useFetchModule);
const { NextRequest } = unwrapModule(nextServerModule);

test("legacy /api/incidents fails closed without a database instead of serving mock", async () => {
  // No DATABASE_URL is configured in the test environment — the same posture
  // as the deployed Worker without a Hyperdrive binding or secret.
  const response = await getIncidents();
  const payload = (await response.json()) as unknown[];

  assert.equal(response.headers.get("X-Data-Source"), "unavailable");
  assert.deepEqual(payload, []);
});

test("legacy /api/movements fails closed instead of serving mock flows", async () => {
  const response = await getMovements();
  const payload = (await response.json()) as unknown[];

  assert.equal(response.headers.get("X-Data-Source"), "unavailable");
  assert.deepEqual(payload, []);
});

test("air-quality fails closed instead of serving packaged AQI", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("upstream offline");
  };

  try {
    const response = await getAirQuality();
    const payload = (await response.json()) as unknown[];

    assert.equal(response.headers.get("X-Data-Source"), "unavailable");
    assert.deepEqual(payload, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("eonet fails closed instead of serving mock events when upstream is down", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("eonet.gsfc.nasa.gov unreachable");
  }) as typeof fetch;

  try {
    const request = new Request("http://localhost/api/border/eonet?days=90");
    const response = await getEonet(request as never);
    const payload = (await response.json()) as unknown[];

    assert.equal(response.headers.get("X-Data-Source"), "unavailable");
    assert.equal(response.headers.get("X-Data-Tier"), "eonet");
    assert.deepEqual(payload, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("thailand news stays empty when there are no live incidents", () => {
  const payload = buildThailandNews([], []);
  assert.deepEqual(payload.news, []);
  assert.equal(payload.errorCode, "LIVE_DATA_UNAVAILABLE");
});

test("sentiment fails closed instead of drawing a synthetic tone curve", async () => {
  const originalFetch = globalThis.fetch;
  const originalStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT;
  delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
  globalThis.fetch = (async () => {
    throw new Error("api.gdeltproject.org unreachable");
  }) as typeof fetch;

  try {
    const request = new NextRequest(
      "http://localhost/api/border/sentiment?theater=myanmar-frontier",
    );
    const response = await getSentiment(request);
    const payload = (await response.json()) as {
      timeline: unknown[];
      source: string;
    };

    assert.equal(response.headers.get("X-Data-Source"), "unavailable");
    assert.deepEqual(payload.timeline, []);
    assert.equal(payload.source, "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStaticExport === undefined) {
      delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
    } else {
      process.env.NEXT_PUBLIC_STATIC_EXPORT = originalStaticExport;
    }
  }
});

test("an unknown theater fails closed rather than substituting another theater", async () => {
  const request = new NextRequest("http://localhost/api/border/sentiment?theater=atlantis");
  const response = await getSentiment(request);
  const payload = (await response.json()) as { timeline: unknown[] };

  assert.equal(response.headers.get("X-Data-Source"), "unavailable");
  assert.deepEqual(payload.timeline, []);
});

test("the client reads every X-Data-Source value the routes actually emit", () => {
  // Producing this header and never reading it is the defect this asserts
  // against: each value a route can set must map to a state the UI can act on.
  assert.equal(normalizeDeclaredDataSource("live"), "live");
  assert.equal(normalizeDeclaredDataSource("partial"), "partial");
  assert.equal(normalizeDeclaredDataSource("unavailable"), "unavailable");
  assert.equal(normalizeDeclaredDataSource("UNAVAILABLE"), "unavailable");
  // An undeclared or unrecognised header is unknown, never optimistically live.
  assert.equal(normalizeDeclaredDataSource(null), null);
  assert.equal(normalizeDeclaredDataSource("static-demo"), null);
});

test("every polled source declares its client cadence exactly once", () => {
  // The dashboard polls these seven feeds. Each interval must be declared in
  // the catalog, so the `useFetch` interval and the feed-health dot cannot
  // drift apart from each other or from what the tooltip tells the user.
  const polled = [
    "traffic",
    "earthquakes",
    "flood",
    "disasters",
    "eonet",
    "commodities",
    "fires",
  ];

  for (const id of polled) {
    const source = DATA_SOURCE_CATALOG[id];
    assert.ok(source, `${id} is missing from DATA_SOURCE_CATALOG`);
    assert.equal(
      typeof source.clientPollMs,
      "number",
      `${id} is polled by the client but declares no clientPollMs`,
    );
    assert.ok(
      source.clientPollMs! >= 60_000,
      `${id} polls faster than once a minute`,
    );
  }
});

test("cadence labels are derived from milliseconds, not written by hand", () => {
  assert.equal(formatCadence(120_000), "2 min");
  assert.equal(formatCadence(900_000), "15 min");
  assert.equal(formatCadence(3_600_000), "1 hr");
  assert.equal(formatCadence(30_000), "30 sec");
});
