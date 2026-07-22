/**
 * Database access layer — Supabase direct Postgres connection (reached via
 * Cloudflare Hyperdrive on Workers).
 *
 * Provides a `query<T>()` function that executes raw SQL via Supabase's
 * postgres connection. For simple CRUD, prefer the Supabase client directly
 * via supabase-server.ts. This wrapper exists for complex analytical queries
 * (PostGIS, window functions, CTEs) that can't be expressed via PostgREST.
 *
 * The `pg` module is imported lazily so that routes which don't need the
 * database (e.g. fires via NASA FIRMS, flights via OpenSky) are not
 * affected by missing native Node.js modules on edge runtimes. The import
 * is wrapped so a runtime where `pg` genuinely can't load (no Hyperdrive
 * binding) degrades to isDatabaseConfigured-style fallbacks instead of
 * throwing an unhandled error.
 */

const connectionString = process.env.DATABASE_URL?.trim();
export const isDatabaseConfigured = Boolean(connectionString);

interface QueryResult<T> {
  rows: T[];
}

export interface DatabaseExecutor {
  query<T = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

interface DatabaseClient {
  query(text: string, params?: readonly unknown[]): Promise<unknown>;
  release(): void;
}

interface ConnectablePool {
  query(text: string, params?: readonly unknown[]): Promise<unknown>;
  connect(): Promise<DatabaseClient>;
  on(event: "error", listener: (error: Error) => void): void;
  on(event: "connect", listener: (client: DatabaseClient) => void): void;
}

function getIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shouldUseSsl(databaseUrl: string) {
  if (process.env.DATABASE_SSL?.trim().toLowerCase() === "false") {
    return false;
  }

  if (databaseUrl.includes("sslmode=disable")) {
    return false;
  }

  try {
    const parsed = new URL(databaseUrl);
    return !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return true;
  }
}

function executeQuery<T>(
  executor: Pick<ConnectablePool, "query"> | Pick<DatabaseClient, "query">,
  text: string,
  params?: readonly unknown[],
) {
  return executor.query(text, params) as Promise<QueryResult<T>>;
}

/* ── Lazy pool initialization ─────────────────────────────── */

let _pool: ConnectablePool | null = null;
let _poolInitialized = false;

async function getPool(): Promise<ConnectablePool | null> {
  if (!connectionString) {
    return null;
  }

  if (_poolInitialized && _pool) {
    return _pool;
  }

  try {
    // Dynamic import — only loads `pg` when a database query is actually needed.
    // This prevents crashes on runtimes where `pg`'s native dependencies
    // (net, tls, dns) are unavailable (e.g. Cloudflare Workers without a
    // Hyperdrive binding).
    const { Pool } = await import("pg");

    const poolConfig = {
      connectionString,
      application_name: "geopolitics-dashboard",
      max: getIntegerEnv("DATABASE_POOL_MAX", 10),
      maxUses: getIntegerEnv("DATABASE_POOL_MAX_USES", 7_500),
      idleTimeoutMillis: getIntegerEnv("DATABASE_IDLE_TIMEOUT_MS", 30_000),
      connectionTimeoutMillis: getIntegerEnv(
        "DATABASE_CONNECTION_TIMEOUT_MS",
        10_000,
      ),
      statement_timeout: getIntegerEnv(
        "DATABASE_STATEMENT_TIMEOUT_MS",
        20_000,
      ),
      query_timeout: getIntegerEnv("DATABASE_QUERY_TIMEOUT_MS", 15_000),
      allowExitOnIdle: process.env.NODE_ENV === "test",
      keepAlive: true,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    };

    _pool = new Pool(poolConfig) as unknown as ConnectablePool;
    _poolInitialized = true;

    _pool.on("error", (error) => {
      console.error("Unexpected idle database client error:", error);
    });
  } catch (error) {
    // pg not available in this runtime (e.g. edge without Hyperdrive) —
    // callers fall back to their in-memory/mock data paths.
    console.error("Database pool unavailable in this runtime:", error);
    _pool = null;
    _poolInitialized = false;
  }

  return _pool;
}

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<T>> => {
  const pool = await getPool();
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured, or pg is unavailable in this runtime",
    );
  }
  return executeQuery<T>(pool, text, params);
};

export async function withDatabaseTransaction<T>(
  handler: (executor: DatabaseExecutor) => Promise<T>,
) {
  const pool = await getPool();
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured, or pg is unavailable in this runtime",
    );
  }
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await handler({
      query: <Row = Record<string, unknown>>(
        text: string,
        params?: readonly unknown[],
      ) => executeQuery<Row>(client, text, params),
    });
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback failures; the original error is the useful one.
    }

    throw error;
  } finally {
    client.release();
  }
}

export default null;
