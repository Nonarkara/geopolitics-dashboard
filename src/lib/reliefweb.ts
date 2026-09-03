/**
 * Humanitarian desk — keyless sources only.
 * Primary: ReliefWeb RSS (no appname gate).
 * Secondary: HDX CKAN package search.
 */

export interface ReliefWebReport {
  id: string;
  title: string;
  url: string;
  date: string;
  source: string;
  countries: string[];
}

export interface ReliefWebResponse {
  generatedAt: string;
  reports: ReliefWebReport[];
  source: {
    id: string;
    label: string;
    url: string;
    status: "live" | "stale" | "offline";
    age: string;
  };
}

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { payload: ReliefWebResponse; cachedAt: number } | null = null;

const RW_RSS =
  "https://reliefweb.int/updates/rss.xml?search=Thailand%20Myanmar%20OR%20Cambodia%20border%20OR%20Malaysia";
const HDX_SEARCH =
  "https://data.humdata.org/api/3/action/package_search?q=thailand+myanmar+cambodia+displacement+refugee&rows=6";

function parseRssItems(xml: string) {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title =
      block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const source =
      block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "ReliefWeb";
    if (title && link) {
      items.push({
        title: title
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"'),
        link,
        pubDate,
        source,
      });
    }
  }
  return items;
}

async function fetchReliefWebRss(): Promise<ReliefWebReport[]> {
  const response = await fetch(RW_RSS, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "application/rss+xml,application/xml,text/xml" },
  });
  if (!response.ok) throw new Error(`ReliefWeb RSS ${response.status}`);
  const xml = await response.text();
  return parseRssItems(xml)
    .slice(0, 8)
    .map((item, index) => ({
      id: `rw-rss-${index}-${item.link.slice(-24)}`,
      title: item.title,
      url: item.link,
      date: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
      source: item.source,
      countries: [],
    }));
}

async function fetchHdxPackages(): Promise<ReliefWebReport[]> {
  const response = await fetch(HDX_SEARCH, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HDX ${response.status}`);
  const payload = (await response.json()) as {
    success?: boolean;
    result?: { results?: Array<Record<string, unknown>> };
  };
  if (!payload.success) return [];

  const reports: ReliefWebReport[] = [];
  for (const pkg of payload.result?.results ?? []) {
    const title = typeof pkg.title === "string" ? pkg.title : null;
    const name = typeof pkg.name === "string" ? pkg.name : null;
    if (!title || !name) continue;
    const org =
      typeof pkg.organization === "object" &&
      pkg.organization !== null &&
      typeof (pkg.organization as { title?: string }).title === "string"
        ? (pkg.organization as { title: string }).title
        : "HDX";
    reports.push({
      id: `hdx-${name}`,
      title,
      url: `https://data.humdata.org/dataset/${name}`,
      date: new Date().toISOString(),
      source: org,
      countries: [],
    });
  }
  return reports;
}

export async function loadReliefWebReports(): Promise<ReliefWebResponse> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.payload;
  }

  const generatedAt = new Date().toISOString();

  try {
    const [rss, hdx] = await Promise.all([
      fetchReliefWebRss().catch(() => [] as ReliefWebReport[]),
      fetchHdxPackages().catch(() => [] as ReliefWebReport[]),
    ]);
    const seen = new Set<string>();
    const reports: ReliefWebReport[] = [];
    for (const report of [...rss, ...hdx]) {
      if (seen.has(report.url)) continue;
      seen.add(report.url);
      reports.push(report);
    }

    const result: ReliefWebResponse = {
      generatedAt,
      reports: reports.slice(0, 10),
      source: {
        id: "reliefweb-hdx",
        label: "ReliefWeb + HDX",
        url: "https://reliefweb.int",
        status: reports.length > 0 ? "live" : "stale",
        age: generatedAt,
      },
    };
    cache = { payload: result, cachedAt: Date.now() };
    return result;
  } catch {
    return {
      generatedAt,
      reports: [],
      source: {
        id: "reliefweb-hdx",
        label: "ReliefWeb + HDX",
        url: "https://reliefweb.int",
        status: "offline",
        age: generatedAt,
      },
    };
  }
}
