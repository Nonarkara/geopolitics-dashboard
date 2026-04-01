"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface TimeWindow {
  from: string;
  to: string;
}

interface TimeWindowContextValue {
  timeWindow: TimeWindow | null;
  setTimeWindow: (tw: TimeWindow | null) => void;
  isLive: boolean;
}

const TimeWindowContext = createContext<TimeWindowContextValue | null>(null);

export function TimeWindowProvider({ children }: { children: ReactNode }) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow | null>(null);

  return (
    <TimeWindowContext.Provider
      value={{ timeWindow, setTimeWindow, isLive: timeWindow === null }}
    >
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
