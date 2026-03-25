/**
 * Signal Archive — permanent research database for all border intelligence signals.
 *
 * Every news headline, OSINT report, seismic event, traffic incident, disaster alert,
 * commodity price update, and humanitarian snapshot is archived here so that nothing
 * gets lost. Designed for long-term trend analysis of Thailand's three border regions.
 */

import { query, isDatabaseConfigured } from "./db";
import { BORDER_AREAS, type BorderAreaId } from "./border-regions";
import { getSupabase } from "./supabase";

/* ── Types ──────────────────────────────────────────────── */

export type SignalType =
  | "news"
  | "incident"
  | "humanitarian"
  | "market"
  | "weather"
  | "thermal"
  | "movement"
  | "osint"
  | "seismic"
  | "traffic"
  | "disaster"
  | "commodity";

export interface ArchiveSignal {
  external_id?: string;
  signal_type: SignalType;
  source_provider: string;
  source_url?: string;
  title: string;
  summary?: string;
  url?: string;
  published_at: string; // ISO timestamp
  region?: string;
  country_focus?: string[];
  severity?: string;
  score?: number;
  fatalities?: number;
  keywords?: string[];
  tags?: unknown[];
  payload?: Record<string, unknown>;
  lat?: number;
  lng?: number;
}

/* ── Region Classifier ──────────────────────────────────── */

const REGION_KEYWORD_MAP: Record<string, string[]> = {};
for (const area of BORDER_AREAS) {
  REGION_KEYWORD_MAP[area.id] = area.aliases;
}

/**
 * Auto-classify which border region a signal belongs to.
 * Uses keyword matching against title + summary, and coordinate bounding if available.
 */
export function classifyRegion(
  text: string,
  coords?: { lat: number; lng: number },
): string | null {
  const lower = text.toLowerCase();

  // Keyword match
  for (const [regionId, aliases] of Object.entries(REGION_KEYWORD_MAP)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) return regionId;
    }
  }

  // Coordinate-based classification
  if (coords) {
    for (const area of BORDER_AREAS) {
      const [cx, cy] = area.center; // [lng, lat]
      const dx = (coords.lng - cx) * 111; // rough km
      const dy = (coords.lat - cy) * 111;
      if (Math.sqrt(dx * dx + dy * dy) <= area.radiusKm) return area.id;
    }
  }

  // Default: check for broad Thailand/border references
  if (lower.includes("thailand") && (lower.includes("border") || lower.includes("frontier"))) {
    return "general";
  }

  return null;
}

/* ── Keyword Extractor ──────────────────────────────────── */

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "with", "from", "by", "as", "this", "that", "it",
  "has", "have", "had", "be", "been", "not", "no", "will", "would", "could",
  "should", "may", "can", "do", "does", "did", "its", "their", "they", "them",
  "he", "she", "his", "her", "we", "our", "you", "your", "than", "more",
  "also", "about", "after", "before", "over", "under", "between", "into",
  "said", "says", "new", "all", "some", "other", "who", "what", "when",
  "where", "how", "which", "been", "being", "very", "just", "than",
]);

/**
 * Extract meaningful keywords from title + summary for full-text search.
 */
export function extractKeywords(title: string, summary?: string): string[] {
  const text = `${title} ${summary ?? ""}`.toLowerCase();
  const words = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Deduplicate and return top 20
  return [...new Set(words)].slice(0, 20);
}

/* ── Country Focus Classifier ───────────────────────────── */

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  TH: ["thailand", "thai", "bangkok", "phuket"],
  MM: ["myanmar", "burma", "burmese", "myawaddy", "naypyidaw", "yangon", "karen", "kayin"],
  KH: ["cambodia", "cambodian", "khmer", "phnom penh", "poipet", "siem reap"],
  MY: ["malaysia", "malaysian", "kuala lumpur", "kelantan", "johor"],
  LA: ["laos", "lao", "vientiane"],
  VN: ["vietnam", "vietnamese", "hanoi"],
};

export function classifyCountries(text: string): string[] {
  const lower = text.toLowerCase();
  const countries: string[] = [];
  for (const [code, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) countries.push(code);
  }
  return countries;
}

/* ── Archive Functions ──────────────────────────────────── */

/**
 * Archive a single signal to PostgreSQL. Silently no-ops if DB not configured.
 * Uses ON CONFLICT to deduplicate by (source_provider, external_id).
 */
export async function archiveSignal(signal: ArchiveSignal): Promise<void> {
  const text = `${signal.title} ${signal.summary ?? ""}`;
  const region = signal.region ?? classifyRegion(text, signal.lat && signal.lng ? { lat: signal.lat, lng: signal.lng } : undefined);
  const keywords = signal.keywords ?? extractKeywords(signal.title, signal.summary);
  const countryFocus = signal.country_focus ?? classifyCountries(text);

  // Always mirror to Supabase (non-blocking, works without PostgreSQL)
  void mirrorToSupabase(signal, region, keywords, countryFocus);

  // PostgreSQL archival (requires DATABASE_URL)
  if (!isDatabaseConfigured) return;

  try {
    await query(
      `INSERT INTO signal_archive (
        external_id, signal_type, source_provider, source_url,
        title, summary, url, published_at, region, country_focus,
        severity, score, fatalities, keywords, tags, payload, geom
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16,
        CASE WHEN $17::float IS NOT NULL AND $18::float IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($18, $17), 4326) ELSE NULL END
      ) ON CONFLICT (source_provider, external_id)
        WHERE external_id IS NOT NULL
        DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          severity = EXCLUDED.severity,
          score = EXCLUDED.score,
          keywords = EXCLUDED.keywords,
          payload = EXCLUDED.payload`,
      [
        signal.external_id ?? null,
        signal.signal_type,
        signal.source_provider,
        signal.source_url ?? null,
        signal.title,
        signal.summary ?? null,
        signal.url ?? null,
        signal.published_at,
        region,
        countryFocus,
        signal.severity ?? null,
        signal.score ?? null,
        signal.fatalities ?? null,
        keywords,
        JSON.stringify(signal.tags ?? []),
        signal.payload ? JSON.stringify(signal.payload) : null,
        signal.lat ?? null,
        signal.lng ?? null,
      ],
    );
  } catch {
    // Non-critical: don't break the dashboard if archiving fails
  }
}

/**
 * Archive a batch of signals efficiently.
 */
export async function archiveSignalBatch(signals: ArchiveSignal[]): Promise<void> {
  if (signals.length === 0) return;

  // Process in parallel with concurrency limit
  const BATCH_SIZE = 10;
  for (let i = 0; i < signals.length; i += BATCH_SIZE) {
    const batch = signals.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((s) => archiveSignal(s)));
  }
}

/** Mirror a signal to Supabase for Realtime subscriptions. */
async function mirrorToSupabase(
  signal: ArchiveSignal,
  region: string | null,
  keywords: string[],
  countryFocus: string[],
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const row = {
      external_id: signal.external_id ?? null,
      signal_type: signal.signal_type,
      source_provider: signal.source_provider,
      source_url: signal.source_url ?? null,
      title: signal.title,
      summary: signal.summary ?? null,
      url: signal.url ?? null,
      published_at: signal.published_at,
      region,
      country_focus: countryFocus,
      severity: signal.severity ?? null,
      score: signal.score ?? null,
      fatalities: signal.fatalities ?? null,
      keywords,
      tags: signal.tags ?? [],
      payload: signal.payload ?? null,
    };

    // Plain insert — duplicates will fail on the unique index and that's fine
    const { error } = await sb.from("signal_archive").insert(row);
    if (error && !error.message.includes("duplicate")) {
      // Unexpected error — log but don't break the dashboard
    }
  } catch {
    /* non-critical */
  }
}

/* ── Research Query Helpers ──────────────────────────────── */

export interface SignalQueryParams {
  region?: string;
  signal_type?: string;
  source_provider?: string;
  from?: string;
  to?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface SignalQueryResult {
  signals: ArchiveSignal[];
  total: number;
}

export async function querySignals(params: SignalQueryParams): Promise<SignalQueryResult> {
  if (!isDatabaseConfigured) return { signals: [], total: 0 };

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.region) {
    conditions.push(`region = $${idx++}`);
    values.push(params.region);
  }
  if (params.signal_type) {
    conditions.push(`signal_type = $${idx++}`);
    values.push(params.signal_type);
  }
  if (params.source_provider) {
    conditions.push(`source_provider = $${idx++}`);
    values.push(params.source_provider);
  }
  if (params.from) {
    conditions.push(`published_at >= $${idx++}`);
    values.push(params.from);
  }
  if (params.to) {
    conditions.push(`published_at <= $${idx++}`);
    values.push(params.to);
  }
  if (params.keyword) {
    conditions.push(`$${idx++} = ANY(keywords)`);
    values.push(params.keyword.toLowerCase());
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(params.limit ?? 50, 200);
  const offset = params.offset ?? 0;

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM signal_archive ${where}`, values),
      query<ArchiveSignal>(
        `SELECT id, external_id, signal_type, source_provider, source_url,
                title, summary, url, published_at, ingested_at, region,
                country_focus, severity, score, fatalities, keywords, tags
         FROM signal_archive ${where}
         ORDER BY published_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        values,
      ),
    ]);

    return {
      signals: dataResult.rows,
      total: parseInt(countResult.rows[0]?.count ?? "0", 10),
    };
  } catch {
    return { signals: [], total: 0 };
  }
}

export interface TrendPoint {
  summary_date: string;
  region: string;
  signal_type: string;
  signal_count: number;
  avg_severity: number | null;
  top_keywords: string[];
  fatality_total: number;
  source_breakdown: Record<string, number>;
}

export async function queryTrends(params: {
  region?: string;
  from?: string;
  to?: string;
}): Promise<TrendPoint[]> {
  if (!isDatabaseConfigured) return [];

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.region) {
    conditions.push(`region = $${idx++}`);
    values.push(params.region);
  }
  if (params.from) {
    conditions.push(`summary_date >= $${idx++}`);
    values.push(params.from);
  }
  if (params.to) {
    conditions.push(`summary_date <= $${idx++}`);
    values.push(params.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query<TrendPoint>(
      `SELECT summary_date, region, signal_type, signal_count,
              avg_severity, top_keywords, fatality_total, source_breakdown
       FROM signal_daily_summary ${where}
       ORDER BY summary_date DESC
       LIMIT 365`,
      values,
    );
    return result.rows;
  } catch {
    return [];
  }
}
