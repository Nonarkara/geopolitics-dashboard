import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.LAYOUT_URL ?? 'http://127.0.0.1:8899';
const browser = await chromium.launch();
const page = await browser.newPage({ serviceWorkers: 'block' });
page.setDefaultTimeout(60000);
const measurements = [];
try {
  for (const width of [1440, 1280, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width < 744 ? 844 : 900 });
    await page.goto(`${base}/research`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.locator('#reference-1').getAttribute('value'), '1');
    assert.equal(await page.locator('#reference-12').getAttribute('value'), '12');
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      width: innerWidth,
      navigation: document.querySelector('.publication-navigation').getBoundingClientRect().height,
      bodyFont: getComputedStyle(document.querySelector('article')).fontFamily,
      titleBottom: document.querySelector('h1').getBoundingClientRect().bottom,
    }));
    assert.ok(geometry.scrollWidth <= width + 1, `horizontal overflow at ${width}`);
    assert.ok(geometry.titleBottom < (width < 744 ? 844 : 900), `title below first screen at ${width}`);
    const lineLengths = await page.locator('article section p').first().evaluate(el => {
      const lines = new Map();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        for (let i = 0; i < node.textContent.length; i++) {
          const range = document.createRange();
          range.setStart(node, i); range.setEnd(node, i + 1);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0) lines.set(rect.top, (lines.get(rect.top) ?? 0) + 1);
        }
      }
      return [...lines.values()];
    });
    assert.ok(Math.max(...lineLengths) <= 75, `prose lines too long at ${width}: ${lineLengths}`);
    await page.locator('.publication-contents summary').click();
    await page.getByRole('link', { name: 'References and access ledger', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#references');
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('.publication-contents summary').click();
    await page.screenshot({ path: `/tmp/geo-publication-first-${width}.png` });
    await page.screenshot({ path: `/tmp/geo-publication-${width}.png`, fullPage: true });
    measurements.push({ width, ...geometry, lineLengths });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/research`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'enlarged text overflow');
  await page.screenshot({ path: '/tmp/geo-publication-390-enlarged.png', fullPage: true });
  await page.screenshot({ path: '/tmp/geo-publication-390-enlarged-first.png' });
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.publication-deck').evaluate(el => getComputedStyle(el).color), 'rgb(0, 0, 0)', 'print subtitle must remain legible');
  await page.pdf({ path: '/tmp/geo-publication.pdf', format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.route('**/*.{woff,woff2}', route => route.abort());
  await page.goto(`${base}/research`, { waitUntil: 'networkidle' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fallback-font overflow');
  await page.getByRole('link', { name: 'Evidence', exact: true }).click();
  await page.getByRole('dialog', { name: 'Research Workbench' }).waitFor();
  await page.getByRole('button', { name: 'Close research workbench' }).click();
  assert.equal(await page.getByRole('dialog', { name: 'Research Workbench' }).count(), 0);
  console.log(JSON.stringify(measurements));
} finally { await browser.close(); }
