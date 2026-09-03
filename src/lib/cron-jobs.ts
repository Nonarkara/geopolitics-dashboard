import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "./db";
import { getErrorMessage } from "./errors";
import { getTimeoutSignal } from "./http";
import type { DashboardCronState, DashboardCronStatus } from "../types/dashboard";

export type CronJobId =
  | "conflict-intel"
  | "environment-thermal"
  | "markets-macro"
  | "movements-maritime"
  | "daily-summary"
  | "maintenance-cleanup";

interface CronTaskDefinition {
  id: string;
  label: string;
  path: string;
  updatedSources: string[];
  updatedTables: string[];
}

interface CronJobDefinition {
  id: CronJobId;
  label: string;
  cadence: string;
  staleAfterMinutes: number;
  updatedSources: string[];
  updatedTables: string[];
  tasks: CronTaskDefinition[];
}

interface CronTaskResult {
  id: string;
  label: string;
  path: string;
  ok: boolean;
  status: number | null;
  durationMs: number;
  error: string | null;
}

export interface CronJobPayload {
  jobId: CronJobId;
  label: string;
  cadence: string;
  startedAt: string;
  completedAt: string;
  ok: boolean;
  updatedSources: string[];
  updatedTables: string[];
  warnings: string[];
  errors: string[];
  tasks: CronTaskResult[];
}

interface CronSnapshotRow {
  feed_id: string;
  captured_at: string;
  snapshot_data: CronJobPayload | null;
}

interface CronHealthRow {
  feed_id: string;
  status: "ok" | "error" | "timeout" | "degraded";
  checked_at: string;
  response_time_ms: number | null;
  message: string | null;
}

export const cronJobCatalog: Record<CronJobId, CronJobDefinition> = {
  "conflict-intel": {
    id: "conflict-intel",
    label: "Conflict Intel Refresh",
    cadence: "Daily Vercel cron warm-up",
    staleAfterMinutes: 26 * 60,
    updatedSources: [
      "ACLED / archived incident stack",
      "GDELT DOC 2",
      "UNHCR Refugee Data Finder",
      "Border command synthesis",
    ],
    updatedTables: [
      "events",
      "signal_archive",
      "news_items",
      "feed_health",
      "intelligence_package_snapshots",
    ],
    tasks: [
      {
        id: "border-incidents",
        label: "Border incidents",
        path: "/api/border/incidents",
        updatedSources: ["ACLED / incident archive"],
        updatedTables: ["events"],
      },
      {
        id: "border-osint",
        label: "Border OSINT cache",
        path: "/api/border/osint",
        updatedSources: ["GDELT DOC 2", "UNHCR Refugee Data Finder"],
        updatedTables: ["signal_archive", "feed_health"],
      },
      {
        id: "border-command-brief",
        label: "Border command brief",
        path: "/api/border-command/brief",
        updatedSources: ["Border command synthesis"],
        updatedTables: ["signal_archive"],
      },
      {
        id: "border-command-narrative",
        label: "Border narrative",
        path: "/api/border-command/narrative",
        updatedSources: ["Border narrative synthesis"],
        updatedTables: ["signal_archive"],
      },
      {
        id: "border-news",
        label: "Border news desk",
        path: "/api/border/news",
        updatedSources: ["Border news synthesis"],
        updatedTables: ["news_items", "signal_archive", "feed_health"],
      },
      {
        id: "border-ticker",
        label: "Border ticker",
        path: "/api/border/ticker",
        updatedSources: ["Ticker synthesis"],
        updatedTables: ["signal_archive"],
      },
      {
        id: "intelligence-packages",
        label: "Intelligence package cache",
        path: "/api/intelligence/packages",
        updatedSources: ["Intelligence fusion layer"],
        updatedTables: ["intelligence_package_snapshots"],
      },
    ],
  },
  "environment-thermal": {
    id: "environment-thermal",
    label: "Environment and Thermal Refresh",
    cadence: "Daily Vercel cron warm-up",
    staleAfterMinutes: 26 * 60,
    updatedSources: [
      "Open-Meteo",
      "NASA FIRMS",
      "GDACS",
      "River / flood monitors",
    ],
    updatedTables: [
      "air_quality_snapshots",
      "fire_events",
      "rainfall_data",
      "signal_archive",
      "feed_health",
    ],
    tasks: [
      {
        id: "air-quality",
        label: "Air quality",
        path: "/api/air-quality",
        updatedSources: ["Open-Meteo"],
        updatedTables: ["air_quality_snapshots", "signal_archive"],
      },
      {
        id: "fires",
        label: "Thermal hotspots",
        path: "/api/fires",
        updatedSources: ["NASA FIRMS"],
        updatedTables: ["fire_events", "signal_archive"],
      },
      {
        id: "rainfall",
        label: "Rainfall overlays",
        path: "/api/rainfall",
        updatedSources: ["Open-Meteo archive"],
        updatedTables: ["rainfall_data"],
      },
      {
        id: "flood-risk",
        label: "Flood risk",
        path: "/api/border/flood-risk",
        updatedSources: ["River / flood monitors"],
        updatedTables: ["signal_archive", "feed_health"],
      },
      {
        id: "disasters",
        label: "Regional disasters",
        path: "/api/border/disasters",
        updatedSources: ["GDACS"],
        updatedTables: ["signal_archive", "feed_health"],
      },
    ],
  },
  "markets-macro": {
    id: "markets-macro",
    label: "Markets and Macro Refresh",
    cadence: "Daily Vercel cron warm-up",
    staleAfterMinutes: 26 * 60,
    updatedSources: [
      "ExchangeRate API",
      "Binance",
      "World Bank WDI",
      "NABC commodities",
    ],
    updatedTables: [
      "market_data",
      "macro_country_snapshots",
      "country_economic_indicators",
      "signal_archive",
      "feed_health",
    ],
    tasks: [
      {
        id: "markets",
        label: "Market radar",
        path: "/api/markets",
        updatedSources: ["ExchangeRate API", "Binance", "World Bank WDI"],
        updatedTables: [
          "market_data",
          "macro_country_snapshots",
          "country_economic_indicators",
        ],
      },
      {
        id: "commodities",
        label: "Border commodities",
        path: "/api/border/commodities",
        updatedSources: ["NABC commodities"],
        updatedTables: ["signal_archive", "feed_health"],
      },
    ],
  },
  "movements-maritime": {
    id: "movements-maritime",
    label: "Movements and Maritime Refresh",
    cadence: "Daily Vercel cron warm-up",
    staleAfterMinutes: 26 * 60,
    updatedSources: [
      "UNHCR / movement traces",
      "Longdo Traffic",
      "AISstream vessel history",
      "Operational map overlays",
    ],
    updatedTables: [
      "population_movements",
      "visitor_movements",
      "vessel_positions",
      "signal_archive",
      "feed_health",
    ],
    tasks: [
      {
        id: "border-movements",
        label: "Border movements",
        path: "/api/border/movements",
        updatedSources: ["UNHCR / movement traces"],
        updatedTables: ["population_movements", "visitor_movements"],
      },
      {
        id: "border-traffic",
        label: "Border traffic",
        path: "/api/border/traffic",
        updatedSources: ["Longdo Traffic"],
        updatedTables: ["signal_archive", "feed_health"],
      },
      {
        id: "vessels",
        label: "Maritime vessels",
        path: "/api/border/vessels",
        updatedSources: ["AISstream vessel history"],
        updatedTables: ["vessel_positions", "signal_archive", "feed_health"],
      },
      {
        id: "operations-map",
        label: "Operations map",
        path: "/api/border/operations-map",
        updatedSources: ["Operational map overlays"],
        updatedTables: ["signal_archive"],
      },
    ],
  },
  "daily-summary": {
    id: "daily-summary",
    label: "Daily Summary Refresh",
    cadence: "Daily Vercel cron warm-up",
    staleAfterMinutes: 26 * 60,
    updatedSources: [
      "Intelligence packages",
      "Border command brief",
      "Research news fetch",
    ],
    updatedTables: [
      "intelligence_package_snapshots",
      "signal_daily_summary",
      "data_snapshots",
    ],
    tasks: [
      {
        id: "daily-brief",
        label: "Executive brief",
        path: "/api/border-command/brief",
        updatedSources: ["Border command brief"],
        updatedTables: ["signal_archive"],
      },
      {
        id: "daily-narrative",
        label: "Executive narrative",
        path: "/api/border-command/narrative",
        updatedSources: ["Border narrative synthesis"],
        updatedTables: ["signal_archive"],
      },
      {
        id: "package-cache",
        label: "Package cache",
        path: "/api/intelligence/packages",
        updatedSources: ["Intelligence fusion layer"],
        updatedTables: ["intelligence_package_snapshots"],
      },
      {
        id: "research-news",
        label: "Research fetch-news",
        path: "/api/research/fetch-news",
        updatedSources: ["Curated RSS research feeds"],
        updatedTables: ["signal_daily_summary", "signal_archive", "data_snapshots"],
      },
    ],
  },
  "maintenance-cleanup": {
    id: "maintenance-cleanup",
    label: "Maintenance Cleanup",
    cadence: "Daily Vercel cron cleanup",
    staleAfterMinutes: 26 * 60,
    updatedSources: ["Database retention rules"],
    updatedTables: [
      "intelligence_package_snapshots",
      "feed_health",
      "data_snapshots",
    ],
    tasks: [],
  },
};

export const cronJobDeps = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  isDatabaseConfigured: () => isDatabaseConfigured,
  query,
  now: () => new Date(),
};

function toMinutes(ageMs: number) {
  return Math.max(0, Math.round(ageMs / 60_000));
}

function baseNoStoreHeaders() {
  return {
    "cache-control": "no-store",
  };
}

function cronFeedId(jobId: CronJobId) {
  return `cron:${jobId}`;
}

function isCronSecretConfigured() {
  return Boolean(process.env.CRON_SECRET?.trim());
}

function isLocalCronBypassAllowed(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const host = request.headers.get("host")?.toLowerCase() ?? "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

export function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return isLocalCronBypassAllowed(request);
  }

  return request.headers.get("authorization")?.trim() === `Bearer ${secret}`;
}

export function unauthorizedCronResponse() {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED_CRON_REQUEST",
        message:
          "Cron routes require a valid bearer token from Vercel Cron or an authorized local request.",
      },
    },
    {
      status: 401,
      headers: baseNoStoreHeaders(),
    },
  );
}

async function invokeInternalRoute(origin: string, task: CronTaskDefinition) {
  const started = Date.now();

  try {
    const response = await cronJobDeps.fetch(`${origin}${task.path}`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-dashboard-cron": task.id,
      },
      signal: getTimeoutSignal(20_000),
    });

    if (!response.ok) {
      return {
        id: task.id,
        label: task.label,
        path: task.path,
        ok: false,
        status: response.status,
        durationMs: Date.now() - started,
        error: `HTTP ${response.status}`,
      } satisfies CronTaskResult;
    }

    return {
      id: task.id,
      label: task.label,
      path: task.path,
      ok: true,
      status: response.status,
      durationMs: Date.now() - started,
      error: null,
    } satisfies CronTaskResult;
  } catch (error) {
    return {
      id: task.id,
      label: task.label,
      path: task.path,
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      error: getErrorMessage(error),
    } satisfies CronTaskResult;
  }
}

export async function executeInternalCronJob(
  origin: string,
  jobId: Exclude<CronJobId, "maintenance-cleanup">,
) {
  const definition = cronJobCatalog[jobId];
  const startedAt = cronJobDeps.now().toISOString();
  const taskResults = await Promise.all(
    definition.tasks.map((task) => invokeInternalRoute(origin, task)),
  );
  const errors = taskResults
    .filter((task) => !task.ok)
    .map((task) => `${task.label}: ${task.error ?? "unknown failure"}`);
  const warnings =
    definition.tasks.length === 0
      ? ["No internal tasks were configured for this cron group."]
      : [];

  return {
    jobId: definition.id,
    label: definition.label,
    cadence: definition.cadence,
    startedAt,
    completedAt: cronJobDeps.now().toISOString(),
    ok: errors.length === 0,
    updatedSources: definition.updatedSources,
    updatedTables: definition.updatedTables,
    warnings,
    errors,
    tasks: taskResults,
  } satisfies CronJobPayload;
}

export async function executeMaintenanceCronJob() {
  const definition = cronJobCatalog["maintenance-cleanup"];
  const startedAt = cronJobDeps.now().toISOString();
  const tasks: CronTaskResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cronJobDeps.isDatabaseConfigured()) {
    errors.push("DATABASE_URL is not configured, so retention cleanup could not run.");
  } else {
    const cleanupTasks = [
      {
        id: "clean-intelligence-packages",
        label: "Prune stale intelligence package snapshots",
        sql: "DELETE FROM intelligence_package_snapshots WHERE updated_at < NOW() - INTERVAL '90 days'",
      },
      {
        id: "clean-feed-health",
        label: "Prune old feed health rows",
        sql: "DELETE FROM feed_health WHERE checked_at < NOW() - INTERVAL '30 days'",
      },
      {
        id: "clean-data-snapshots",
        label: "Prune old data snapshots",
        sql: "DELETE FROM data_snapshots WHERE captured_at < NOW() - INTERVAL '60 days'",
      },
    ] as const;

    for (const task of cleanupTasks) {
      const started = Date.now();

      try {
        await cronJobDeps.query(task.sql);
        tasks.push({
          id: task.id,
          label: task.label,
          path: "sql",
          ok: true,
          status: 200,
          durationMs: Date.now() - started,
          error: null,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        errors.push(`${task.label}: ${message}`);
        tasks.push({
          id: task.id,
          label: task.label,
          path: "sql",
          ok: false,
          status: null,
          durationMs: Date.now() - started,
          error: message,
        });
      }
    }
  }

  return {
    jobId: definition.id,
    label: definition.label,
    cadence: definition.cadence,
    startedAt,
    completedAt: cronJobDeps.now().toISOString(),
    ok: errors.length === 0,
    updatedSources: definition.updatedSources,
    updatedTables: definition.updatedTables,
    warnings,
    errors,
    tasks,
  } satisfies CronJobPayload;
}

async function persistCronJobPayload(payload: CronJobPayload) {
  if (!cronJobDeps.isDatabaseConfigured()) {
    return;
  }

  try {
    await cronJobDeps.query(
      `
        INSERT INTO data_snapshots (feed_id, snapshot_data, captured_at)
        VALUES ($1, $2::jsonb, $3::timestamptz)
      `,
      [cronFeedId(payload.jobId), JSON.stringify(payload), payload.completedAt],
    );

    await cronJobDeps.query(
      `
        INSERT INTO feed_health (feed_id, status, checked_at, response_time_ms, message)
        VALUES ($1, $2, $3::timestamptz, $4, $5)
      `,
      [
        cronFeedId(payload.jobId),
        payload.ok ? "ok" : "degraded",
        payload.completedAt,
        Math.max(
          0,
          new Date(payload.completedAt).getTime() -
            new Date(payload.startedAt).getTime(),
        ),
        payload.errors[0] ?? payload.warnings[0] ?? null,
      ],
    );
  } catch (error) {
    console.error(
      `[cron:${payload.jobId}] failed to persist cron snapshot:`,
      getErrorMessage(error),
    );
  }
}

export async function runCronJobRequest(
  request: NextRequest,
  jobId: Exclude<CronJobId, "maintenance-cleanup">,
) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  const payload = await executeInternalCronJob(request.nextUrl.origin, jobId);
  await persistCronJobPayload(payload);

  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 503,
    headers: baseNoStoreHeaders(),
  });
}

export async function runMaintenanceCronRequest(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  const payload = await executeMaintenanceCronJob();
  await persistCronJobPayload(payload);

  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 503,
    headers: baseNoStoreHeaders(),
  });
}

function describeCronState(
  definition: CronJobDefinition,
  state: DashboardCronState,
  lastRunAt: string | null,
  ageMinutes: number | null,
  message: string | null,
) {
  if (state === "disabled") {
    return isCronSecretConfigured()
      ? "Cron tracking is enabled but the database is unavailable, so freshness cannot be recorded."
      : "Cron routes are available for local testing, but production scheduling is not secured until CRON_SECRET is configured.";
  }

  if (state === "missing") {
    return "No recorded Vercel cron run has been stored for this refresh group yet.";
  }

  if (state === "healthy" && lastRunAt) {
    return `${definition.cadence}. Last successful run recorded ${toMinutes(
      new Date().getTime() - new Date(lastRunAt).getTime(),
    )}m ago.`;
  }

  if (state === "stale") {
    return `Cron freshness is outside the expected window for ${definition.cadence.toLowerCase()}.`;
  }

  return message ?? "The last cron run recorded one or more failures.";
}

export async function loadCronJobStatuses(): Promise<DashboardCronStatus[]> {
  const definitions = Object.values(cronJobCatalog);

  if (!cronJobDeps.isDatabaseConfigured()) {
    return definitions.map((definition) => ({
      id: definition.id,
      label: definition.label,
      cadence: definition.cadence,
      state: "disabled",
      lastRunAt: null,
      ageMinutes: null,
      details: describeCronState(definition, "disabled", null, null, null),
    }));
  }

  try {
    const feedIds = definitions.map((definition) => cronFeedId(definition.id));
    const [snapshotResult, healthResult] = await Promise.all([
      cronJobDeps.query<CronSnapshotRow>(
        `
          SELECT DISTINCT ON (feed_id) feed_id, captured_at, snapshot_data
          FROM data_snapshots
          WHERE feed_id = ANY($1::text[])
          ORDER BY feed_id, captured_at DESC
        `,
        [feedIds],
      ),
      cronJobDeps.query<CronHealthRow>(
        `
          SELECT DISTINCT ON (feed_id) feed_id, status, checked_at, response_time_ms, message
          FROM feed_health
          WHERE feed_id = ANY($1::text[])
          ORDER BY feed_id, checked_at DESC
        `,
        [feedIds],
      ),
    ]);

    const snapshotByFeed = new Map(
      snapshotResult.rows.map((row) => [row.feed_id, row]),
    );
    const healthByFeed = new Map(healthResult.rows.map((row) => [row.feed_id, row]));
    const nowMs = cronJobDeps.now().getTime();

    return definitions.map((definition) => {
      const feedId = cronFeedId(definition.id);
      const snapshot = snapshotByFeed.get(feedId);
      const health = healthByFeed.get(feedId);
      const lastRunAt = snapshot?.captured_at ?? null;
      const ageMinutes =
        lastRunAt === null ? null : toMinutes(nowMs - new Date(lastRunAt).getTime());
      const payload = snapshot?.snapshot_data;
      const failed = payload?.ok === false || health?.status === "degraded";
      const stale =
        ageMinutes !== null && ageMinutes > definition.staleAfterMinutes;

      const state: DashboardCronState =
        lastRunAt === null
          ? "missing"
          : failed
            ? "failing"
            : stale
              ? "stale"
              : "healthy";

      return {
        id: definition.id,
        label: definition.label,
        cadence: definition.cadence,
        state,
        lastRunAt,
        ageMinutes,
        details: describeCronState(
          definition,
          state,
          lastRunAt,
          ageMinutes,
          payload?.errors[0] ?? health?.message ?? null,
        ),
      };
    });
  } catch (error) {
    console.error("[cron-status] failed to load cron freshness:", getErrorMessage(error));

    return definitions.map((definition) => ({
      id: definition.id,
      label: definition.label,
      cadence: definition.cadence,
      state: "failing",
      lastRunAt: null,
      ageMinutes: null,
      details: "Cron freshness could not be read from the database.",
    }));
  }
}
