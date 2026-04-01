/**
 * Supabase server-side client — uses service_role key for writes.
 *
 * This is the primary database client for all server-side operations.
 * - Reads use the anon key (public, RLS-enabled)
 * - Writes use the service_role key (bypasses RLS)
 * - Raw SQL via .rpc() for complex queries (PostGIS, window functions, CTEs)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;
const isServiceConfigured = url.length > 0 && serviceKey.length > 0;

/* ── Singleton instances ──────────────────────────────── */

let _anonClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

/**
 * Anon client — for public reads (respects RLS policies).
 * Used by client-side code and read-only API routes.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!_anonClient) {
    _anonClient = createClient(url, anonKey);
  }
  return _anonClient;
}

/**
 * Service-role client — for server-side writes (bypasses RLS).
 * Used by ingestion, archival, and mutation API routes.
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (!isServiceConfigured) return null;
  if (!_serviceClient) {
    _serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _serviceClient;
}

/**
 * Execute a raw SQL query via Supabase's .rpc() interface.
 * Falls back gracefully when Supabase is not configured.
 */
export async function rpc<T = Record<string, unknown>>(
  fnName: string,
  params?: Record<string, unknown>,
): Promise<{ data: T[] | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error("Supabase not configured") };

  const { data, error } = await client.rpc(fnName, params);
  return { data: data as T[] | null, error: error ? new Error(error.message) : null };
}
