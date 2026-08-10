/**
 * OpenSanctions watchlist hits for Myanmar / Cambodia / Malaysia border trade.
 * Free public API — https://www.opensanctions.org/docs/api/
 */

export interface SanctionHit {
  id: string;
  name: string;
  schema: string;
  countries: string[];
  topics: string[];
  dataset: string;
  url: string;
}

export interface SanctionsResponse {
  generatedAt: string;
  hits: SanctionHit[];
  source: {
    id: string;
    label: string;
    url: string;
    status: "live" | "stale" | "offline";
    age: string;
  };
}

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { payload: SanctionsResponse; cachedAt: number } | null = null;

const QUERIES = ["Myanmar junta", "Cambodia casino", "Malaysia trafficking"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

async function searchOpenSanctions(query: string): Promise<SanctionHit[]> {
  const url = `https://api.opensanctions.org/search/default?q=${encodeURIComponent(query)}&limit=4`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OpenSanctions ${response.status}`);
  }

  const payload = (await response.json()) as { results?: unknown[] };
  const hits: SanctionHit[] = [];

  for (const row of payload.results ?? []) {
    const record = asRecord(row);
    if (!record) continue;
    const id = typeof record.id === "string" ? record.id : null;
    const caption =
      typeof record.caption === "string"
        ? record.caption
        : typeof record.name === "string"
          ? record.name
          : null;
    if (!id || !caption) continue;

    const properties = asRecord(record.properties);
    const countries = Array.isArray(properties?.country)
      ? properties.country.filter((c): c is string => typeof c === "string")
      : [];
    const topics = Array.isArray(properties?.topics)
      ? properties.topics.filter((t): t is string => typeof t === "string")
      : Array.isArray(record.datasets)
        ? []
        : [];
    const datasets = Array.isArray(record.datasets)
      ? record.datasets.filter((d): d is string => typeof d === "string")
      : [];

    hits.push({
      id,
      name: caption,
      schema: typeof record.schema === "string" ? record.schema : "Entity",
      countries,
      topics: topics.slice(0, 4),
      dataset: datasets[0] ?? "opensanctions",
      url: `https://www.opensanctions.org/entities/${encodeURIComponent(id)}/`,
    });
  }

  return hits;
}

export async function loadOpenSanctionsWatch(): Promise<SanctionsResponse> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.payload;
  }

  const generatedAt = new Date().toISOString();

  try {
    const batches = await Promise.all(
      QUERIES.map((query) => searchOpenSanctions(query).catch(() => [])),
    );
    const seen = new Set<string>();
    const hits: SanctionHit[] = [];
    for (const batch of batches) {
      for (const hit of batch) {
        if (seen.has(hit.id)) continue;
        seen.add(hit.id);
        hits.push(hit);
      }
    }

    const result: SanctionsResponse = {
      generatedAt,
      hits: hits.slice(0, 10),
      source: {
        id: "opensanctions",
        label: "OpenSanctions",
        url: "https://www.opensanctions.org",
        status: hits.length > 0 ? "live" : "stale",
        age: generatedAt,
      },
    };
    cache = { payload: result, cachedAt: Date.now() };
    return result;
  } catch {
    return {
      generatedAt,
      hits: [],
      source: {
        id: "opensanctions",
        label: "OpenSanctions",
        url: "https://www.opensanctions.org",
        status: "offline",
        age: generatedAt,
      },
    };
  }
}
