import { query, isDatabaseConfigured } from "./db";
import { BORDER_AREAS } from "./border-regions";
import { PlaybackApiError } from "./playback-api";
import type {
  BorderActionItem,
  BorderAreaStatus,
  BorderCommandBrief,
  BorderCommandConcern,
  BorderCommandPosture,
  DashboardPlaybackMode,
  EconomicIndicator,
  MarketRadarResponse,
  NewsItem,
  NewsResponse,
  ScoreBreakdown,
  TickerItem,
  TickerResponse,
} from "../types/dashboard";
import {
  buildHistoricalPlaybackHeadline,
  formatBangkokDayLabel,
  type DashboardTimeWindow,
} from "./time-window";

interface ArchivedSignalRow {
  title: string;
  summary: string | null;
  published_at: string;
  region: string | null;
  severity: string | null;
  score: number | null;
  keywords: string[] | null;
  source_provider: string;
  source_url: string | null;
  url: string | null;
  payload: Record<string, unknown> | null;
}

interface HistoricalMarketRow {
  label: string;
  value: number;
  unit: string | null;
  category: string | null;
  source: string | null;
  province: string | null;
  previous_value: number | null;
  snapshot_at: string | null;
}

interface HistoricalMacroRow {
  country_code: string;
  country: string;
  gdp_usd: number;
  gdp_per_capita_usd: number;
  gdp_year: number;
  gdp_per_capita_year: number;
  source: string;
  snapshot_at: string | null;
}

export const borderHistoryDeps = {
  query,
  isDatabaseConfigured: () => isDatabaseConfigured,
};

async function runHistoricalQuery<T>(
  text: string,
  params: readonly unknown[],
  failureMessage: string,
) {
  try {
    return await borderHistoryDeps.query<T>(text, params);
  } catch (error) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      error instanceof Error ? `${failureMessage}: ${error.message}` : failureMessage,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function parseScoreBreakdown(value: unknown): ScoreBreakdown | null {
  if (!isRecord(value)) {
    return null;
  }

  const baseScore = asNumber(value.baseScore);
  const baseScoreRationale = asString(value.baseScoreRationale);
  const rawTotal = asNumber(value.rawTotal);
  const clampedScore = asNumber(value.clampedScore);
  const formula = asString(value.formula);

  if (
    baseScore === null ||
    baseScoreRationale === null ||
    rawTotal === null ||
    clampedScore === null ||
    formula === null ||
    !Array.isArray(value.contributions)
  ) {
    return null;
  }

  const contributions = value.contributions.filter(
    (entry): entry is ScoreBreakdown["contributions"][number] =>
      isRecord(entry) &&
      typeof entry.factor === "string" &&
      typeof entry.rawValue === "number" &&
      typeof entry.weight === "number" &&
      typeof entry.contribution === "number" &&
      typeof entry.source === "string" &&
      (entry.sourceUrl === undefined || typeof entry.sourceUrl === "string"),
  );

  if (contributions.length !== value.contributions.length) {
    return null;
  }

  return {
    baseScore,
    baseScoreRationale,
    contributions,
    rawTotal,
    clampedScore,
    formula,
  };
}

function getAreaMetadata(areaId: string | null | undefined) {
  return BORDER_AREAS.find((area) => area.id === areaId) ?? null;
}

function postureFromSeverityOrScore(
  severity: string | null,
  score: number | null,
): BorderCommandPosture {
  if (severity === "alert" || (score ?? 0) >= 0.75) {
    return "priority";
  }

  if (severity === "watch" || (score ?? 0) >= 0.48) {
    return "watch";
  }

  return "stable";
}

function postureRank(posture: BorderCommandPosture) {
  switch (posture) {
    case "priority":
      return 3;
    case "watch":
      return 2;
    default:
      return 1;
  }
}

function buildSummaryFromAreas(areas: BorderAreaStatus[]) {
  const lead = areas[0];
  const support = areas[1];

  if (!lead) {
    return "No archived border command picture is available for this playback window.";
  }

  if (!support) {
    return lead.summary;
  }

  return `${lead.summary} ${support.label} remains the secondary watch line for this archived cycle.`;
}

function buildActionQueueFromAreas(areas: BorderAreaStatus[]): BorderActionItem[] {
  return areas.map((area) => {
    const metadata = getAreaMetadata(area.id);

    return {
      id: `${area.id}-action`,
      areaId: area.id,
      areaLabel: area.label,
      title: area.recommendedAction,
      detail:
        area.posture === "priority"
          ? `${area.label} was the lead intervention area in this archived cycle because it held the highest command score.`
          : area.posture === "watch"
            ? `${area.label} needed governor-ready monitoring in this archived cycle.`
            : `${area.label} stayed stable enough for routine monitoring in this archived cycle.`,
      owner: metadata?.actionOwner ?? "Border command",
      posture: area.posture,
    };
  });
}

function mapHistoricalNewsItem(row: ArchivedSignalRow): NewsItem {
  const payload = isRecord(row.payload) ? row.payload : null;
  const tag =
    asString(payload?.tag) ??
    asStringArray(payload?.tags)[0] ??
    asString(row.payload?.type) ??
    "Archive";
  const provider = asString(payload?.provider) ?? undefined;

  return {
    id:
      asString(payload?.id) ??
      row.url ??
      row.source_url ??
      `${row.source_provider}-${row.published_at}`,
    title: row.title,
    summary: row.summary ?? "Archived border headline.",
    source: row.source_provider,
    sourceUrl: row.source_url ?? row.url ?? undefined,
    tag,
    publishedAt: row.published_at,
    severity: postureFromSeverityOrScore(row.severity, row.score) === "priority"
      ? "alert"
      : postureFromSeverityOrScore(row.severity, row.score) === "watch"
        ? "watch"
        : "stable",
    provider,
  };
}

function mapHistoricalIndicator(row: HistoricalMarketRow): EconomicIndicator {
  const change =
    row.previous_value === null
      ? 0
      : Number((row.value - row.previous_value).toFixed(2));

  return {
    label: row.label,
    value: row.value,
    unit: row.unit,
    category: row.category,
    source: row.source,
    province: row.province,
    change,
    up: change >= 0,
  };
}

function createHistoricalEmptyBrief(window: DashboardTimeWindow): BorderCommandBrief {
  return {
    generatedAt: window.to,
    headline: buildHistoricalPlaybackHeadline(window.bangkokDay),
    summary:
      "The archive does not have a stored border-command snapshot for this Bangkok command day.",
    overallPosture: "stable",
    overallScore: 0,
    overallScoreMethod: "historical-empty",
    areas: [],
    topConcerns: [],
    actionQueue: [],
    sources: ["Border command archive"],
    mode: "historical-empty",
  };
}

function createHistoricalEmptyNews(window: DashboardTimeWindow): NewsResponse {
  return {
    generatedAt: window.to,
    news: [],
    mode: "historical-empty",
  };
}

function createHistoricalEmptyTicker(window: DashboardTimeWindow): TickerResponse {
  return {
    generatedAt: window.to,
    items: [],
    mode: "historical-empty",
  };
}

function createHistoricalEmptyMarkets(window: DashboardTimeWindow): MarketRadarResponse {
  return {
    generatedAt: window.to,
    data: [],
    signals: [],
    aseanGdp: [],
    sources: ["Postgres market history"],
    mode: "historical-empty",
  };
}

export async function loadHistoricalBorderCommandBrief(window: DashboardTimeWindow) {
  if (!borderHistoryDeps.isDatabaseConfigured()) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      "Border command archive is not configured for historical playback.",
    );
  }

  const postureResult = await runHistoricalQuery<ArchivedSignalRow>(
    `SELECT title, summary, published_at, region, severity, score, keywords,
            source_provider, source_url, url, payload
     FROM signal_archive
     WHERE source_provider = 'border-command-engine'
       AND signal_type = 'political'
       AND published_at >= $1
       AND published_at <= $2
       AND payload->>'type' = 'brief_posture'
     ORDER BY published_at DESC
     LIMIT 1`,
    [window.from, window.to],
    "Historical brief posture lookup failed",
  );
  const postureRow = postureResult.rows[0];

  if (!postureRow) {
    return createHistoricalEmptyBrief(window);
  }

  const snapshotAt = postureRow.published_at;
  const posturePayload = isRecord(postureRow.payload) ? postureRow.payload : null;
  const [areaResult, concernResult] = await Promise.all([
    runHistoricalQuery<ArchivedSignalRow>(
      `SELECT title, summary, published_at, region, severity, score, keywords,
              source_provider, source_url, url, payload
       FROM signal_archive
       WHERE source_provider = 'border-command-engine'
         AND signal_type = 'political'
         AND published_at = $1
         AND payload->>'type' = 'area_assessment'
       ORDER BY score DESC NULLS LAST, title ASC`,
      [snapshotAt],
      "Historical area assessment lookup failed",
    ),
    runHistoricalQuery<ArchivedSignalRow>(
      `SELECT title, summary, published_at, region, severity, score, keywords,
              source_provider, source_url, url, payload
       FROM signal_archive
       WHERE source_provider = 'border-command-engine'
         AND signal_type = 'political'
         AND published_at = $1
         AND payload->>'type' = 'top_concern'
       ORDER BY published_at DESC, title ASC`,
      [snapshotAt],
      "Historical concern lookup failed",
    ),
  ]);

  if (areaResult.rows.length === 0) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      `Historical brief snapshot ${snapshotAt} is missing archived area assessments.`,
    );
  }

  const areas = areaResult.rows
    .map<BorderAreaStatus>((row) => {
      const payload = isRecord(row.payload) ? row.payload : null;
      const areaId = asString(payload?.areaId) ?? row.region ?? "general";
      const metadata = getAreaMetadata(areaId);
      const score = asNumber(payload?.score) ?? Math.round((row.score ?? 0) * 100);
      const posture =
        (asString(payload?.posture) as BorderCommandPosture | null) ??
        postureFromSeverityOrScore(row.severity, row.score);

      return {
        id: areaId,
        label: asString(payload?.label) ?? row.title.split(":")[0] ?? metadata?.label ?? areaId,
        counterpart: asString(payload?.counterpart) ?? metadata?.counterpart ?? areaId,
        posture,
        score,
        scoreBreakdown:
          parseScoreBreakdown(payload?.scoreBreakdown) ??
          {
            baseScore: score,
            baseScoreRationale: "Historical snapshot reconstructed from archived posture signals.",
            contributions: [],
            rawTotal: score,
            clampedScore: score,
            formula: "archived-score",
          },
        incidentCount: asNumber(payload?.incidentCount) ?? 0,
        fatalityCount: asNumber(payload?.fatalityCount) ?? 0,
        verifiedCameras: asNumber(payload?.verifiedCameras) ?? 0,
        candidateCameras: asNumber(payload?.candidateCameras) ?? 0,
        summary: row.summary ?? "Archived border-area assessment.",
        watchpoints:
          asStringArray(payload?.watchpoints).length > 0
            ? asStringArray(payload?.watchpoints)
            : row.keywords ?? metadata?.watchpoints ?? [],
        signals: asStringArray(payload?.signals),
        recommendedAction:
          asString(payload?.recommendedAction) ??
          metadata?.actionTitle ??
          "Maintain archive playback review.",
      };
    })
    .sort((left, right) => {
      if (postureRank(right.posture) !== postureRank(left.posture)) {
        return postureRank(right.posture) - postureRank(left.posture);
      }

      return right.score - left.score;
    });

  const topConcerns = concernResult.rows.map<BorderCommandConcern>((row, index) => {
    const payload = isRecord(row.payload) ? row.payload : null;
    const areaId = asString(payload?.areaId) ?? row.region ?? areas[0]?.id ?? "general";
    const area = areas.find((candidate) => candidate.id === areaId);
    const titleMatch = /^Concern:\s*(.+?)\s*\((.+)\)$/.exec(row.title);

    return {
      id: `${areaId}-historical-concern-${index + 1}`,
      areaId,
      areaLabel:
        asString(payload?.areaLabel) ??
        titleMatch?.[2] ??
        area?.label ??
        getAreaMetadata(areaId)?.label ??
        areaId,
      label: asString(payload?.label) ?? titleMatch?.[1] ?? row.title,
      posture:
        (asString(payload?.posture) as BorderCommandPosture | null) ??
        area?.posture ??
        "watch",
      detail: asString(payload?.detail) ?? row.summary ?? "Archived concern.",
      metric: asString(payload?.metric) ?? "--",
    };
  });

  const overallScore =
    asNumber(posturePayload?.overallScore) ??
    Math.max(...areas.map((area) => area.score), 0);

  return {
    generatedAt: asString(posturePayload?.generatedAt) ?? snapshotAt,
    headline:
      asString(posturePayload?.headline) ??
      postureRow.summary ??
      areas[0]?.label ??
      buildHistoricalPlaybackHeadline(window.bangkokDay),
    summary: asString(posturePayload?.summary) ?? buildSummaryFromAreas(areas),
    overallPosture:
      (asString(posturePayload?.overallPosture) as BorderCommandPosture | null) ??
      postureFromSeverityOrScore(postureRow.severity, postureRow.score),
    overallScore,
    overallScoreMethod:
      asString(posturePayload?.overallScoreMethod) ?? "archive-reconstructed",
    areas,
    topConcerns: topConcerns.slice(0, 6),
    actionQueue: buildActionQueueFromAreas(areas).slice(0, 4),
    sources:
      asStringArray(posturePayload?.sources).length > 0
        ? asStringArray(posturePayload?.sources)
        : ["Border command archive"],
    mode: "historical",
  };
}

export async function loadHistoricalBorderTicker(window: DashboardTimeWindow) {
  if (!borderHistoryDeps.isDatabaseConfigured()) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      "Border ticker archive is not configured for historical playback.",
    );
  }

  const result = await runHistoricalQuery<ArchivedSignalRow>(
    `SELECT title, summary, published_at, region, severity, score, keywords,
            source_provider, source_url, url, payload
     FROM signal_archive
     WHERE source_provider = 'border-ticker-engine'
       AND published_at >= $1
       AND published_at <= $2
       AND payload->>'type' = 'ticker_snapshot'
     ORDER BY published_at DESC
     LIMIT 1`,
    [window.from, window.to],
    "Historical ticker lookup failed",
  );
  const row = result.rows[0];

  if (!row) {
    return createHistoricalEmptyTicker(window);
  }

  if (!isRecord(row.payload)) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      `Historical ticker snapshot ${row.published_at} is malformed.`,
    );
  }

  const items = Array.isArray(row.payload.items)
    ? row.payload.items.filter((item): item is TickerItem => {
        return isRecord(item)
          && typeof item.id === "string"
          && typeof item.label === "string"
          && typeof item.value === "string"
          && typeof item.delta === "string"
          && (item.tone === "up" || item.tone === "down" || item.tone === "neutral");
      })
    : [];

  if (items.length === 0 && Array.isArray(row.payload.items)) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      `Historical ticker snapshot ${row.published_at} does not contain valid ticker items.`,
    );
  }

  return items.length > 0
    ? { generatedAt: row.published_at, items, mode: "historical" }
    : createHistoricalEmptyTicker(window);
}

export async function loadHistoricalBorderNews(window: DashboardTimeWindow) {
  if (!borderHistoryDeps.isDatabaseConfigured()) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      "Border news archive is not configured for historical playback.",
    );
  }

  const result = await runHistoricalQuery<ArchivedSignalRow>(
    `SELECT title, summary, published_at, region, severity, score, keywords,
            source_provider, source_url, url, payload
     FROM signal_archive
     WHERE signal_type = 'news'
       AND published_at >= $1
       AND published_at <= $2
     ORDER BY published_at DESC
     LIMIT 6`,
    [window.from, window.to],
    "Historical news lookup failed",
  );

  return result.rows.length > 0
    ? {
        generatedAt: result.rows[0].published_at,
        news: result.rows.map(mapHistoricalNewsItem),
        mode: "historical",
      }
    : createHistoricalEmptyNews(window);
}

export async function loadHistoricalMarketRadar(window: DashboardTimeWindow) {
  if (!borderHistoryDeps.isDatabaseConfigured()) {
    throw new PlaybackApiError(
      "ARCHIVE_UNAVAILABLE",
      "Market history is not configured for historical playback.",
    );
  }

  const [marketResult, macroResult] = await Promise.all([
    runHistoricalQuery<HistoricalMarketRow>(
      `WITH ranked_market_data AS (
         SELECT
           indicator AS label,
           value,
           unit,
           category,
           source,
           province,
           created_at AS snapshot_at,
           LAG(value) OVER (
             PARTITION BY indicator, COALESCE(province, '')
             ORDER BY ref_date, created_at
           ) AS previous_value,
           ROW_NUMBER() OVER (
             PARTITION BY indicator, COALESCE(province, '')
             ORDER BY ref_date DESC, created_at DESC
           ) AS latest_rank
         FROM market_data
         WHERE created_at <= $1
       )
       SELECT label, value, unit, category, source, province, previous_value, snapshot_at
       FROM ranked_market_data
       WHERE latest_rank = 1
       ORDER BY category NULLS LAST, label
       LIMIT 10`,
      [window.to],
      "Historical market snapshot lookup failed",
    ),
    runHistoricalQuery<HistoricalMacroRow>(
      `WITH ranked_macro AS (
         SELECT
           country_code,
           country,
           gdp_usd,
           gdp_per_capita_usd,
           gdp_year,
           gdp_per_capita_year,
           source,
           captured_at AS snapshot_at,
           ROW_NUMBER() OVER (
             PARTITION BY country_code
             ORDER BY GREATEST(gdp_year, gdp_per_capita_year) DESC, captured_at DESC
           ) AS latest_rank
         FROM macro_country_snapshots
         WHERE captured_at <= $1
       )
       SELECT
         country_code,
         country,
         gdp_usd,
         gdp_per_capita_usd,
         gdp_year,
         gdp_per_capita_year,
         source,
         snapshot_at
       FROM ranked_macro
       WHERE latest_rank = 1
       ORDER BY country`,
      [window.to],
      "Historical macro snapshot lookup failed",
    ),
  ]);

  const data = marketResult.rows.map(mapHistoricalIndicator);
  const aseanGdp = macroResult.rows.map((row) => ({
    countryCode: row.country_code,
    country: row.country,
    gdpUsd: row.gdp_usd,
    gdpPerCapitaUsd: row.gdp_per_capita_usd,
    gdpYear: row.gdp_year,
    gdpPerCapitaYear: row.gdp_per_capita_year,
    source: row.source,
  }));
  const generatedAt =
    marketResult.rows[0]?.snapshot_at ??
    macroResult.rows[0]?.snapshot_at ??
    window.to;

  if (data.length === 0 && aseanGdp.length === 0) {
    return createHistoricalEmptyMarkets(window);
  }

  return {
    generatedAt,
    data,
    signals: data,
    aseanGdp,
    sources: ["Postgres market history"],
    mode: "historical",
  };
}

export function buildHistoricalNarrativeFromSignals(
  window: DashboardTimeWindow,
  rows: Array<{
    region?: string | null;
    title: string;
    severity?: string | null;
    fatalities?: number | null;
    published_at: string;
  }>,
) {
  if (rows.length === 0) {
    return {
      narrative: `No archived border signals were recorded for ${formatBangkokDayLabel(window.bangkokDay)} ICT.`,
      generatedAt: window.to,
      signalCount: 0,
      mode: "historical-empty" as DashboardPlaybackMode,
    };
  }

  const byRegion = new Map<string, number>();
  let fatalityCount = 0;
  let alertCount = 0;

  for (const row of rows) {
    const region = row.region ?? "general";
    byRegion.set(region, (byRegion.get(region) ?? 0) + 1);
    fatalityCount += row.fatalities ?? 0;
    if (row.severity === "critical" || row.severity === "alert") {
      alertCount += 1;
    }
  }

  const topRegionEntry = [...byRegion.entries()].sort((left, right) => right[1] - left[1])[0];
  const topRegionLabel = getAreaMetadata(topRegionEntry?.[0])?.label ?? topRegionEntry?.[0] ?? "border archive";
  const leadTitle = rows[0]?.title ?? "Archived signal";

  return {
    narrative:
      `${formatBangkokDayLabel(window.bangkokDay)} playback captured ${rows.length} archived border signals, with ${topRegionLabel} carrying the densest command picture at ${topRegionEntry?.[1] ?? 0} signals. ` +
      `${alertCount > 0 ? `${alertCount} of those signals landed at alert weight.` : "No alert-weight signals were archived in that window."} ` +
      `${fatalityCount > 0 ? `${fatalityCount} reported fatalities were attached to the archived stream.` : "No fatalities were attached to the archived stream."} Lead archive marker: ${leadTitle}.`,
    generatedAt: rows[0]?.published_at ?? window.to,
    signalCount: rows.length,
    mode: "historical" as DashboardPlaybackMode,
  };
}
