import test from "node:test";
import assert from "node:assert/strict";
import * as analysisModule from "../src/lib/research-analysis.ts";
import * as routeModule from "../src/app/api/research/correlation/route.ts";
import * as nextModule from "next/server.js";
function unwrap<T extends object>(m: T): T { return ("default" in m ? m.default : m) as T; }
const { researchAnalysisDeps: deps } = unwrap(analysisModule);
const { GET } = unwrap(routeModule);
const { NextRequest } = unwrap(nextModule);

test("correlation route applies the tested day method and fails closed", async () => {
  const original = { ...deps };
  try {
    deps.isDatabaseConfigured = () => false;
    assert.equal((await GET(new NextRequest("https://example.test/api/research/correlation"))).status, 503);
    deps.isDatabaseConfigured = () => true;
    deps.now = () => new Date("2026-03-02T09:00:00Z");
    deps.query = (async (_sql: string, values: unknown[]) => {
      assert.deepEqual(values, ["2026-02-28T00:00:00.000Z", "2026-03-02T00:00:00.000Z"]);
      return { rows: [{ region: "a", day: "2026-03-01", types: ["fire", "news"] }, { region: "b", day: "2026-03-01", types: ["fire", "news"] }] };
    }) as typeof deps.query;
    const response = await GET(new NextRequest("https://example.test/api/research/correlation?days=2&min_overlap=1"));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.correlations[0].co_occurring_days, 1);
    assert.equal(body.correlations[0].correlation_strength, 0.5);
    assert.equal(body.method.calibratedProbability, false);
    deps.query = (async () => ({ rows: [] })) as unknown as typeof deps.query;
    assert.equal((await GET(new NextRequest("https://example.test/api/research/correlation"))).status, 200);
    deps.query = async () => { throw new Error("database down"); };
    assert.equal((await GET(new NextRequest("https://example.test/api/research/correlation"))).status, 503);
  } finally { Object.assign(deps, original); }
});
