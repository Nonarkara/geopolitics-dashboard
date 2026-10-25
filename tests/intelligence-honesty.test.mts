import assert from "node:assert/strict";
import test from "node:test";
import axios from "axios";
import { createRequire } from "node:module";
import * as intelModule from "../src/lib/intelligence.ts";

const intel = ("default" in intelModule ? intelModule.default : intelModule) as typeof intelModule;
const cjsAxios = createRequire(import.meta.url)("axios") as typeof axios;

test("internal observation loaders never backfill production packages with sample rows", async () => {
  const oldStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT;
  delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
  try {
    for (const load of [intel.loadFires, intel.loadRainfall, intel.loadRefugeeMovements]) {
      assert.deepEqual(await load(), []);
    }
    process.env.NEXT_PUBLIC_STATIC_EXPORT = "true";
    assert.ok((await intel.loadRefugeeMovements()).length > 0, "static demo content was removed");
  } finally {
    if (oldStatic === undefined) delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
    else process.env.NEXT_PUBLIC_STATIC_EXPORT = oldStatic;
  }
});

test("concurrent package readers share one build and an offline build contains no mock observations", async () => {
  const oldFetch = globalThis.fetch;
  const oldGet = axios.get;
  const oldCjsGet = cjsAxios.get;
  const oldStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT;
  delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
  globalThis.fetch = async () => { throw new Error("fixture offline"); };
  const requests = new Map<string, number>();
  axios.get = (async (url: string) => {
    requests.set(url, (requests.get(url) ?? 0) + 1);
    throw new Error("fixture offline");
  }) as typeof axios.get;
  cjsAxios.get = axios.get;
  try {
    const first = intel.loadIntelligencePackages();
    const second = intel.loadIntelligencePackages();
    assert.equal(first, second, "parallel consumers started separate builds");
    const result = await first;
    assert.equal(result.mode, "offline");
    assert.deepEqual(result.packages.flatMap(pkg => pkg.items), []);
    assert.ok(requests.size > 0);
    assert.equal(Math.max(...requests.values()), 1, "parallel packages duplicated the same raw feed request");
    assert.equal((await intel.loadIntelligencePackages()).mode, "offline", "cache promoted outage to live");
  } finally {
    globalThis.fetch = oldFetch;
    axios.get = oldGet;
    cjsAxios.get = oldCjsGet;
    if (oldStatic === undefined) delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
    else process.env.NEXT_PUBLIC_STATIC_EXPORT = oldStatic;
  }
});

test("successful raw feeds are fetched once and independently scored for different packages", async () => {
  const oldFetch = globalThis.fetch;
  const oldGet = axios.get;
  const oldCjsGet = cjsAxios.get;
  const requests = new Map<string, number>();
  globalThis.fetch = async () => { throw new Error("non-feed fixture offline"); };
  const xml = `<rss><channel><title>Test newsroom</title><item><title>Phuket monsoon rain delays ferry visitors</title><link>https://example.test/verified-report</link><description>Storm warning affects tourism arrivals and marine transfers.</description><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`;
  axios.get = (async (url: string) => {
    requests.set(url, (requests.get(url) ?? 0) + 1);
    return { data: xml };
  }) as typeof axios.get;
  cjsAxios.get = axios.get;
  try {
    const result = await intel.loadIntelligencePackages();
    assert.equal(result.mode, "live");
    assert.equal(Math.max(...requests.values()), 1);
    const copies = result.packages.flatMap(pkg => pkg.items.filter(item => item.url === "https://example.test/verified-report"));
    assert.ok(new Set(copies.map(item => item.packageId)).size >= 2);
    assert.ok(new Set(copies.map(item => item.score)).size >= 2, "package-specific interpretation was shared with the raw fetch");
  } finally {
    globalThis.fetch = oldFetch;
    axios.get = oldGet;
    cjsAxios.get = oldCjsGet;
  }
});
