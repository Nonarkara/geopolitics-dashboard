"use client";

import { useEffect, useState } from "react";
import { getSupabase, supabaseEnabled, type NewsItem } from "../lib/supabase";

/**
 * Subscribe to Supabase Realtime inserts on `news_items`.
 * Returns a live-updating array of the latest items.
 * No-ops gracefully when Supabase is not configured.
 */
export function useRealtimeNews(limit = 20): NewsItem[] {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!supabaseEnabled) return;

    const sb = getSupabase();
    if (!sb) return;

    // Initial fetch
    const loadInitial = async () => {
      try {
        const { data } = await sb
          .from("news_items")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (data) setItems(data as NewsItem[]);
      } catch {
        /* non-critical */
      }
    };
    void loadInitial();

    // Realtime subscription
    const channel = sb
      .channel("news_items_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_items" },
        (payload) => {
          const newItem = payload.new as NewsItem;
          setItems((prev) => [newItem, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [limit]);

  return items;
}
