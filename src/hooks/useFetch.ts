"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseFetchResult<T> {
  data: T | null;
  lastRefreshed: Date | null;
  isRefreshing: boolean;
  refresh: () => void;
}

/**
 * Shared polling hook that fetches JSON from `url` every `intervalMs` and
 * exposes refresh metadata so the UI can show sync status.
 */
export function useFetch<T>(url: string, intervalMs: number): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as T;
      if (activeRef.current) {
        setData(json);
        setLastRefreshed(new Date());
      }
    } catch {
      /* keep last value */
    } finally {
      if (activeRef.current) setIsRefreshing(false);
    }
  }, [url]);

  useEffect(() => {
    activeRef.current = true;
    void load();
    timerRef.current = setInterval(() => void load(), intervalMs);
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, intervalMs]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return { data, lastRefreshed, isRefreshing, refresh };
}
