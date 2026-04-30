import { useState, useEffect } from "react";

/**
 * Returns a live Date that re-renders at the given interval.
 * Default 1 s; pass a longer interval (e.g. 60_000) for low-frequency callers.
 */
export function useNow(intervalMs = 1_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
