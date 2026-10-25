import test from "node:test";
import assert from "node:assert/strict";
import * as reliefModule from "../src/lib/reliefweb.ts";
const { loadReliefWebReports } = ("default" in reliefModule ? reliefModule.default : reliefModule) as typeof reliefModule;

test("humanitarian dates are not invented and failed responses recover uncached", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let clock = originalNow();
  Date.now = () => clock;
  let healthy = false;
  let malformed = false;
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    if (!healthy) return new Response(null, { status: 503 });
    if (String(input).includes("rss.xml")) return new Response(malformed ? "<html>Challenge</html>" : "<rss><channel><item><title>Undated report</title><link>https://reliefweb.int/report/example</link></item></channel></rss>");
    return Response.json({ success: true, result: { results: [{ title: "Catalog entry", name: "entry", metadata_modified: "2026-10-01T00:00:00Z" }] } });
  };
  try {
    const failed = await loadReliefWebReports();
    assert.equal(failed.source.status, "offline");
    healthy = true;
    malformed = true;
    const challenge = await loadReliefWebReports();
    assert.equal(challenge.source.status, "partial");
    clock += 60001;
    malformed = false;
    healthy = true;
    const [a, b] = await Promise.all([loadReliefWebReports(), loadReliefWebReports()]);
    assert.equal(a, b);
    assert.equal(calls, 6);
    assert.equal(a.source.status, "live");
    assert.equal(a.reports.length, 2);
    assert.ok(a.reports.every(report => report.date === "" && report.dateKind === "unknown"));
    assert.equal(a.reports[1].metadataUpdatedAt, "2026-10-01T00:00:00.000Z");
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
});
