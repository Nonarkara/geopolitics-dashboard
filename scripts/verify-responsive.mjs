// Ad-hoc verification: does the new responsive layout actually work at
// iPad portrait, iPad landscape, foldable-unfolded, and foldable-folded
// widths against the live geo.nonarkara.org?
import { chromium } from "playwright";

const URL = "https://geo.nonarkara.org/";

const viewports = [
  { name: "iPhone-SE",          width: 375,  height: 667,  expect: { sidebar: false, status: false, drawerButton: true  } },
  { name: "Galaxy-Z-Fold-cover", width: 412, height: 915, expect: { sidebar: false, status: false, drawerButton: true  } },
  { name: "Galaxy-Z-Fold-main",  width: 725, height: 925, expect: { sidebar: true,  status: true,  drawerButton: false } },
  { name: "iPad-mini-portrait",  width: 744, height: 1133, expect: { sidebar: true,  status: true,  drawerButton: false } },
  { name: "iPad-portrait",       width: 834, height: 1194, expect: { sidebar: true,  status: true,  drawerButton: false } },
  { name: "iPad-landscape",      width: 1194, height: 834, expect: { sidebar: true,  status: true,  drawerButton: false } },
  { name: "iPad-Pro-12.9",       width: 1024, height: 1366, expect: { sidebar: true,  status: true,  drawerButton: false } },
];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const results = [];

for (const vp of viewports) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    // Give the dynamic-imported BorderDashboard + Sidebar a moment to mount.
    await page.waitForTimeout(2500);

    // The aside uses md:flex (≥768px) with w-[240px] (md) or w-[320px] (lg+).
    const sidebarVisible = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      if (!aside) return false;
      const r = aside.getBoundingClientRect();
      const cs = getComputedStyle(aside);
      return cs.display !== "none" && r.width > 0;
    });
    // The BorderStatusStrip wrapper uses `hidden min-[744px]:block md:block`.
    // Below the threshold, the wrapper itself is hidden. So check for any
    // rendered `<section>` inside the dashboard that is wider than 0 — the
    // BorderStatusStrip is the only section rendered at the very bottom of
    // the BorderDashboard.
    const statusVisible = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll("section"));
      // Find the bottommost visible section (highest y position).
      let candidate = null;
      let maxY = -Infinity;
      for (const s of sections) {
        if (getComputedStyle(s).display === "none") continue;
        const r = s.getBoundingClientRect();
        if (r.width < 100) continue; // skip tiny badges
        if (r.y > maxY) { maxY = r.y; candidate = s; }
      }
      return candidate ? candidate.getBoundingClientRect().width > 0 : false;
    });
    // The "Intel" mobile button is md:hidden.
    const drawerButtonVisible = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const intel = btns.find((b) => b.textContent?.trim().startsWith("Intel"));
      if (!intel) return false;
      return getComputedStyle(intel).display !== "none";
    });

    const sidebarOk = sidebarVisible === vp.expect.sidebar;
    const statusOk = statusVisible === vp.expect.status;
    const drawerOk = drawerButtonVisible === vp.expect.drawerButton;
    const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    results.push({
      name: vp.name,
      width: vp.width,
      pass: sidebarOk && statusOk && drawerOk && noHorizontalScroll,
      sidebar: { actual: sidebarVisible, expected: vp.expect.sidebar, ok: sidebarOk },
      status:  { actual: statusVisible,  expected: vp.expect.status,  ok: statusOk  },
      drawer:  { actual: drawerButtonVisible, expected: vp.expect.drawerButton, ok: drawerOk },
      noHscroll: noHorizontalScroll,
      jsErrors: errs,
    });

    await page.screenshot({ path: `/tmp/geo-vp-${vp.name}.png`, fullPage: false });
  } catch (e) {
    results.push({ name: vp.name, width: vp.width, pass: false, error: String(e), jsErrors: errs });
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
