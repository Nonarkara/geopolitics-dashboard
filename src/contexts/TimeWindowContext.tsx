"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildWindowedUrl,
  getUtcWindowForBangkokDay,
  type DashboardTimeWindow,
} from "../lib/time-window";

interface TimeWindowContextValue {
  timeWindow: DashboardTimeWindow | null;
  bangkokDay: string | null;
  from: string | null;
  to: string | null;
  isLive: boolean;
  isHistorical: boolean;
  transitionState: "idle" | "entering-playback" | "entering-live";
  selectBangkokDay: (day: string | null) => void;
  clearTimeWindow: () => void;
  buildUrl: (
    path: string,
    params?: Record<string, string | number | null | undefined>,
  ) => string;
}

const TimeWindowContext = createContext<TimeWindowContextValue | null>(null);

export function TimeWindowProvider({ children }: { children: ReactNode }) {
  const [bangkokDay, setBangkokDay] = useState<string | null>(null);
  const [transitionState, setTransitionState] = useState<
    "idle" | "entering-playback" | "entering-live"
  >("idle");
  const timeWindow = bangkokDay ? getUtcWindowForBangkokDay(bangkokDay) : null;
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  const scheduleTransitionReset = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitionState("idle"), 800);
  }, []);

  const selectBangkokDay = useCallback(
    (day: string | null) => {
      if (day === null) return;
      // If currently live, trigger entering-playback transition
      if (bangkokDay === null) {
        setTransitionState("entering-playback");
        scheduleTransitionReset();
      }
      setBangkokDay(day);
    },
    [bangkokDay, scheduleTransitionReset],
  );

  const clearTimeWindow = useCallback(() => {
    // If currently in historical mode, trigger entering-live transition
    if (bangkokDay !== null) {
      setTransitionState("entering-live");
      scheduleTransitionReset();
    }
    setBangkokDay(null);
  }, [bangkokDay, scheduleTransitionReset]);

  const buildUrl = useCallback(
    (path: string, params?: Record<string, string | number | null | undefined>) =>
      buildWindowedUrl(path, timeWindow, params),
    [timeWindow],
  );

  const value = useMemo(
    () => ({
      timeWindow,
      bangkokDay,
      from: timeWindow?.from ?? null,
      to: timeWindow?.to ?? null,
      isLive: timeWindow === null,
      isHistorical: timeWindow !== null,
      transitionState,
      selectBangkokDay,
      clearTimeWindow,
      buildUrl,
    }),
    [bangkokDay, buildUrl, clearTimeWindow, selectBangkokDay, timeWindow, transitionState],
  );

  return (
    <TimeWindowContext.Provider value={value}>
      {children}
    </TimeWindowContext.Provider>
  );
}

export function useTimeWindow(): TimeWindowContextValue {
  const ctx = useContext(TimeWindowContext);
  if (!ctx) {
    throw new Error("useTimeWindow must be used within a TimeWindowProvider");
  }
  return ctx;
}
