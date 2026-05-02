/**
 * Database access layer — Supabase direct Postgres connection.
 *
 * Uses a lazy dynamic import for `pg` so the module is not statically
 * bundled into edge workers (which can't run TCP clients). On Cloudflare
 * Workers the dynamic import will fail gracefully and isDatabaseConfigured
 * becomes false, routing callers to their in-memory fallbacks.
 */

const connectionString = process.env.DATABASE_URL?.trim();
export const isDatabaseConfigured = Boolean(connectionString);

interface QueryResult<T> {
  rows: T[];
}

interface EdgePool {
  query: <T>(text: string, params?: readonly unknown[]) => Promise<QueryResult<T>>;
}

// Lazy pool — only created when DATABASE_URL is present and pg is available
let _pool: EdgePool | null = null;

async function getPool(): Promise<EdgePool | null> {
  if (!connectionString) return null;
  if (_pool) return _pool;
  try {
    const { Pool } = await import("pg");
    _pool = new Pool({ connectionString }) as unknown as EdgePool;
  } catch {
    // pg not available in this runtime (edge) — fall through
    _pool = null;
  }
  return _pool;
}

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<T>> => {
  const pool = await getPool();
  if (!pool) {
    throw new Error("DATABASE_URL not configured or pg unavailable in this runtime");
  }
  return pool.query<T>(text, params);
};

export default null;
