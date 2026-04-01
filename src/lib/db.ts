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
const pool = connectionString ? new Pool({ connectionString }) : null;

export const isDatabaseConfigured = Boolean(connectionString);

interface QueryResult<T> {
  rows: T[];
}

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
) => {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured — set it to your Supabase connection string");
  }

  return pool.query(text, params) as Promise<QueryResult<T>>;
};

export default pool;
