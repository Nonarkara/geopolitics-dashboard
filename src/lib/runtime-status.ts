import { DASHBOARD_VERSION } from "./dashboard-version";
import { loadCronJobStatuses } from "./cron-jobs";
import { isDatabaseConfigured, query } from "./db";
import { isDataExplorerEnabled } from "./feature-flags";
import { getTimeoutSignal } from "./http";
import { hasUsableMapboxToken } from "./mapbox";
import type {
  DashboardDatasetCriticality,
  DashboardDatasetStatus,
  DashboardStatusPayload,
  RuntimeDatasetState,
} from "../types/dashboard";

interface RefreshDependencyDescriptor {
  label: string;
  isConfigured: () => boolean;
}

interface DatasetDescriptor {
  id: string;
  label: string;
  source: string;
  criticality: DashboardDatasetCriticality;
  tableName: string;
  latestExpression: string;
  staleAfterMinutes: number;
  noDatabaseState: RuntimeDatasetState;
  noDatabaseDetails: string;
  emptyState: RuntimeDatasetState;
  emptyDetails: string;
  staleState?: RuntimeDatasetState;
  staleDetails?: string;
  refreshDependency?: RefreshDependencyDescriptor;
}

interface FreshnessRow {
  latest_value: string | null;
  row_count: string | number;
}

const PLACEHOLDER_ENV_VALUES = new Set([
  "",
  "changeme",
  "change-me",
  "replace-me",
  "replace_this",
  "replace-this",
  "your-token-here",
  "your_key_here",
  "your-key-here",
  "your-secret-here",
  "example",
  "test",
]);

function isConfiguredSecret(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  if (PLACEHOLDER_ENV_VALUES.has(lowered)) {
    return false;
  }

  return !lowered.startsWith("your_") && !lowered.startsWith("your-");
}

function hasConfiguredAcledRefresh() {
  const username =
    process.env.ACLED_USERNAME?.trim() ?? process.env.ACLED_EMAIL?.trim();
  const password = process.env.ACLED_PASSWORD?.trim();

  return isConfiguredSecret(username) && isConfiguredSecret(password);
}

function hasConfiguredFirmsRefresh() {
  return isConfiguredSecret(process.env.FIRMS_KEY);
}

const datasetDescriptors: DatasetDescriptor[] = [
  {
    id: "conflict_events",
    label: "Conflict events",
    source: "Postgres `events`",
    criticality: "optional",
    tableName: "events",
    latestExpression: "MAX(event_date)::text",
    staleAfterMinutes: 48 * 60,
    noDatabaseState: "fallback",
    noDatabaseDetails:
      "No database is configured, so incident routes fall back to packaged sample data.",
    emptyState: "fallback",
    emptyDetails:
      "The event store is empty, so incident surfaces are currently leaning on packaged fallback rows.",
    refreshDependency: {
      label: "ACLED access credentials",
      isConfigured: hasConfiguredAcledRefresh,
    },
  },
  {
    id: "rainfall",
    label: "Rainfall overlays",
    source: "Postgres `rainfall_data`",
    criticality: "core",
    tableName: "rainfall_data",
    latestExpression: "MAX(ref_date)::text",
    staleAfterMinutes: 48 * 60,
    noDatabaseState: "fallback",
    noDatabaseDetails:
      "No database is configured, so rainfall overlays can only use packaged fallback points.",
    emptyState: "fallback",
    emptyDetails:
      "The rainfall table is empty, so map overlays are currently using packaged fallback points.",
  },
  {
    id: "fires",
    label: "Thermal hotspots",
    source: "Postgres `fire_events`",
    criticality: "optional",
    tableName: "fire_events",
    latestExpression: "MAX(acq_date)::text",
    staleAfterMinutes: 24 * 60,
    noDatabaseState: "fallback",
    noDatabaseDetails:
      "No database is configured, so thermal layers can only use packaged fallback hotspots.",
    emptyState: "fallback",
    emptyDetails:
      "The fire-events table is empty, so thermal layers are currently using packaged fallback hotspots.",
    refreshDependency: {
      label: "FIRMS access credentials",
      isConfigured: hasConfiguredFirmsRefresh,
    },
  },
  {
    id: "market_history",
    label: "Market indicators",
    source: "Reference APIs + Postgres `market_data`",
    criticality: "core",
    tableName: "market_data",
    latestExpression: "MAX(ref_date)::text",
    staleAfterMinutes: 72 * 60,
    noDatabaseState: "on_demand",
    noDatabaseDetails:
      "Reference market cards can still fetch live values on demand, but there is no durable history or stale-safe snapshot.",
    emptyState: "on_demand",
    emptyDetails:
      "No stored market history exists yet. The dashboard can still fetch reference indicators on demand.",
  },
  {
    id: "macro_snapshots",
    label: "ASEAN macro snapshots",
    source: "World Bank WDI + Postgres `macro_country_snapshots`",
    criticality: "core",
    tableName: "macro_country_snapshots",
    latestExpression: "MAX(captured_at)::text",
    staleAfterMinutes: 30 * 24 * 60,
    noDatabaseState: "on_demand",
    noDatabaseDetails:
      "World Bank data can still load on demand, but there is no stored ASEAN GDP snapshot history.",
    emptyState: "on_demand",
    emptyDetails:
      "No stored ASEAN GDP snapshot exists yet. The dashboard can still query World Bank data on demand.",
  },
  {
    id: "air_quality",
    label: "Air quality snapshots",
    source: "Open-Meteo + Postgres `air_quality_snapshots`",
    criticality: "core",
    tableName: "air_quality_snapshots",
    latestExpression: "MAX(observed_at)::text",
    staleAfterMinutes: 6 * 60,
    noDatabaseState: "on_demand",
    noDatabaseDetails:
      "Air quality can still be fetched live per request, but there is no stored cache for stale-safe recovery.",
    emptyState: "on_demand",
    emptyDetails:
      "No stored air-quality snapshot exists yet. The dashboard can still query Open-Meteo on demand.",
  },
  {
    id: "country_profiles",
    label: "ASEAN country profiles",
    source: "World Bank WDI + Postgres `country_economic_indicators`",
    criticality: "core",
    tableName: "country_economic_indicators",
    latestExpression: "MAX(captured_at)::text",
    staleAfterMinutes: 30 * 24 * 60,
    noDatabaseState: "on_demand",
    noDatabaseDetails:
      "Country sidebar metrics can still fetch live World Bank data, but there is no persisted profile history.",
    emptyState: "on_demand",
    emptyDetails:
      "No stored country-profile snapshot exists yet. The dashboard can still query World Bank metrics on demand.",
  },
  {
    id: "intelligence_packages",
    label: "Intelligence packages",
    source: "Postgres `intelligence_package_snapshots`",
    criticality: "core",
    tableName: "intelligence_package_snapshots",
    latestExpression: "MAX(updated_at)::text",
    staleAfterMinutes: 2 * 60,
    noDatabaseState: "on_demand",
    noDatabaseDetails:
      "Packages can still be built in-process, but there is no persisted cache to recover from upstream failures.",
    emptyState: "on_demand",
    emptyDetails:
      "No stored package snapshot exists yet. Briefings are being generated on demand only.",
    staleState: "on_demand",
    staleDetails:
      "Stored package cache is stale, but the briefing stack can rebuild fresh packages on demand.",
  },
];

function normalizeRowCount(value: string | number) {
  const count = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(count) ? count : 0;
}

function normalizeTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01T00:00:00.000Z`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function computeAgeMinutes(timestamp: string | null) {
  if (!timestamp) {
    return null;
  }

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ageMs)) {
    return null;
  }

  return Math.max(0, Math.round(ageMs / 60000));
}

function formatAgeLabel(ageMinutes: number | null) {
  if (ageMinutes === null) {
    return "unknown age";
  }

  return `${Math.max(1, Math.round(ageMinutes / 60))}h since the last snapshot`;
}

function buildDatasetDetails(
  descriptor: DatasetDescriptor,
  state: RuntimeDatasetState,
  rowCount: number,
  ageMinutes: number | null,
) {
  if (state === "live") {
    return `${rowCount.toLocaleString("en-US")} stored rows available within the expected freshness window.`;
  }

  if (state === "stale") {
    return `Stored coverage exists, but it is stale: ${formatAgeLabel(ageMinutes)}.`;
  }

  return descriptor.emptyDetails;
}

async function loadDatasetStatus(
  descriptor: DatasetDescriptor,
): Promise<DashboardDatasetStatus> {
  const refreshConfigured = descriptor.refreshDependency?.isConfigured() ?? true;

  if (!isDatabaseConfigured) {
    return {
      id: descriptor.id,
      label: descriptor.label,
      source: descriptor.source,
      criticality: descriptor.criticality,
      state: descriptor.noDatabaseState,
      latestTimestamp: null,
      ageMinutes: null,
      freshnessTargetMinutes: descriptor.staleAfterMinutes,
      details: descriptor.noDatabaseDetails,
    };
  }

  try {
    const res = await query<FreshnessRow>(`
      SELECT
        ${descriptor.latestExpression} AS latest_value,
        COUNT(*)::int AS row_count
      FROM ${descriptor.tableName}
    `);

    const row = res.rows[0];
    const rowCount = normalizeRowCount(row?.row_count ?? 0);
    const latestTimestamp = normalizeTimestamp(row?.latest_value ?? null);
    const ageMinutes = computeAgeMinutes(latestTimestamp);

    if (rowCount === 0 || !latestTimestamp) {
      if (!refreshConfigured && descriptor.refreshDependency) {
        return {
          id: descriptor.id,
          label: descriptor.label,
          source: descriptor.source,
          criticality: descriptor.criticality,
          state: "disabled",
          latestTimestamp: null,
          ageMinutes: null,
          freshnessTargetMinutes: descriptor.staleAfterMinutes,
          details: `No stored snapshot exists and automatic refresh is disabled until ${descriptor.refreshDependency.label} are provided.`,
        };
      }

      return {
        id: descriptor.id,
        label: descriptor.label,
        source: descriptor.source,
        criticality: descriptor.criticality,
        state: descriptor.emptyState,
        latestTimestamp: null,
        ageMinutes: null,
        freshnessTargetMinutes: descriptor.staleAfterMinutes,
        details: descriptor.emptyDetails,
      };
    }

    let state: RuntimeDatasetState =
      ageMinutes !== null && ageMinutes <= descriptor.staleAfterMinutes
        ? "live"
        : descriptor.staleState ?? "stale";
    let details =
      state === "live"
        ? buildDatasetDetails(descriptor, state, rowCount, ageMinutes)
        : state === "stale"
          ? buildDatasetDetails(descriptor, state, rowCount, ageMinutes)
          : descriptor.staleDetails ??
            buildDatasetDetails(descriptor, "stale", rowCount, ageMinutes);

    if (!refreshConfigured && descriptor.refreshDependency) {
      if (state === "live") {
        details = `${details} Automatic refresh is currently disabled until ${descriptor.refreshDependency.label} are provided.`;
      } else {
        state = "disabled";
        details = `Stored coverage exists, but the last snapshot is ${formatAgeLabel(ageMinutes)}. Automatic refresh is disabled until ${descriptor.refreshDependency.label} are provided.`;
      }
    }

    return {
      id: descriptor.id,
      label: descriptor.label,
      source: descriptor.source,
      criticality: descriptor.criticality,
      state,
      latestTimestamp,
      ageMinutes,
      freshnessTargetMinutes: descriptor.staleAfterMinutes,
      details,
    };
  } catch {
    return {
      id: descriptor.id,
      label: descriptor.label,
      source: descriptor.source,
      criticality: descriptor.criticality,
      state: "fallback",
      latestTimestamp: null,
      ageMinutes: null,
      freshnessTargetMinutes: descriptor.staleAfterMinutes,
      details:
        "The freshness check could not read this dataset, so operators should assume fallback posture until the database recovers.",
    };
  }
}

function computeSignalStrength(datasets: DashboardDatasetStatus[]) {
  if (datasets.length === 0) {
    return 0;
  }

  const weightByState: Record<RuntimeDatasetState, number> = {
    live: 1,
    on_demand: 0.8,
    stale: 0.45,
    fallback: 0.2,
    disabled: 0.6,
  };

  const total = datasets.reduce(
    (sum, dataset) => sum + weightByState[dataset.state],
    0,
  );

  return Number((total / datasets.length).toFixed(2));
}

function getDataExplorerState() {
  if (!isDataExplorerEnabled()) {
    return "disabled";
  }

  return process.env.DATA_EXPLORER_TOKEN?.trim() ? "secured" : "unprotected";
}

export async function buildRuntimeStatusPayload(): Promise<DashboardStatusPayload> {
  const [datasets, crons] = await Promise.all([
    Promise.all(datasetDescriptors.map(loadDatasetStatus)),
    loadCronJobStatuses(),
  ]);
  const hasMapboxToken = hasUsableMapboxToken(
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
      process.env.MAPBOX_ACCESS_TOKEN,
  );
  const degradedStates = new Set<RuntimeDatasetState>([
    "stale",
    "fallback",
    "disabled",
  ]);
  const hasCoreIssue = datasets.some(
    (dataset) =>
      dataset.criticality === "core" && degradedStates.has(dataset.state),
  );
  const hasOptionalIssue = datasets.some(
    (dataset) =>
      dataset.criticality === "optional" && degradedStates.has(dataset.state),
  );
  const hasCronIssue = crons.some(
    (cron) => cron.state === "stale" || cron.state === "missing" || cron.state === "failing",
  );
  const posture =
    hasCoreIssue ? "fallback" : hasOptionalIssue || hasCronIssue ? "hybrid" : "live";

  return {
    status:
      hasCoreIssue || hasCronIssue
        ? "degraded"
        : hasOptionalIssue
          ? "limited"
          : "operational",
    version: DASHBOARD_VERSION,
    signal_strength: computeSignalStrength(datasets),
    checkedAt: new Date().toISOString(),
    posture,
    services: {
      app_runtime: process.env.VERCEL === "1" ? "vercel" : "local",
      database: isDatabaseConfigured ? "supabase-postgres" : "fallback",
      scheduler: process.env.CRON_SECRET?.trim()
        ? hasCronIssue
          ? "degraded"
          : "vercel-cron"
        : "unsecured",
      basemap: hasMapboxToken ? "configured" : "missing",
      reference_dashboard: process.env.REFERENCE_DASHBOARD_URL
        ? "configured"
        : "default",
      fallback_posture: posture,
      conflict_refresh: hasConfiguredAcledRefresh() ? "configured" : "disabled",
      thermal_refresh: hasConfiguredFirmsRefresh() ? "configured" : "disabled",
      intelligence_cache: isDatabaseConfigured ? "hybrid" : "memory",
      // determine ai_summary by probing local Ollama first, then OpenAI
      ai_summary: await (async () => {
        const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 2500);
        const openaiBase = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/$/, "");
        const openaiKey = process.env.OPENAI_API_KEY?.trim();
        const ollamaHost = (process.env.OLLAMA_HOST || "http://localhost:11434").replace(/\/$/, "");

        const tryFetch = async (url: string, opts: RequestInit = {}) => {
          try {
            const res = await fetch(url, {
              method: "GET",
              signal: getTimeoutSignal(timeoutMs),
              ...opts,
            });
            return res.ok || res.status === 401 || res.status === 403;
          } catch {
            return false;
          }
        };

        // probe local Ollama first
        const ollamaProbe = await tryFetch(`${ollamaHost}/api/models`);
        if (ollamaProbe) return "ollama";

        // probe OpenAI next
        const openaiProbe = await tryFetch(`${openaiBase}/v1/models`, openaiKey ? { headers: { Authorization: `Bearer ${openaiKey}` } } : {});
        if (openaiProbe) return "configured";

        return "fallback";
      })(),
      data_explorer: getDataExplorerState(),
      mock_ingestion: process.env.ALLOW_MOCK_INGESTION === "true"
        ? "enabled"
        : "disabled",
    },
    datasets,
    crons,
  };
}
