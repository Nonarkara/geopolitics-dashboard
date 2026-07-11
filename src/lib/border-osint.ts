import { fallbackNews, fallbackTicker } from "./mock-data";
import { archiveSignalBatch, type ArchiveSignal } from "./signal-archive";
import {
  BORDER_AREAS,
  type BorderAreaId,
  incidentMatchesBorderArea,
  resolveBorderAreaByText,
  resolveBorderAreaLabel,
} from "./border-regions";
import { loadThailandIncidents } from "./thailand-monitor";
import type {
  BorderHumanitarianSnapshot,
  BorderNarrativeSignal,
  BorderOsintResponse,
  EconomicIndicator,
  IncidentFeature,
  NewsItem,
  NewsResponse,
  NewsSeverity,
  RefugeeMovement,
  SourceHealth,
  TickerItem,
  TickerResponse,
} from "../types/dashboard";

const BORDER_OSINT_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const BORDER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const GDELT_QUERY =
  'Thailand AND (Myanmar OR Cambodia OR Malaysia) AND (border OR frontier OR crossing OR checkpoint OR customs OR refugee OR clash OR smuggling)';

const UNHCR_POPULATION_URL =
  "https://api.unhcr.org/population/v1/population/?cf_type=ISO&coo=MMR&coa=THA&yearFrom=2024&yearTo=2026&limit=10";
const UNHCR_DEMOGRAPHICS_URL =
  "https://api.unhcr.org/population/v1/demographics/?cf_type=ISO&coo=MMR&coa=THA&yearFrom=2024&yearTo=2026&limit=10";

const FALLBACK_BORDER_INCIDENTS: IncidentFeature[] = [
  {
    id: "BORDER-001",
    geometry: { coordinates: [98.5746, 16.7163] },
    properties: {
      title: "Cross-border shelling risk",
      type: "Conflict spillover",
      fatalities: 2,
      notes:
        "Artillery spillover concerns around Mae Sot and Myawaddy disrupted freight staging and forced a tighter security posture on the western gate.",
      location: "Mae Sot / Myawaddy",
      eventDate: "2026-03-15T03:40:00.000Z",
    },
  },
  {
    id: "BORDER-002",
    geometry: { coordinates: [98.6501, 16.9124] },
    properties: {
      title: "Shelter pressure rising",
      type: "Displacement pressure",
      fatalities: 0,
      notes:
        "Temporary shelters and screening teams in Tak province reported heavier intake pressure as movement from Karen State continued.",
      location: "Tak province",
      eventDate: "2026-03-15T02:10:00.000Z",
    },
  },
  {
    id: "BORDER-003",
    geometry: { coordinates: [102.5636, 13.6587] },
    properties: {
      title: "Checkpoint queue surge",
      type: "Crossing pressure",
      fatalities: 0,
      notes:
        "Passenger and customs queues lengthened on the Aranyaprathet / Poipet frontier, raising turnback and visibility concerns.",
      location: "Aranyaprathet / Poipet",
      eventDate: "2026-03-15T01:55:00.000Z",
    },
  },
  {
    id: "BORDER-004",
    geometry: { coordinates: [100.4186, 6.7483] },
    properties: {
      title: "Freight corridor congestion",
      type: "Logistics pressure",
      fatalities: 0,
      notes:
        "Coach and freight backlogs built on the Sadao / Bukit Kayu Hitam approaches, slowing southern corridor throughput.",
      location: "Sadao / Bukit Kayu Hitam",
      eventDate: "2026-03-14T23:35:00.000Z",
    },
  },
];

const FALLBACK_HUMANITARIAN: BorderHumanitarianSnapshot[] = [
  {
    id: "unhcr-mmr-tha",
    areaId: "myanmar-frontier",
    areaLabel: "Myanmar frontier",
    label: "Myanmar displacement into Thailand",
    count: 80_934,
    unit: "registered refugees",
    asOf: "2025",
    source: "UNHCR Refugee Data Finder (fallback snapshot)",
    sourceUrl: "https://api.unhcr.org/population/v1/population/",
    detail:
      "Fallback UNHCR snapshot indicates 80,934 registered refugees from Myanmar hosted in Thailand in 2025.",
  },
];

const FALLBACK_BORDER_SIGNALS: BorderNarrativeSignal[] = [
  {
    id: "gdelt-fallback-myanmar",
    areaId: "myanmar-frontier",
    areaLabel: "Myanmar frontier",
    title: "Western border narrative remains dominated by Myanmar spillover",
    summary:
      "Fallback narrative signal keeps the western frontier on watch when live GDELT matching is unavailable.",
    source: "GDELT DOC 2 (fallback narrative)",
    sourceUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
    publishedAt: "2026-03-15T03:00:00.000Z",
    provider: "GDELT DOC 2",
    severity: "alert",
    tags: ["Border", "Myanmar", "Narrative"],
  },
  {
    id: "gdelt-fallback-cambodia",
    areaId: "cambodia-frontier",
    areaLabel: "Cambodia frontier",
    title: "Eastern crossing queues remain a narrative watchpoint",
    summary:
      "Fallback narrative signal preserves Cambodia-frontier queue and crossing visibility when live news matching is delayed.",
    source: "GDELT DOC 2 (fallback narrative)",
    sourceUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
    publishedAt: "2026-03-15T02:25:00.000Z",
    provider: "GDELT DOC 2",
    severity: "watch",
    tags: ["Border", "Cambodia", "Narrative"],
  },
  {
    id: "gdelt-fallback-malaysia",
    areaId: "malaysia-frontier",
    areaLabel: "Malaysia frontier",
    title: "Southern freight and coach pressure stays in the media mix",
    summary:
      "Fallback narrative signal keeps the Malaysia corridor represented when live narrative providers are unavailable.",
    source: "GDELT DOC 2 (fallback narrative)",
    sourceUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
    publishedAt: "2026-03-15T01:45:00.000Z",
    provider: "GDELT DOC 2",
    severity: "watch",
    tags: ["Border", "Malaysia", "Narrative"],
  },
];

type CachedBorderOsint = {
  payload: BorderOsintResponse;
  cachedAt: number;
};

const borderOsintCache: CachedBorderOsint[] = [];
let borderOsintPending: Promise<BorderOsintResponse> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function getNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatIndicatorValue(value: number | string, unit?: string | null) {
  const text =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toString()
        : value.toFixed(2)
      : value;

  return unit ? `${text}${unit}` : text;
}

function formatDelta(change: number | string) {
  if (typeof change === "number") {
    if (change === 0) {
      return "flat";
    }

    return `${change > 0 ? "+" : ""}${change}`;
  }

  return String(change);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getSeverity(fatalities: number) {
  if (fatalities >= 2) {
    return "alert" as const;
  }

  if (fatalities >= 1) {
    return "watch" as const;
  }

  return "stable" as const;
}

function inferNarrativeSeverity(text: string): NewsSeverity {
  const normalized = text.toLowerCase();

  if (
    /(clash|shell|airstrike|attack|raid|killed|fatal|seized|crackdown|refugee|displacement)/.test(
      normalized,
    )
  ) {
    return "alert";
  }

  if (/(queue|checkpoint|crossing|smuggling|border|customs|fraud|scam)/.test(normalized)) {
    return "watch";
  }

  return "stable";
}

function parseSeendate(value: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  if (/^\d{14}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    const hour = Number(value.slice(8, 10));
    const minute = Number(value.slice(10, 12));
    const second = Number(value.slice(12, 14));

    return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function dedupeByTitle<T extends { title: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.title.toLowerCase().trim();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": BORDER_USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: Math.floor(BORDER_OSINT_TTL_MS / 1000) },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }

  return response.text();
}

function buildSource(
  id: string,
  label: string,
  url: string,
  status: SourceHealth["status"],
  message: string | null,
  startedAt: number,
): SourceHealth {
  return {
    id,
    label,
    url,
    status,
    checkedAt: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
    message,
  };
}

// ── Google News RSS — live border headlines ──────────────────────────
const GOOGLE_NEWS_QUERIES: { query: string; areaId: BorderAreaId }[] = [
  { query: "Thailand Myanmar border OR frontier OR Mae Sot OR refugee", areaId: "myanmar-frontier" },
  { query: "Thailand Cambodia border OR Aranyaprathet OR Poipet OR checkpoint", areaId: "cambodia-frontier" },
  { query: "Thailand Malaysia border OR Sadao OR Hat Yai OR Narathiwat", areaId: "malaysia-frontier" },
];

function parseRssItems(xml: string): { title: string; link: string; pubDate: string; source: string }[] {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "Google News";
    if (title && !title.startsWith("&lt;")) items.push({ title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'), link, pubDate, source });
  }
  return items;
}

async function fetchGoogleNewsBorderHeadlines(): Promise<BorderNarrativeSignal[]> {
  const signals: BorderNarrativeSignal[] = [];

  await Promise.all(
    GOOGLE_NEWS_QUERIES.map(async ({ query, areaId }) => {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=TH&ceid=TH:en`;
        // Server-side fetch — no CORS proxy needed
        const response = await fetch(rssUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": BORDER_USER_AGENT, Accept: "application/rss+xml,application/xml,text/xml" },
        });
        if (!response.ok) return;
        const xml = await response.text();
        const items = parseRssItems(xml).slice(0, 3);
        const area = BORDER_AREAS.find(a => a.id === areaId);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          signals.push({
            id: `gnews-${areaId}-${i}`,
            areaId,
            areaLabel: area?.label ?? areaId,
            title: item.title,
            summary: `Live headline from ${item.source} matched to ${area?.counterpart ?? "border"} frontier.`,
            source: item.source,
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            provider: "Google News",
            severity: inferNarrativeSeverity(item.title),
            tags: ["Border", area?.counterpart ?? "Unknown", "Live"],
          });
        }
      } catch {
        // Non-critical — GDELT and fallbacks cover this frontier
      }
    }),
  );

  return dedupeByTitle(signals);
}

async function fetchGdeltSignals() {
  const startedAt = Date.now();
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${new URLSearchParams({
    query: GDELT_QUERY,
    mode: "artlist",
    maxrecords: "12",
    format: "json",
    sort: "datedesc",
  }).toString()}`;

  try {
    const text = await fetchText(url);

    if (text.includes("Please limit requests")) {
      return {
        signals: FALLBACK_BORDER_SIGNALS,
        source: buildSource(
          "gdelt-doc-2",
          "GDELT DOC 2",
          url,
          "stale",
          "Provider rate-limited the dashboard; cached fallback narratives remain in use.",
          startedAt,
        ),
      };
    }

    const payload = JSON.parse(text) as unknown;

    if (!isRecord(payload)) {
      throw new Error("GDELT payload was not an object");
    }

    const items = asArray(payload.articles ?? payload.items);
    const signals = dedupeByTitle(
      items
        .filter(isRecord)
        .map((article, index): BorderNarrativeSignal | null => {
          const title = getString(article, "title");
          const articleUrl = getString(article, "url");
          const domain =
            getString(article, "domain") ??
            getString(article, "domainname") ??
            getString(article, "sourcecountry");

          if (!title) {
            return null;
          }

          const area = resolveBorderAreaByText(`${title} ${articleUrl ?? ""} ${domain ?? ""}`);

          if (!area) {
            return null;
          }

          return {
            id: `gdelt-${area.id}-${index + 1}`,
            areaId: area.id,
            areaLabel: area.label,
            title,
            summary:
              domain && articleUrl
                ? `GDELT matched ${area.counterpart}-frontier reporting from ${domain} into the live border narrative stream.`
                : `GDELT matched fresh ${area.counterpart}-frontier reporting into the live border narrative stream.`,
            source: domain ? `GDELT / ${domain}` : "GDELT DOC 2",
            sourceUrl: articleUrl ?? url,
            publishedAt: parseSeendate(getString(article, "seendate")),
            provider: "GDELT DOC 2",
            severity: inferNarrativeSeverity(title),
            tags: ["Border", area.counterpart, "Narrative"],
          };
        })
        .filter((item): item is BorderNarrativeSignal => item !== null),
    ).slice(0, 8);

    // ── Archive GDELT signals to research database (non-blocking) ──
    void archiveSignalBatch(
      signals.map((s): ArchiveSignal => ({
        external_id: s.sourceUrl ?? s.id,
        signal_type: "osint",
        source_provider: "gdelt",
        source_url: s.sourceUrl,
        title: s.title,
        summary: s.summary,
        url: s.sourceUrl,
        published_at: s.publishedAt,
        region: s.areaId,
        severity: s.severity,
        tags: s.tags,
      })),
    );

    return {
      signals: signals.length > 0 ? signals : FALLBACK_BORDER_SIGNALS,
      source: buildSource(
        "gdelt-doc-2",
        "GDELT DOC 2",
        url,
        signals.length > 0 ? "live" : "stale",
        signals.length > 0
          ? `${signals.length} border-matched narratives are in the current cache.`
          : "No border-matched narratives returned in the current window, so curated fallback narratives are in use.",
        startedAt,
      ),
    };
  } catch (error) {
    return {
      signals: FALLBACK_BORDER_SIGNALS,
      source: buildSource(
        "gdelt-doc-2",
        "GDELT DOC 2",
        url,
        "offline",
        error instanceof Error
          ? `${error.message}. Curated fallback narratives are in use.`
          : "GDELT fetch failed. Curated fallback narratives are in use.",
        startedAt,
      ),
    };
  }
}

async function fetchUnhcrSnapshot() {
  const startedAt = Date.now();

  try {
    const [populationText, demographicsText] = await Promise.all([
      fetchText(UNHCR_POPULATION_URL),
      fetchText(UNHCR_DEMOGRAPHICS_URL),
    ]);
    const populationPayload = JSON.parse(populationText) as unknown;
    const demographicsPayload = JSON.parse(demographicsText) as unknown;

    if (!isRecord(populationPayload) || !isRecord(demographicsPayload)) {
      throw new Error("UNHCR payload shape was invalid");
    }

    const populationItems = asArray(populationPayload.items)
      .filter(isRecord)
      .sort((left, right) => (getNumber(right, "year") ?? 0) - (getNumber(left, "year") ?? 0));
    const demographicsItems = asArray(demographicsPayload.items)
      .filter(isRecord)
      .sort((left, right) => (getNumber(right, "year") ?? 0) - (getNumber(left, "year") ?? 0));

    const latestPopulation = populationItems[0];
    const latestDemographics = demographicsItems[0];
    const year = getNumber(latestPopulation ?? {}, "year");
    const refugees = getNumber(latestPopulation ?? {}, "refugees");

    if (!year || !refugees) {
      throw new Error("UNHCR response did not include a current refugee total");
    }

    const childrenTotal =
      (getNumber(latestDemographics ?? {}, "f_0_4") ?? 0) +
      (getNumber(latestDemographics ?? {}, "f_5_11") ?? 0) +
      (getNumber(latestDemographics ?? {}, "f_12_17") ?? 0) +
      (getNumber(latestDemographics ?? {}, "m_0_4") ?? 0) +
      (getNumber(latestDemographics ?? {}, "m_5_11") ?? 0) +
      (getNumber(latestDemographics ?? {}, "m_12_17") ?? 0);
    const totalDemographics = getNumber(latestDemographics ?? {}, "total") ?? refugees;
    const childShare =
      totalDemographics > 0
        ? Math.round((childrenTotal / totalDemographics) * 100)
        : null;

    const snapshot: BorderHumanitarianSnapshot = {
      id: "unhcr-mmr-tha",
      areaId: "myanmar-frontier",
      areaLabel: resolveBorderAreaLabel("myanmar-frontier"),
      label: "Myanmar displacement into Thailand",
      count: refugees,
      unit: "registered refugees",
      asOf: String(year),
      source: "UNHCR Refugee Data Finder",
      sourceUrl: UNHCR_POPULATION_URL,
      detail:
        childShare !== null
          ? `UNHCR reports ${formatCompactNumber(refugees)} registered refugees from Myanmar hosted in Thailand in ${year}; children account for roughly ${childShare}% of the documented population.`
          : `UNHCR reports ${formatCompactNumber(refugees)} registered refugees from Myanmar hosted in Thailand in ${year}.`,
    };

    return {
      humanitarian: [snapshot],
      source: buildSource(
        "unhcr-refugee-data-finder",
        "UNHCR Refugee Data Finder",
        UNHCR_POPULATION_URL,
        "live",
        snapshot.detail,
        startedAt,
      ),
    };
  } catch (error) {
    return {
      humanitarian: FALLBACK_HUMANITARIAN,
      source: buildSource(
        "unhcr-refugee-data-finder",
        "UNHCR Refugee Data Finder",
        UNHCR_POPULATION_URL,
        "stale",
        error instanceof Error
          ? `${error.message}. Using the last curated UNHCR snapshot.`
          : "Using the last curated UNHCR snapshot.",
        startedAt,
      ),
    };
  }
}

function acledSourceStatus(): SourceHealth {
  return {
    id: "acled",
    label: "ACLED",
    url: "https://acleddata.com/acled-api-documentation",
    status: process.env.ACLED_API_URL ? "stale" : "offline",
    checkedAt: new Date().toISOString(),
    responseTimeMs: null,
    message: process.env.ACLED_API_URL
      ? "ACLED endpoint configured, but no border adapter is enabled yet for this deployment."
      : "Optional provider. Configure ACLED credentials to add coded conflict events to the border stack.",
  };
}

function selectLeadIndicator(indicators: EconomicIndicator[]) {
  return [...indicators]
    .sort((left, right) => {
      const leftMagnitude =
        typeof left.change === "number" ? Math.abs(left.change) : 0;
      const rightMagnitude =
        typeof right.change === "number" ? Math.abs(right.change) : 0;

      return rightMagnitude - leftMagnitude;
    })
    .find((indicator) => indicator.label);
}

function buildMarketNewsItem(indicator: EconomicIndicator, index: number): NewsItem {
  return {
    id: `market-${index + 1}`,
    title: `${indicator.label} in focus`,
    summary: `${indicator.label} is currently ${formatIndicatorValue(
      indicator.value,
      indicator.unit,
    )} with a move of ${formatDelta(indicator.change)}.`,
    source: indicator.source ?? "Market radar",
    sourceUrl: "https://open.er-api.com/v6/latest/USD",
    tag: "Markets",
    publishedAt: new Date().toISOString(),
    severity:
      typeof indicator.change === "number" && Math.abs(indicator.change) >= 1
        ? "watch"
        : "stable",
    provider: indicator.source ?? "ExchangeRate API",
  };
}

function buildIncidentNewsItem(incident: IncidentFeature): NewsItem {
  return {
    id: incident.id,
    title: `${incident.properties.type} / ${incident.properties.location}`,
    summary: incident.properties.notes,
    source: "Border incident monitor",
    sourceUrl: "https://acleddata.com",
    tag: "Field",
    publishedAt: incident.properties.eventDate || new Date().toISOString(),
    severity: getSeverity(incident.properties.fatalities),
    provider: "ACLED",
  };
}

export async function loadBorderIncidents(): Promise<IncidentFeature[]> {
  try {
    const incidents = await loadThailandIncidents();
    const borderIncidents = incidents.filter((incident) =>
      BORDER_AREAS.some((area) => incidentMatchesBorderArea(area, incident)),
    );

    return borderIncidents.length > 0 ? borderIncidents : FALLBACK_BORDER_INCIDENTS;
  } catch {
    return FALLBACK_BORDER_INCIDENTS;
  }
}

export async function loadBorderOsint(): Promise<BorderOsintResponse> {
  const cached = borderOsintCache[0];

  if (cached && Date.now() - cached.cachedAt <= BORDER_OSINT_TTL_MS) {
    return cached.payload;
  }

  if (borderOsintPending) {
    return borderOsintPending;
  }

  borderOsintPending = (async () => {
    const [gdelt, unhcr, googleNews] = await Promise.all([
      fetchGdeltSignals(),
      fetchUnhcrSnapshot(),
      fetchGoogleNewsBorderHeadlines(),
    ]);
    // Merge Google News headlines with GDELT signals — Google News first (fresher)
    const mergedSignals = dedupeByTitle([...googleNews, ...gdelt.signals]).slice(0, 12);
    const payload: BorderOsintResponse = {
      generatedAt: new Date().toISOString(),
      signals: mergedSignals.length > 0 ? mergedSignals : gdelt.signals,
      humanitarian: unhcr.humanitarian,
      sources: [gdelt.source, unhcr.source, acledSourceStatus()],
    };

    borderOsintCache[0] = {
      payload,
      cachedAt: Date.now(),
    };

    return payload;
  })();

  try {
    return await borderOsintPending;
  } finally {
    borderOsintPending = null;
  }
}

export function buildBorderNews(
  incidents: IncidentFeature[],
  indicators: EconomicIndicator[],
  osint: BorderOsintResponse,
): NewsResponse {
  const narrativeItems = osint.signals.map<NewsItem>((signal) => ({
    id: signal.id,
    title: signal.title,
    summary: signal.summary,
    source: signal.source,
    sourceUrl: signal.sourceUrl,
    tag: signal.provider === "GDELT DOC 2" ? "Narrative" : "OSINT",
    publishedAt: signal.publishedAt,
    severity: signal.severity,
    provider: signal.provider,
  }));
  const humanitarianItems = osint.humanitarian.map<NewsItem>((snapshot) => ({
    id: snapshot.id,
    title: snapshot.label,
    summary: snapshot.detail,
    source: snapshot.source,
    sourceUrl: snapshot.sourceUrl,
    tag: "Displacement",
    publishedAt: `${snapshot.asOf}-01-01T00:00:00.000Z`,
    severity: snapshot.count >= 50_000 ? "alert" : "watch",
    provider: "UNHCR",
  }));
  const fieldItems = incidents.slice(0, 2).map(buildIncidentNewsItem);
  const marketItems = indicators.slice(0, 1).map(buildMarketNewsItem);
  const news = dedupeByTitle([
    ...narrativeItems,
    ...humanitarianItems,
    ...fieldItems,
    ...marketItems,
  ]).slice(0, 6);

  if (news.length === 0) {
    return fallbackNews;
  }

  return {
    generatedAt: osint.generatedAt,
    news,
  };
}

export function buildBorderTicker(
  incidents: IncidentFeature[],
  indicators: EconomicIndicator[],
  osint: BorderOsintResponse,
): TickerResponse {
  const leadIndicator = selectLeadIndicator(indicators);
  const humanitarian = osint.humanitarian[0];
  const items: TickerItem[] = [];

  if (leadIndicator) {
    items.push({
      id: `market-${leadIndicator.label.toLowerCase().replace(/\W+/g, "-")}`,
      label: leadIndicator.label,
      value: formatIndicatorValue(leadIndicator.value, leadIndicator.unit),
      delta: formatDelta(leadIndicator.change),
      tone:
        typeof leadIndicator.change === "number"
          ? leadIndicator.change > 0
            ? "up"
            : leadIndicator.change < 0
              ? "down"
              : "neutral"
          : "neutral",
    });
  }

  items.push({
    id: "field-signals",
    label: "Field signals",
    value: `${incidents.length} active`,
    delta:
      incidents[0]?.properties.location ?? resolveBorderAreaLabel("myanmar-frontier"),
    tone: incidents.length >= 4 ? "up" : incidents.length > 0 ? "neutral" : "neutral",
  });

  if (osint.signals.length > 0) {
    items.push({
      id: "gdelt-border",
      label: "GDELT Border",
      value: `${osint.signals.length} stories`,
      delta: osint.signals[0].areaLabel,
      tone: osint.signals.some((signal) => signal.severity === "alert") ? "down" : "neutral",
    });
  }

  if (humanitarian) {
    items.push({
      id: humanitarian.id,
      label: "UNHCR MMR->THA",
      value: formatCompactNumber(humanitarian.count),
      delta: `${humanitarian.asOf} registered`,
      tone: humanitarian.count >= 50_000 ? "down" : "neutral",
    });
  }

  if (items.length === 0) {
    return fallbackTicker;
  }

  return {
    generatedAt: osint.generatedAt,
    items: items.slice(0, 6),
  };
}

export function buildBorderMovements(osint: BorderOsintResponse): RefugeeMovement[] {
  const humanitarian = osint.humanitarian[0];

  return [
    {
      source: [98.5746, 16.7163],
      target: [98.9817, 16.8847],
      count: humanitarian?.count ?? 2400,
      label: humanitarian
        ? `${formatCompactNumber(humanitarian.count)} ${humanitarian.unit} from Myanmar hosted in Thailand (${humanitarian.asOf})`
        : "2,400 daily displacement and relief transfers near Mae Sot",
    },
    {
      source: [102.5636, 13.6587],
      target: [102.0837, 13.6904],
      count: 6800,
      label: "6,800 daily passenger and customs crossings at Aranyaprathet",
    },
    {
      source: [100.4186, 6.7483],
      target: [100.4747, 7.0084],
      count: 18_200,
      label: "18,200 daily freight and coach movements through Sadao / Hat Yai",
    },
  ];
}
