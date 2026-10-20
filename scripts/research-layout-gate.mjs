import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const baseURL = process.env.LAYOUT_URL ?? 'http://127.0.0.1:3027';
const browser = await chromium.launch({ headless: true, args: ['--disable-webgl'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
page.setDefaultTimeout(90_000);
const failures = [];
const stamp = '2026-10-21T06:00:00Z';

// Controlled short content makes stretched geometry and first-result displacement measurable.
await page.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  let payload = [];
  if (path === '/api/research/signals') payload = { total: 1, signals: [{
    external_id: 'layout-proof', title: 'Myanmar flood access report',
    summary: 'River access remains restricted at the reported crossing.',
    source_provider: 'ReliefWeb', signal_type: 'humanitarian',
    published_at: stamp, url: 'https://reliefweb.int/', region: 'myanmar-frontier',
  }] };
  if (path === '/api/sources') payload = { generatedAt: stamp, sources: [] };
  if (path === '/api/copernicus/preview') payload = { focusDate: '2026-10-19', imagerySources: [] };
  if (path === '/api/open-intel/regional') payload = { status: 'live', orbitals: [], maritimePoints: [] };
  await route.fulfill({ json: payload });
});

async function geometry() {
  return page.evaluate(() => {
    const dialog = document.querySelector('[aria-labelledby="research-title"]');
    const article = dialog.querySelector('article');
    const filters = dialog.querySelector('form');
    const rect = dialog.getBoundingClientRect();
    return {
      width: innerWidth, bottom: rect.bottom, top: rect.top, height: rect.height,
      overflow: dialog.scrollWidth > dialog.clientWidth,
      articleTop: article.getBoundingClientRect().top - rect.top,
      filtersHeight: filters.getBoundingClientRect().height,
      tabs: [...dialog.querySelectorAll('nav button')].map((button) => {
        const r = button.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { name: button.textContent.trim(), hit: button.contains(hit), left: r.left, right: r.right };
      }),
    };
  });
}

function check(g) {
  assert.ok(!g.overflow, `dialog horizontal overflow at ${g.width}`);
  assert.ok(g.articleTop < 360, `first evidence is ${g.articleTop}px below dialog top at ${g.width}`);
  assert.ok(g.height < 700, `one report stretches dialog to ${g.height}px at ${g.width}`);
  assert.ok(g.filtersHeight < 200, `filters occupy ${g.filtersHeight}px at ${g.width}`);
  for (const tab of g.tabs) assert.ok(tab.hit && tab.left >= 0 && tab.right <= g.width, `unreachable ${tab.name} at ${g.width}`);
}

try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const button = page.getByRole('button', { name: 'Research', exact: true });
    await button.click();
    await page.getByText('Myanmar flood access report', { exact: true }).waitFor();
    check(await geometry());
    await page.screenshot({ path: `/tmp/geo-after-${width}.png` });
    await page.keyboard.press('Escape');
  }
  // Sweep the widths between the usual screenshots; verify the actual hit target.
  for (let width = 320; width <= 1440; width += 8) {
    await page.setViewportSize({ width, height: 900 });
    const button = page.getByRole('button', { name: 'Research', exact: true });
    assert.ok(await button.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), `Research unreachable at ${width}`);
  }
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  for (let width = 320; width <= 1440; width += 8) {
    await page.setViewportSize({ width, height: 900 });
    check(await geometry());
  }
  await page.route('**/api/sources', (route) => route.fulfill({ status: 503, json: { error: 'fixture outage' } }));
  await page.getByRole('button', { name: 'Refresh research', exact: true }).click();
  const sourceCounter = page.locator('.research-counts > div').filter({ hasText: 'Sources' });
  await sourceCounter.getByText('unavailable', { exact: true }).waitFor();
  assert.ok(!(await sourceCounter.innerText()).includes('0'), 'failed source probe is displayed as zero');
  let releaseOrbitals;
  const orbitalWait = new Promise((resolve) => { releaseOrbitals = resolve; });
  await page.route('**/api/open-intel/regional', async (route) => {
    await orbitalWait;
    await route.fulfill({ json: { status: 'live', orbitals: [], maritimePoints: [] } });
  });
  await page.getByRole('button', { name: 'Refresh research', exact: true }).click();
  await page.getByRole('button', { name: 'Satellite desk', exact: true }).click();
  assert.equal(await page.locator('.research-body aside strong').textContent(), 'checking');
  assert.deepEqual(await page.locator('.research-body aside dd').allTextContents(), ['…', '…']);
  releaseOrbitals();
  await page.waitForFunction(() => document.querySelector('.research-body aside strong')?.textContent === 'live');
  await page.getByRole('button', { name: 'Evidence desk', exact: true }).click();
  // Kill the old full-height-dialog defect with the same rendered check.
  await page.addStyleTag({ content: '.research-workbench { height:94dvh !important; }' });
  try { check(await geometry()); } catch { failures.push('full-height mutant'); }
  assert.ok(failures.includes('full-height mutant'), 'old stretched-dialog defect survived');
  console.log('Research geometry: 3 screenshots, 141 widths, stretched-dialog mutant rejected.');
} finally {
  await browser.close();
}
