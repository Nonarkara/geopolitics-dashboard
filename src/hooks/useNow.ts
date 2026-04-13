"use client";

import { useEffect, useState } from "react";

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      setNow(Date.now());
    };

    sync();
    const intervalId = setInterval(sync, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);

  return now;
}
