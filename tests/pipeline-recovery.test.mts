import assert from "node:assert/strict";
import test from "node:test";
import * as regionalModule from "../src/app/api/open-intel/regional/route.ts";
import * as dailyModule from "../src/app/api/cron/daily-ops/route.ts";
import * as ingestionModule from "../src/app/api/cron/data-ingestion/route.ts";
import * as cronModule from "../src/lib/cron-jobs.ts";
import * as nextModule from "next/server.js";
import * as runtimeModule from "../src/lib/runtime-status.ts";

function unwrap<T extends object>(m: T): T { return ("default" in m ? m.default : m) as T; }
const { GET: regional } = unwrap(regionalModule);
const { GET: daily } = unwrap(dailyModule);
const { GET: ingestion } = unwrap(ingestionModule);
const { cronJobDeps } = unwrap(cronModule);
const { NextRequest } = unwrap(nextModule);
const { buildRuntimeStatusPayload } = unwrap(runtimeModule);

test("archive status does not label missing stored history as fabricated fallback observations", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });
  try {
    const result = await buildRuntimeStatusPayload();
    for (const id of ["conflict_events", "rainfall", "fires"]) {
      const dataset = result.datasets.find(d => d.id === id);
      assert.equal(dataset?.state, "unavailable");
      assert.ok(!dataset?.details.includes("packaged fallback"));
    }
    assert.match(result.datasets.find(d => d.id === "fires")?.details ?? "", /independent/);
  } finally { globalThis.fetch = original; }
});

test("orbital failures recover immediately; partial results expire quickly; valid empty feeds cache", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let now = originalNow();
  let calls = 0;
  let mode = "offline";
  Date.now = () => now;
  globalThis.fetch = async (url) => {
    calls++;
    if (mode === "offline") throw new Error("fixture offline");
    if (mode === "malformed") return Response.json({ unexpected: [] });
    if (mode === "partial" && String(url).endsWith("/maritime")) throw new Error("fixture partial");
    return Response.json(String(url).endsWith("/satellites") ? { satellites: [] } : { ports: [], chokepoints: [] });
  };
  try {
    for (const variant of ["offline", "malformed"]) {
      mode = variant;
      const response = await regional();
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    assert.equal(calls, 4, "unavailable response poisoned the next attempt");
    mode = "live";
    const response = await regional();
    assert.equal((await response.json()).status, "live");
    assert.equal(calls, 6);
    await regional();
    assert.equal(calls, 6, "valid empty observations were not cached");
    now += 300001;
    mode = "partial";
    const partial = await regional();
    assert.equal(partial.headers.get("cache-control"), "public, max-age=0, s-maxage=60");
    mode = "live";
    await regional();
    assert.equal(calls, 8);
    now += 60001;
    await regional();
    assert.equal(calls, 10, "partial response held recovery longer than one minute");
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
});

test("grouped cron rejects before work and reports child failures as HTTP failure", async () => {
  const oldSecret = process.env.CRON_SECRET;
  const original = { ...cronJobDeps };
  process.env.CRON_SECRET = "fixture-cron-secret";
  let calls = 0;
  cronJobDeps.isDatabaseConfigured = () => false;
  cronJobDeps.fetch = async () => { calls++; return Response.json({}, { status: 503 }); };
  try {
    const anonymous = new NextRequest("https://example.test/api/cron/data-ingestion");
    assert.equal((await ingestion(anonymous)).status, 401);
    assert.equal((await daily(anonymous)).status, 401);
    assert.equal(calls, 0);
    const authorized = new NextRequest("https://example.test/api/cron/data-ingestion", {
      headers: { authorization: "Bearer fixture-cron-secret" },
    });
    for (const run of [ingestion, daily]) {
      const response = await run(authorized);
      assert.equal(response.status, 503, "207/200 would pass curl -f despite failed work");
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal((await response.json()).ok, false);
    }
    assert.ok(calls > 0);
  } finally {
    Object.assign(cronJobDeps, original);
    if (oldSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = oldSecret;
  }
});
