/**
 * Signal Archive — permanent research database for all border intelligence signals.
 *
 * Every news headline, OSINT report, seismic event, traffic incident, disaster alert,
 * commodity price update, and humanitarian snapshot is archived here so that nothing
 * gets lost. Designed for long-term trend analysis of Thailand's three border regions.
 */

import { query, isDatabaseConfigured } from "./db";
import { BORDER_AREAS, type BorderAreaId } from "./border-regions";
import { getServiceSupabase, getSupabase } from "./supabase-server";

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
  | "commodity"
  | "political"
  | "diplomatic"
  | "military"
  | "gkg"
  | "maritime";

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
 * Archive a single signal to Supabase (single source of truth).
 * Uses ON CONFLICT to deduplicate by (source_provider, external_id).
 * PostGIS geometry is created via raw SQL for coordinate-bearing signals.
 */
export async function archiveSignal(signal: ArchiveSignal): Promise<void> {
  const text = `${signal.title} ${signal.summary ?? ""}`;
  const region = signal.region ?? classifyRegion(text, signal.lat && signal.lng ? { lat: signal.lat, lng: signal.lng } : undefined);
  const keywords = signal.keywords ?? extractKeywords(signal.title, signal.summary);
  const countryFocus = signal.country_focus ?? classifyCountries(text);

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

/* ── Research Query Helpers ──────────────────────────────── */

export interface SignalQueryParams {
  region?: string;
  signal_type?: string;
  source_provider?: string;
  from?: string;
  to?: string;
  keyword?: string;
  search?: string; // full-text search query
  limit?: number;
  offset?: number;
}

export interface SignalQueryResult {
  signals: ArchiveSignal[];
  total: number;
}

export async function querySignals(params: SignalQueryParams): Promise<SignalQueryResult> {
  if (!isDatabaseConfigured) return { signals: [], total: 0 };

  const limit = Math.min(params.limit ?? 50, 200);
  const offset = params.offset ?? 0;

  // Use full-text search function if search query is provided
  if (params.search) {
    try {
      const result = await query<ArchiveSignal & { rank: number; total_count: string }>(
        `SELECT * FROM fn_search_signals($1, $2, $3, $4, $5, $6, $7)`,
        [
          params.search,
          params.region ?? null,
          params.signal_type ?? null,
          params.from ?? null,
          params.to ?? null,
          limit,
          offset,
        ],
      );

      return {
        signals: result.rows,
        total: parseInt(result.rows[0]?.total_count as unknown as string ?? "0", 10),
      };
    } catch {
      // Fall through to standard query if fn_search_signals not available
    }
  }

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

/* ── Escalation Detection ───────────────────────────────── */

export interface EscalationAlert {
  region: string;
  todayCount: number;
  baselineAvg: number;
  ratio: number;
  todaySeverityAvg: number | null;
  baselineSeverityAvg: number | null;
  severityDelta: number | null;
  escalated: boolean;
  reason: string;
  topSignals: { title: string; source_provider: string; severity: string | null; published_at: string }[];
}

/**
 * Compare today's signal activity against the 7-day rolling baseline.
 * Flags escalation if count exceeds 2x baseline or severity jumps >0.5 points.
 * Uses the database function fn_detect_escalation when available for efficiency.
 */
export async function detectEscalation(region: string): Promise<EscalationAlert | null> {
  if (!isDatabaseConfigured) return null;

  // Try server-side function first (single query vs 3 parallel queries)
  try {
    const result = await query<{
      region: string;
      today_count: string;
      baseline_avg_7d: string;
      ratio: string;
      today_severity_avg: string | null;
      baseline_severity_avg: string | null;
      severity_delta: string | null;
      escalated: boolean;
      reason: string;
      top_signals: { title: string; source_provider: string; severity: string | null; published_at: string }[];
    }>(
      `SELECT * FROM fn_detect_escalation($1)`,
      [region],
    );

    const row = result.rows[0];
    if (row) {
      return {
        region,
        todayCount: parseInt(row.today_count, 10),
        baselineAvg: parseFloat(row.baseline_avg_7d),
        ratio: parseFloat(row.ratio),
        todaySeverityAvg: row.today_severity_avg ? parseFloat(row.today_severity_avg) : null,
        baselineSeverityAvg: row.baseline_severity_avg ? parseFloat(row.baseline_severity_avg) : null,
        severityDelta: row.severity_delta ? parseFloat(row.severity_delta) : null,
        escalated: row.escalated,
        reason: row.reason,
        topSignals: row.top_signals ?? [],
      };
    }
  } catch {
    // Fall through to inline implementation if function not available
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);

    const [todayRes, baselineRes, topRes] = await Promise.all([
      query<{ cnt: string; avg_sev: string | null }>(
        `SELECT COUNT(*)::text AS cnt,
                AVG(CASE severity WHEN 'critical' THEN 4 WHEN 'alert' THEN 3 WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL END)::text AS avg_sev
         FROM signal_archive WHERE region = $1 AND published_at >= $2`,
        [region, todayStart.toISOString()],
      ),
      query<{ cnt: string; avg_sev: string | null }>(
        `SELECT (COUNT(*) / 7.0)::text AS cnt,
                AVG(CASE severity WHEN 'critical' THEN 4 WHEN 'alert' THEN 3 WHEN 'watch' THEN 2 WHEN 'stable' THEN 1 ELSE NULL END)::text AS avg_sev
         FROM signal_archive WHERE region = $1 AND published_at >= $2 AND published_at < $3`,
        [region, weekAgo.toISOString(), todayStart.toISOString()],
      ),
      query<{ title: string; source_provider: string; severity: string | null; published_at: string }>(
        `SELECT title, source_provider, severity, published_at
         FROM signal_archive WHERE region = $1 AND published_at >= $2
         ORDER BY published_at DESC LIMIT 5`,
        [region, todayStart.toISOString()],
      ),
    ]);

    const todayCount = parseInt(todayRes.rows[0]?.cnt ?? "0", 10);
    const baselineAvg = parseFloat(baselineRes.rows[0]?.cnt ?? "0");
    const todaySev = todayRes.rows[0]?.avg_sev ? parseFloat(todayRes.rows[0].avg_sev) : null;
    const baselineSev = baselineRes.rows[0]?.avg_sev ? parseFloat(baselineRes.rows[0].avg_sev) : null;
    const ratio = baselineAvg > 0 ? todayCount / baselineAvg : todayCount > 0 ? 999 : 0;
    const sevDelta = todaySev !== null && baselineSev !== null ? todaySev - baselineSev : null;

    const countEscalated = ratio >= 2;
    const sevEscalated = sevDelta !== null && sevDelta > 0.5;
    const escalated = countEscalated || sevEscalated;

    const reasons: string[] = [];
    if (countEscalated) reasons.push(`Signal count ${todayCount} is ${ratio.toFixed(1)}x the 7-day average (${baselineAvg.toFixed(1)})`);
    if (sevEscalated) reasons.push(`Severity average jumped by ${sevDelta!.toFixed(2)} points above baseline`);
    if (!escalated) reasons.push("Within normal parameters");

    return {
      region,
      todayCount,
      baselineAvg: Math.round(baselineAvg * 10) / 10,
      ratio: Math.round(ratio * 10) / 10,
      todaySeverityAvg: todaySev ? Math.round(todaySev * 100) / 100 : null,
      baselineSeverityAvg: baselineSev ? Math.round(baselineSev * 100) / 100 : null,
      severityDelta: sevDelta ? Math.round(sevDelta * 100) / 100 : null,
      escalated,
      reason: reasons.join("; "),
      topSignals: topRes.rows,
    };
  } catch {
    return null;
  }
}
