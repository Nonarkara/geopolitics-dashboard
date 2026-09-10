"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * What the route declared about its own payload via `X-Data-Source`.
 * `null` means the route did not declare — treat as unknown, never as live.
 */
export type DeclaredDataSource = "live" | "partial" | "unavailable" | null;

export interface UseFetchResult<T> {
  data: T | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  error: string | null;
  isStale: boolean;
  dataSource: DeclaredDataSource;
  /**
   * ISO timestamp the route stamped on `X-Data-Age` — when the SERVER built
   * this payload. `null` when the route does not declare it. Distinct from
   * `lastRefreshed`, which is when this client fetched.
   */
  dataAge: string | null;
  fetchCount: number;
  errorCount: number;
  refresh: () => void;
}

/**
 * Read the honesty header the API routes already set. Producing it and never
 * reading it is worse than not producing it, because the next reader assumes
 * the signal works. See `tests/fail-closed-routes.test.mts` for the contract.
 */
export function normalizeDeclaredDataSource(raw: string | null): DeclaredDataSource {
  switch (raw?.trim().toLowerCase()) {
    case "live":
      return "live";
    case "partial":
      return "partial";
    case "unavailable":
      return "unavailable";
    default:
      return null;
  }
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
  const [dataSource, setDataSource] = useState<DeclaredDataSource>(null);
  const [dataAge, setDataAge] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const declared = normalizeDeclaredDataSource(res.headers.get("X-Data-Source"));
      const declaredAge = res.headers.get("X-Data-Age");
      const json = (await res.json()) as T;
      if (activeRef.current) {
        setData(json);
        setDataSource(declared);
        setDataAge(declaredAge);
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

  // Stale means "what we are holding is not a current live reading": either the
  // last refresh failed while we kept older data, or the route itself told us it
  // has no live data to give.
  const isStale = dataSource === "unavailable" || (error !== null && data !== null);

  return { data, lastRefreshed, isRefreshing, error, isStale, dataSource, dataAge, fetchCount, errorCount, refresh };
}
