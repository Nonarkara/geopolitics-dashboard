import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import * as cronJobsModule from "../src/lib/cron-jobs.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const cronJobsExports = unwrapModule(cronJobsModule);
const {
  cronJobDeps,
  executeInternalCronJob,
  loadCronJobStatuses,
  runCronJobRequest,
} = cronJobsExports;

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

test("cron routes reject unauthorized requests when CRON_SECRET is configured", async (t) => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "top-secret";
  t.after(() => {
    process.env.CRON_SECRET = previous;
  });

  const response = await runCronJobRequest(
    new NextRequest("http://localhost/api/cron/conflict-intel"),
    "conflict-intel",
  );
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHORIZED_CRON_REQUEST");
});

test("internal cron execution aggregates route results into one operational payload", async (t) => {
  const restore = patchDeps(cronJobDeps, {
    now: (() => {
      let calls = 0;
      return () => new Date(`2026-04-04T00:0${calls++}:00.000Z`);
    })(),
    fetch: async (input: RequestInfo | URL) => {
      const url = String(input);
      return new Response(JSON.stringify({ ok: true, url }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  t.after(restore);

  const payload = await executeInternalCronJob(
    "https://example.com",
    "markets-macro",
  );

  assert.equal(payload.jobId, "markets-macro");
  assert.equal(payload.ok, true);
  assert.equal(payload.errors.length, 0);
  assert.equal(payload.tasks.length, 2);
  assert.equal(payload.tasks.every((task: { ok: boolean }) => task.ok), true);
});

test("runtime cron freshness reports healthy and failing groups from stored snapshots", async (t) => {
  const restore = patchDeps(cronJobDeps, {
    isDatabaseConfigured: () => true,
    now: () => new Date("2026-04-04T10:00:00.000Z"),
    query: async (text: string) => {
      if (text.includes("FROM data_snapshots")) {
        return {
          rows: [
            {
              feed_id: "cron:conflict-intel",
              captured_at: "2026-04-04T08:00:00.000Z",
              snapshot_data: {
                jobId: "conflict-intel",
                ok: true,
                errors: [],
                warnings: [],
              },
            },
            {
              feed_id: "cron:markets-macro",
              captured_at: "2026-04-04T07:00:00.000Z",
              snapshot_data: {
                jobId: "markets-macro",
                ok: false,
                errors: ["Market radar: HTTP 503"],
                warnings: [],
              },
            },
          ],
        };
      }

      if (text.includes("FROM feed_health")) {
        return {
          rows: [
            {
              feed_id: "cron:conflict-intel",
              status: "ok",
              checked_at: "2026-04-04T08:00:00.000Z",
              response_time_ms: 1800,
              message: null,
            },
            {
              feed_id: "cron:markets-macro",
              status: "degraded",
              checked_at: "2026-04-04T07:00:00.000Z",
              response_time_ms: 2100,
              message: "Market radar: HTTP 503",
            },
          ],
        };
      }

      return { rows: [] };
    },
  });
  t.after(restore);

  const statuses = await loadCronJobStatuses();
  const healthy = statuses.find((cron) => cron.id === "conflict-intel");
  const failing = statuses.find((cron) => cron.id === "markets-macro");
  const missing = statuses.find((cron) => cron.id === "daily-summary");

  assert.equal(healthy?.state, "healthy");
  assert.equal(failing?.state, "failing");
  assert.equal(missing?.state, "missing");
});
