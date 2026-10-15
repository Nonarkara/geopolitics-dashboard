import assert from "node:assert/strict";
import test from "node:test";
import * as nextServerModule from "next/server.js";
import * as cronJobsModule from "../src/lib/cron-jobs.ts";
import * as dataAuthModule from "../src/lib/data-explorer-auth.ts";
import * as publicDataModule from "../src/lib/public-data-query.ts";
import * as fetchNewsModule from "../src/app/api/research/fetch-news/route.ts";
import * as snapshotModule from "../src/app/api/cron/snapshot/route.ts";

function unwrapModule<T extends object>(module: T) {
  return ("default" in module
    ? (module as T & { default: T }).default
    : module) as T;
}

const { NextRequest } = unwrapModule(nextServerModule);
const { isAuthorizedCronRequest } = unwrapModule(cronJobsModule);
const { isDataExplorerAuthorized } = unwrapModule(dataAuthModule);
const { resolvePublicDataQuery } = unwrapModule(publicDataModule);
const { GET: fetchNews } = unwrapModule(fetchNewsModule);
const { GET: captureSnapshot } = unwrapModule(snapshotModule);

test("data explorer fails closed when its token is missing", async () => {
  const original = process.env.DATA_EXPLORER_TOKEN;
  delete process.env.DATA_EXPLORER_TOKEN;

  try {
    assert.equal(
      await isDataExplorerAuthorized(new Request("https://example.test/api/data/catalog")),
      false,
    );
  } finally {
    if (original === undefined) delete process.env.DATA_EXPLORER_TOKEN;
    else process.env.DATA_EXPLORER_TOKEN = original;
  }
});

test("data explorer accepts only the configured bearer token", async () => {
  const original = process.env.DATA_EXPLORER_TOKEN;
  process.env.DATA_EXPLORER_TOKEN = "test-explorer-token";

  try {
    const valid = new Request("https://example.test/api/data/catalog", {
      headers: { authorization: "Bearer test-explorer-token" },
    });
    const invalid = new Request("https://example.test/api/data/catalog", {
      headers: { authorization: "Bearer wrong-token" },
    });
    assert.equal(await isDataExplorerAuthorized(valid), true);
    assert.equal(await isDataExplorerAuthorized(invalid), false);
  } finally {
    if (original === undefined) delete process.env.DATA_EXPLORER_TOKEN;
    else process.env.DATA_EXPLORER_TOKEN = original;
  }
});

test("cron authorization uses the shared bearer-token boundary", async () => {
  const original = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-cron-token";

  try {
    const valid = new NextRequest("https://example.test/api/cron/daily-summary", {
      headers: { authorization: "Bearer test-cron-token" },
    });
    const invalid = new NextRequest("https://example.test/api/cron/daily-summary", {
      headers: { authorization: "Bearer nope" },
    });
    assert.equal(await isAuthorizedCronRequest(valid), true);
    assert.equal(await isAuthorizedCronRequest(invalid), false);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test("service-role ingestion routes reject unauthenticated requests before work", async () => {
  const original = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-cron-token";

  try {
    const request = new NextRequest("https://example.test/api/cron/snapshot");
    const [newsResponse, snapshotResponse] = await Promise.all([
      fetchNews(request),
      captureSnapshot(request),
    ]);
    assert.equal(newsResponse.status, 401);
    assert.equal(snapshotResponse.status, 401);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test("public dashboard data route exposes only its two bounded contracts", () => {
  const currency = resolvePublicDataQuery(
    new URLSearchParams(
      "table=v8_asean_currencies_daily&order=captured_at&limit=500&select=currency_pair,rate,change_percent",
    ),
  );
  assert.ok(currency);
  assert.equal(currency.limit, 50);
  assert.equal(currency.ascending, false);

  assert.equal(
    resolvePublicDataQuery(new URLSearchParams("table=signal_archive&select=*")),
    null,
  );
  assert.equal(
    resolvePublicDataQuery(
      new URLSearchParams(
        "table=v8_commodity_prices_daily&select=commodity_name,service_role_key",
      ),
    ),
    null,
  );
  assert.equal(
    resolvePublicDataQuery(
      new URLSearchParams("table=v8_commodity_prices_daily&order=price;drop table x"),
    ),
    null,
  );
});
