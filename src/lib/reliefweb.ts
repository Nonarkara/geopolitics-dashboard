/**
 * ReliefWeb / HDX-style humanitarian headlines for Thailand border theatres.
 * Free public API — no key. https://apidoc.rwlabs.org/
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export async function loadReliefWebReports(): Promise<ReliefWebResponse> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.payload;
  }

  const generatedAt = new Date().toISOString();
  const url = "https://api.reliefweb.int/v1/reports?appname=geopolitics-dashboard&limit=8";

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          operator: "AND",
          conditions: [
            {
              field: "country.iso3",
              value: ["THA", "MMR", "KHM", "MYS"],
              operator: "OR",
            },
            {
              field: "date.created",
              value: {
                from: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10),
              },
            },
          ],
        },
        fields: {
          include: ["title", "url", "date", "source", "country"],
        },
        sort: ["date.created:desc"],
        limit: 8,
      }),
    });

    if (!response.ok) {
      throw new Error(`ReliefWeb ${response.status}`);
    }

    const payload = (await response.json()) as { data?: unknown[] };
    const reports: ReliefWebReport[] = [];

    for (const row of payload.data ?? []) {
      const record = asRecord(row);
      const fields = asRecord(record?.fields);
      if (!fields) continue;

      const id = String(record?.id ?? fields.title ?? Math.random());
      const title = typeof fields.title === "string" ? fields.title : null;
      const link = typeof fields.url === "string" ? fields.url : null;
      if (!title || !link) continue;

      const dateField = asRecord(fields.date);
      const created =
        (typeof dateField?.created === "string" && dateField.created) ||
        (typeof dateField?.original === "string" && dateField.original) ||
        generatedAt;

      const sources = Array.isArray(fields.source) ? fields.source : [];
      const sourceName =
        sources
          .map((entry) => asRecord(entry)?.name)
          .find((name): name is string => typeof name === "string") ?? "ReliefWeb";

      const countries = Array.isArray(fields.country)
        ? fields.country
            .map((entry) => asRecord(entry)?.name)
            .filter((name): name is string => typeof name === "string")
        : [];

      reports.push({
        id: `rw-${id}`,
        title,
        url: link,
        date: created,
        source: sourceName,
        countries,
      });
    }

    const result: ReliefWebResponse = {
      generatedAt,
      reports,
      source: {
        id: "reliefweb",
        label: "ReliefWeb",
        url: "https://reliefweb.int",
        status: reports.length > 0 ? "live" : "stale",
        age: generatedAt,
      },
    };
    cache = { payload: result, cachedAt: Date.now() };
    return result;
  } catch {
    const result: ReliefWebResponse = {
      generatedAt,
      reports: [],
      source: {
        id: "reliefweb",
        label: "ReliefWeb",
        url: "https://reliefweb.int",
        status: "offline",
        age: generatedAt,
      },
    };
    return result;
  }
}
