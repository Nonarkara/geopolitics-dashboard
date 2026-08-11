import assert from "node:assert/strict";
import test from "node:test";
import * as incidentsRouteModule from "../src/app/api/incidents/route.ts";
import * as movementsRouteModule from "../src/app/api/movements/route.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const { GET: getIncidents } = unwrapModule(incidentsRouteModule);
const { GET: getMovements } = unwrapModule(movementsRouteModule);

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
