import test from "node:test";
import assert from "node:assert/strict";
import * as analysisModule from "../src/lib/research-analysis.ts";
const { completeUtcWindow, sharedTypeDayOverlap, researchUnavailable } = ("default" in analysisModule ? analysisModule.default : analysisModule) as typeof analysisModule;

const now = new Date("2026-03-02T18:00:00Z");
test("shared signal types cannot multiply a single calendar day", () => {
  const result = sharedTypeDayOverlap([
    { region: "a", day: "2026-03-01", types: ["fire", "news", "rain"] },
    { region: "b", day: "2026-03-01", types: ["fire", "news", "rain"] },
    { region: "a", day: "2026-03-01", types: ["fire"] },
  ], 2, 1, now);
  assert.equal(result[0].co_occurring_days, 1);
  assert.equal(result[0].correlation_strength, 0.5);
  assert.equal(result[0].shared_signal_types.length, 3);
});
test("different types and incomplete current days do not count", () => {
  assert.deepEqual(sharedTypeDayOverlap([
    { region: "a", day: "2026-03-01", types: ["fire"] },
    { region: "b", day: "2026-03-01", types: ["news"] },
    { region: "a", day: "2026-03-02", types: ["fire"] },
    { region: "b", day: "2026-03-02", types: ["fire"] },
  ], 2, 1, now), []);
  assert.deepEqual(completeUtcWindow(2, now), { from: "2026-02-28T00:00:00.000Z", to: "2026-03-02T00:00:00.000Z" });
});
test("invalid calendar dates and fractional thresholds fail closed", () => {
  assert.throws(() => sharedTypeDayOverlap([{ region: "a", day: "2026-02-30", types: ["fire"] }], 2, 1, now));
  assert.throws(() => sharedTypeDayOverlap([], 2, 1.5, now));
});
test("missing archive is unavailable, not measured zero", async () => {
  const response = researchUnavailable({ signals: [], total: null });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.total, null);
  assert.equal(body.state, "unavailable");
});
