import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const baseURL = process.env.LAYOUT_URL ?? 'http://127.0.0.1:8899';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ serviceWorkers: 'block' });
const results = [];

async function measure() {
  return page.evaluate(() => {
    const canvas = document.querySelector('#deckgl-overlay');
    const controls = document.querySelector('[data-testid="map-controls"]');
    const map = canvas.getBoundingClientRect();
    const panel = controls.getBoundingClientRect();
    const evidence = document.querySelector('[data-testid="evidence-comparison"]');
    return {
      width: innerWidth, height: innerHeight, mapHeight: map.height,
      mapTop: map.top, mapBottom: map.bottom,
      controlsTop: panel.top, controlsBottom: panel.bottom,
      headerHeight: document.querySelector('header').getBoundingClientRect().height,
      evidenceHeight: evidence.getBoundingClientRect().height,
      overflow: document.documentElement.scrollWidth > innerWidth,
      font: getComputedStyle(document.body).fontFamily,
      loadedFonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family),
    };
  });
}

function check(g) {
  assert.ok(!g.overflow, `document overflow at ${g.width}`);
  assert.ok(g.mapHeight >= (g.width < 744 ? 500 : 350), `map reduced to ${g.mapHeight}px at ${g.width}`);
  if (g.width >= 1280) {
    assert.ok(g.controlsTop >= g.mapTop && g.controlsBottom <= g.mapBottom, 'map controls escape their map');
  }
}

try {
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.locator('#deckgl-overlay').waitFor({ timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    // Let actual upstream requests settle; no mocked data in these captures.
    await page.waitForTimeout(20000);
    const g = await measure();
    check(g);
    results.push(g);
    await page.screenshot({ path: `/tmp/geo-map-audit-${width}.png` });
    if (width === 1440) {
      const radar = page.getByTestId('comparison-radar');
      if (await radar.count()) {
        assert.ok(await radar.evaluate(el => el.clientHeight >= 180), 'comparison chart collapsed');
        await radar.scrollIntoViewIfNeeded();
      }
      const controls = page.getByTestId('map-controls');
      const last = controls.getByRole('button').last();
      await last.scrollIntoViewIfNeeded();
      assert.ok(await last.evaluate(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }), 'last map control is unreachable after scrolling');
      const mutant = await page.addStyleTag({ content: '[data-testid="map-controls"] { max-height:none !important; overflow:visible !important; }' });
      let rejected = false;
      try { check(await measure()); } catch { rejected = true; }
      await mutant.evaluate(el => el.remove());
      assert.ok(rejected, 'unbounded map-controls mutant survived');
    }
  }
  console.log(JSON.stringify(results, null, 2));
  console.log('Map geometry passed; final control reachable; unbounded-controls mutant rejected. Screenshots require visual review; geometry alone does not certify tile content.');
} finally {
  await browser.close();
}
