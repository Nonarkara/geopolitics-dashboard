/**
 * Supabase client — re-exports from supabase-server.ts for backward compatibility.
 *
 * V6: All Supabase access is now consolidated in supabase-server.ts.
 * This file re-exports the public API so existing imports continue to work.
 */

export {
  getSupabase,
  getServiceSupabase,
  isSupabaseConfigured as supabaseEnabled,
} from "./supabase-server";

import { getServiceSupabase } from "./supabase-server";

export type NewsItem = {
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
};

export type FeedHealthRow = {
  id?: string;
  feed_id: string;
  status: "ok" | "error" | "timeout";
  checked_at?: string;
  response_time_ms: number | null;
  message: string | null;
};

export type DataSnapshot = {
  id?: string;
  feed_id: string;
  snapshot_data: Record<string, unknown>;
  captured_at?: string;
};

/* ── Convenience helpers (use service client for writes) ── */

export async function upsertNewsItem(item: NewsItem): Promise<void> {
  const sb = getServiceSupabase();
  if (!sb) return;
  try {
    await sb.from("news_items").upsert(item, { onConflict: "url" });
  } catch {
    /* non-critical — dashboard works without Supabase */
  }
}

export async function logFeedHealth(row: FeedHealthRow): Promise<void> {
  const sb = getServiceSupabase();
  if (!sb) return;
  try {
    await sb.from("feed_health").insert(row);
  } catch {
    /* non-critical */
  }
}

export async function saveDataSnapshot(snap: DataSnapshot): Promise<void> {
  const sb = getServiceSupabase();
  if (!sb) return;
  try {
    await sb.from("data_snapshots").insert(snap);
  } catch {
    /* non-critical */
  }
}
