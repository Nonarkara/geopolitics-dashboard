/**
 * Sanctions watch for Myanmar / Cambodia / Malaysia.
 * Keyless path: OpenSanctions US OFAC SDN simple CSV (cached),
 * filtered to mm / kh / my country codes.
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

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const OFAC_CSV =
  "https://data.opensanctions.org/datasets/latest/us_ofac_sdn/targets.simple.csv";
const BORDER_COUNTRIES = new Set(["mm", "kh", "my"]);

let cache: { payload: SanctionsResponse; cachedAt: number } | null = null;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

function parseOfacCsv(text: string): SanctionHit[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const idx = {
    id: header.indexOf("id"),
    schema: header.indexOf("schema"),
    name: header.indexOf("name"),
    countries: header.indexOf("countries"),
    sanctions: header.indexOf("sanctions"),
    dataset: header.indexOf("dataset"),
  };

  const hits: SanctionHit[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const countries = (cols[idx.countries] ?? "")
      .split(";")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (!countries.some((c) => BORDER_COUNTRIES.has(c))) continue;

    const id = cols[idx.id];
    const name = cols[idx.name];
    if (!id || !name) continue;

    hits.push({
      id,
      name,
      schema: cols[idx.schema] || "Entity",
      countries,
      topics: (cols[idx.sanctions] ?? "")
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3),
      dataset: cols[idx.dataset] || "US OFAC SDN",
      url: `https://www.opensanctions.org/entities/${encodeURIComponent(id)}/`,
    });

    if (hits.length >= 12) break;
  }
  return hits;
}

export async function loadOpenSanctionsWatch(): Promise<SanctionsResponse> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.payload;
  }

  const generatedAt = new Date().toISOString();

  try {
    const response = await fetch(OFAC_CSV, {
      signal: AbortSignal.timeout(45_000),
      headers: { Accept: "text/csv" },
    });
    if (!response.ok) throw new Error(`OFAC CSV ${response.status}`);
    const text = await response.text();
    const hits = parseOfacCsv(text);

    const result: SanctionsResponse = {
      generatedAt,
      hits,
      source: {
        id: "opensanctions-ofac",
        label: "OpenSanctions / OFAC SDN",
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
        id: "opensanctions-ofac",
        label: "OpenSanctions / OFAC SDN",
        url: "https://www.opensanctions.org",
        status: "offline",
        age: generatedAt,
      },
    };
  }
}
