"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CachedState<T> {
  data: T | null;
  lastUpdated: string | null;
}

function readCachedState<T>(cacheKey?: string): CachedState<T> {
  if (!cacheKey || typeof window === "undefined") {
    return { data: null, lastUpdated: null };
  }

  try {
    const raw = window.localStorage.getItem(`geo-watch:${cacheKey}`);
    if (!raw) return { data: null, lastUpdated: null };

    const parsed = JSON.parse(raw) as CachedState<T>;
    return {
      data: parsed.data ?? null,
      lastUpdated: parsed.lastUpdated ?? null,
    };
  } catch {
    return { data: null, lastUpdated: null };
  }
}

function writeCachedState<T>(
  cacheKey: string | undefined,
  data: T,
  lastUpdated: string,
) {
  if (!cacheKey || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      `geo-watch:${cacheKey}`,
      JSON.stringify({ data, lastUpdated }),
    );
  } catch {
    // Ignore storage write errors.
  }
}

function defaultIsUsable<T>(value: T | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UseLiveResourceOptions<T> {
  cacheKey?: string;
  enabled?: boolean;
  intervalMs?: number;
  isUsable?: (value: T | null) => boolean;
  maxRetries?: number;
  maxStaleMs?: number;
}

interface UseLiveResourceResult<T> {
  data: T | null;
  lastUpdated: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  error: Error | null;
  retryCount: number;
  refresh: () => void;
}

export function useLiveResource<T>(
  fetcher: () => Promise<T>,
  options: UseLiveResourceOptions<T> = {},
): UseLiveResourceResult<T> {
  const {
    cacheKey,
    enabled = true,
    intervalMs = 300_000,
    isUsable = defaultIsUsable,
    maxRetries = 3,
    maxStaleMs = 10 * 60 * 1000,
  } = options;

  const [cached] = useState(() => readCachedState<T>(cacheKey));
  const dataRef = useRef<T | null>(cached.data);
  const isUsableRef = useRef(isUsable);
  isUsableRef.current = isUsable;

  const [data, setData] = useState<T | null>(cached.data);
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    cached.lastUpdated,
  );
  const [isLoading, setIsLoading] = useState(enabled && !cached.data);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(Boolean(cached.data));
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  dataRef.current = data;

  const load = useCallback(
    async ({ manual = false } = {}) => {
      if (!enabled) return;

      if (manual || dataRef.current) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const backoffMs = Math.min(
              1000 * Math.pow(2, attempt - 1),
              8000,
            );
            await sleep(backoffMs);
          }

          const result = await fetcher();
          const responseMeta =
            result && typeof result === "object" && "__meta" in result
              ? (result as Record<string, unknown>).__meta as
                  | { updatedAt?: string; status?: string }
                  | undefined
              : undefined;

          if (!isUsableRef.current(result)) {
            throw new Error("No usable live data returned");
          }

          const stampedAt = new Date().toISOString();
          setData(result);
          setLastUpdated(responseMeta?.updatedAt || stampedAt);
          setIsStale(responseMeta?.status === "stale");
          setError(null);
          setRetryCount(0);
          writeCachedState(cacheKey, result, responseMeta?.updatedAt || stampedAt);

          setIsLoading(false);
          setIsRefreshing(false);
          return;
        } catch (caughtError) {
          lastError =
            caughtError instanceof Error
              ? caughtError
              : new Error(String(caughtError));
        }
      }

      setError(lastError);
      setRetryCount((prev) => prev + 1);

      const hasData = Boolean(dataRef.current || cached.data);
      if (hasData && lastUpdated) {
        const age = Date.now() - new Date(lastUpdated).getTime();
        setIsStale(age > maxStaleMs);
      } else {
        setIsStale(hasData);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [cacheKey, cached.data, enabled, fetcher, lastUpdated, maxRetries, maxStaleMs],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const kickoff = window.setTimeout(() => {
      void load();
    }, 0);

    const interval = window.setInterval(() => {
      void load();
    }, intervalMs);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, [enabled, intervalMs, load]);

  return {
    data,
    lastUpdated,
    isLoading,
    isRefreshing,
    isStale,
    error,
    retryCount,
    refresh: () => void load({ manual: true }),
  };
}
