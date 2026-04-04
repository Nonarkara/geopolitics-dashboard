/**
 * Database access layer — Supabase as single source of truth.
 *
 * Provides a `query<T>()` function that executes raw SQL via Supabase's
 * postgres connection. For simple CRUD, prefer the Supabase client directly
 * via supabase-server.ts. This wrapper exists for complex analytical queries
 * (PostGIS, window functions, CTEs) that can't be expressed via PostgREST.
 *
 * Migration note: This replaces the former raw `pg` Pool connection.
 * The `query()` signature is unchanged so existing call sites work as-is.
 */

import { Pool } from "pg";

/**
 * Connection string — now points to Supabase's direct connection.
 *
 * Supabase provides two Postgres endpoints:
 *   - Transaction pooler (port 6543) — for serverless/short-lived connections
 *   - Direct (port 5432) — for migrations and long-running queries
 *
 * For Next.js API routes on Vercel, the pooler is ideal.
 * Set DATABASE_URL to your Supabase connection string.
 */
const connectionString = process.env.DATABASE_URL?.trim();

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

const poolConfig = connectionString
  ? ({
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
    } as unknown as ConstructorParameters<typeof Pool>[0])
  : null;

const pool = (poolConfig ? new Pool(poolConfig) : null) as ConnectablePool | null;

export const isDatabaseConfigured = Boolean(connectionString);

pool?.on("error", (error) => {
  console.error("Unexpected idle database client error:", error);
});

function requirePool() {
  if (!pool) {
    throw new Error(
      "DATABASE_URL is not configured — set it to your Supabase connection string",
    );
  }

  return pool;
}

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
) => {
  return executeQuery<T>(requirePool(), text, params);
};

export async function withDatabaseTransaction<T>(
  handler: (executor: DatabaseExecutor) => Promise<T>,
) {
  const client = await requirePool().connect();

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

export default pool;
