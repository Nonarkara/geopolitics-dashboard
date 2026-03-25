import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface NewsItem {
  id?: string;
  source: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: string;
  severity: string | null;
  tags: string[];
  payload: Record<string, unknown> | null;
  created_at?: string;
}

export interface FeedHealthRow {
  id?: string;
  feed_id: string;
  status: "ok" | "error" | "timeout";
  checked_at?: string;
  response_time_ms: number | null;
  message: string | null;
}

export interface DataSnapshot {
  id?: string;
  feed_id: string;
  snapshot_data: Record<string, unknown>;
  captured_at?: string;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isConfigured = url.length > 0 && anonKey.length > 0;

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, or `null` when env vars are not configured.
 * The dashboard must work identically without Supabase — every call site
 * must handle `null`.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isConfigured) return null;
  if (!_client) {
    _client = createClient(url, anonKey);
  }
  return _client;
}

/** Whether Supabase is configured for this deployment. */
export const supabaseEnabled = isConfigured;

/* ── Convenience helpers ─────────────────────────────────── */

export async function upsertNewsItem(item: NewsItem): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("news_items").upsert(item, { onConflict: "url" });
  } catch {
    /* non-critical — dashboard works without Supabase */
  }
}

export async function logFeedHealth(row: FeedHealthRow): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("feed_health").insert(row);
  } catch {
    /* non-critical */
  }
}

export async function saveDataSnapshot(snap: DataSnapshot): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("data_snapshots").insert(snap);
  } catch {
    /* non-critical */
  }
}
