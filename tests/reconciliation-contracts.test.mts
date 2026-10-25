import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// Source-contract guards only. Rendered geometry and tile reachability are separate gates.
test("merged basemap repair survives on the Worker branch", () => {
  const map = read("src/components/Map/BorderMap.tsx");
  assert.ok(map.includes("https://tile.openstreetmap.org/{z}/{x}/{y}.png"));
  assert.ok(map.includes("Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"));
  assert.ok(!map.includes("basemaps.cartocdn.com"));
});

test("operator typography uses two families without a separate decorative display face", () => {
  const layout = read("src/app/layout.tsx");
  const css = read("src/app/globals.css");
  assert.match(layout, /import \{ Jost, JetBrains_Mono \}/);
  assert.doesNotMatch(layout, /Josefin_Sans|Source_Sans_3/);
  assert.match(css, /--font-display: var\(--font-body-family/);
  for (const path of ["src/services/map-engine.ts", "src/app/briefing/page.tsx"]) {
    assert.ok(!read(path).includes("Source Sans 3"), `old family in ${path}`);
  }
});

test("Playwright does not accidentally collect Node backend suites", () => {
  assert.match(read("playwright.config.ts"), /testMatch: "\*\*\/\*\.spec\.ts"/);
});

test("compact evidence retains a readable comparison chart", () => {
  const insight = read("src/components/Intelligence/BorderInsightLab.tsx");
  assert.match(insight, /data-testid="comparison-radar" className="h-\[180px\] shrink-0/);
  assert.ok(insight.includes("xl:overflow-y-auto"));
  assert.ok(!insight.includes('family: "Source Sans 3"'));
});
