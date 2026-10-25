import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Geometry fixtures are isolated from live WebGL/network load. The map gate
// separately captures real tiles and upstream data with WebGL enabled.
const browser = await chromium.launch({ args: ['--disable-webgl'] });
const page = await browser.newPage();
page.setDefaultTimeout(60000);
const baseURL = process.env.LAYOUT_URL ?? 'http://127.0.0.1:8899';
const headline = 'Crossing reopened after river inspection';
const stamp = new Date().toISOString();
await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/open-intel/regional') return route.fulfill({ json: { status: 'live', orbitals: [], maritimePoints: [] } });
  if (path !== '/api/border/news') return route.fulfill({ json: [] });
  return route.fulfill({ json: {
  generatedAt: stamp, mode: 'live', news: [{ id: 'geometry-fixture', title: headline,
    summary: 'Inspect the cited report before comparing this crossing with the map.',
    source: 'ReliefWeb', provider: 'ReliefWeb', sourceUrl: 'https://reliefweb.int/',
    publishedAt: stamp, severity: 'watch', tag: 'access' }],
  sources: ['Google News RSS', 'GDELT DOC 2', 'UNHCR Refugee Data Finder', 'ACLED'].map((label, i) => ({
    id: String(i), label, status: i % 2 ? 'offline' : 'live', checkedAt: stamp,
  })),
} });
});

const results = [];
try {
  for (const width of [1440, 1280, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width < 744 ? 844 : 900 });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.locator('#deckgl-overlay').waitFor();
    if (width >= 744) {
      const desk = page.getByTestId('border-news-desk').first();
      const link = desk.getByRole('link', { name: headline });
      await link.waitFor();
      const geometry = await link.evaluate(el => {
        const panel = el.closest('[data-testid="border-news-desk"]').getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { top: r.top - panel.top, bottom: r.bottom, panelBottom: panel.bottom };
      });
      assert.ok(geometry.top < 130 && geometry.bottom <= geometry.panelBottom, `headline displaced at ${width}: ${JSON.stringify(geometry)}`);
      const summary = desk.getByLabel('News source health');
      await summary.click();
      assert.ok(await desk.getByText('ACLED · offline', { exact: true }).isVisible());
      const expanded = await desk.locator('details').evaluate(el => {
        const panel = el.parentElement.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { height: r.height, panelHeight: panel.height, bottom: r.bottom, panelBottom: panel.bottom };
      });
      assert.ok(expanded.height < expanded.panelHeight * 0.6 && expanded.bottom <= expanded.panelBottom,
        `source disclosure consumes the news pane at ${width}: ${JSON.stringify(expanded)}`);
      await summary.click();
      results.push({ width, headlineTop: geometry.top });
    }
    const controls = page.getByTestId('map-controls');
    if (width < 1280) await page.getByRole('button', { name: 'Open map controls', exact: true }).click();
    const label = page.getByTestId('zoom-gates-label');
    const darkCaption = () => label.evaluate(el => {
      const color = getComputedStyle(el).color.match(/[\d.]+/g).map(Number);
      return color.slice(0, 3).every(c => c < 100) && Number(getComputedStyle(el).opacity) >= 0.7;
    });
    assert.ok(await darkCaption(), 'white-on-white zoom caption returned');
    if (width === 1440) {
      const base = controls.getByRole('button', { name: /^ESRI/ }).first();
      await page.mouse.move(1, 1);
      await base.scrollIntoViewIfNeeded();
      await base.hover();
      const disclosure = controls.locator('div[style*="position: fixed"]').first();
      await disclosure.waitFor();
      const oldDisclosure = await disclosure.elementHandle();
      assert.ok(await disclosure.getByRole('link').count(), 'source link missing from tooltip');
      await controls.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await page.waitForFunction(el => !el.isConnected, oldDisclosure);
      await oldDisclosure.dispose();
    }
    const toggles = controls.getByRole('button', { name: /^Toggle .* map layer$/ });
    assert.equal(await toggles.count(), 16, 'earned map toggles missing');
    for (const button of await toggles.all()) {
      // Clear an intentional hover disclosure before measuring another target.
      // Otherwise scrolling new triggers underneath a stationary pointer opens
      // source links over the unrelated target being measured.
      await page.mouse.move(1, 1);
      await button.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
      const target = await button.evaluate(el => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { height: r.height, left: r.left, top: r.top, scroll: el.scrollWidth,
          width: el.clientWidth, hit: el.contains(hit), covering: hit?.textContent?.slice(0, 80) };
      });
      assert.ok(target.height >= 32 && target.scroll <= target.width && target.hit,
        `unreachable or compressed toggle at ${width}: ${await button.getAttribute('aria-label')} ${JSON.stringify(target)}`);
    }
    await label.scrollIntoViewIfNeeded();
    if ([1440, 1024, 390].includes(width)) await page.screenshot({ path: `/tmp/geo-evidence-controls-${width}.png` });
    const mutant = await page.addStyleTag({ content: '[data-testid="zoom-gates-label"] { color:white !important; }' });
    assert.ok(!await darkCaption(), 'low-contrast mutant not detected');
    await mutant.evaluate(el => el.remove());
  }
  console.log(JSON.stringify(results));
  console.log('Evidence/map-control gate passed: headline visible, all source details preserved, 16 toggles reachable, caption contrast mutant rejected.');
} finally { await browser.close(); }
