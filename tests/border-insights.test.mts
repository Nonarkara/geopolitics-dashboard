import assert from "node:assert/strict";
import test from "node:test";
import * as borderInsightsModule from "../src/lib/border-insights.ts";

const borderInsights = (
  "default" in borderInsightsModule
    ? (borderInsightsModule as typeof borderInsightsModule & {
        default: typeof borderInsightsModule;
      }).default
    : borderInsightsModule
);
const { settleWithin } = borderInsights;

test("settleWithin returns the completed upstream result", async () => {
  const result = await settleWithin(Promise.resolve("live"), "fallback", 50);
  assert.equal(result, "live");
});

test("settleWithin releases the dashboard when an upstream stalls", async () => {
  const startedAt = Date.now();
  const stalled = new Promise<string>(() => undefined);
  const result = await settleWithin(stalled, "fallback", 20);

  assert.equal(result, "fallback");
  assert.ok(Date.now() - startedAt < 200);
});

test("settleWithin converts an upstream failure into the declared fallback", async () => {
  const result = await settleWithin(
    Promise.reject(new Error("upstream failed")),
    "fallback",
    50,
  );

  assert.equal(result, "fallback");
});
