import assert from "node:assert/strict";
import test from "node:test";
import * as incidentsRouteModule from "../src/app/api/incidents/route.ts";
import * as movementsRouteModule from "../src/app/api/movements/route.ts";
import * as airQualityRouteModule from "../src/app/api/air-quality/route.ts";
import * as thailandMonitorModule from "../src/lib/thailand-monitor.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const { GET: getIncidents } = unwrapModule(incidentsRouteModule);
const { GET: getMovements } = unwrapModule(movementsRouteModule);
const { GET: getAirQuality } = unwrapModule(airQualityRouteModule);
const { buildThailandNews } = unwrapModule(thailandMonitorModule);

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

test("thailand news stays empty when there are no live incidents", () => {
  const payload = buildThailandNews([], []);
  assert.deepEqual(payload.news, []);
  assert.equal(payload.errorCode, "LIVE_DATA_UNAVAILABLE");
});
