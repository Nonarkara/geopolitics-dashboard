"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFetchResult<T> {
  data: T | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  error: string | null;
  isStale: boolean;
  fetchCount: number;
  errorCount: number;
  refresh: () => void;
}

/**
 * Shared polling hook that fetches JSON from `url` every `intervalMs` and
 * exposes refresh metadata so the UI can show sync status, data age,
 * error tracking, and manual refresh.
 */
export function useFetch<T>(url: string, intervalMs: number): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      if (activeRef.current) {
        setData(json);
        setLastRefreshed(new Date());
        setError(null);
        setFetchCount((c) => c + 1);
      }
    } catch (e) {
      if (activeRef.current) {
        setError(e instanceof Error ? e.message : "fetch failed");
        setErrorCount((c) => c + 1);
        setFetchCount((c) => c + 1);
      }
    } finally {
      if (activeRef.current) setIsRefreshing(false);
    }
  }, [url]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    activeRef.current = true;
    void load();
    timerRef.current = setInterval(() => void load(), intervalMs);
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, intervalMs]);

  // Pause polling when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab became visible — refresh immediately
        refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refresh]);

  const isStale = error !== null && data !== null;

  return { data, lastRefreshed, isRefreshing, error, isStale, fetchCount, errorCount, refresh };
}
