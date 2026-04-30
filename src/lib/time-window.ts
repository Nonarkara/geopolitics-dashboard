/**
 * Bangkok (UTC+7) time-window utilities.
 * All "day keys" are YYYY-MM-DD strings in Bangkok local time.
 */

const BKK_OFFSET_MS = 7 * 60 * 60 * 1_000; // UTC+7

export type DashboardTimeWindow = {
  from: string; // ISO 8601
  to: string;   // ISO 8601
};

/** YYYY-MM-DD in Bangkok timezone from any UTC Date. */
export function getBangkokTodayKey(referenceDate: Date): string {
  return new Date(referenceDate.getTime() + BKK_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** Full UTC ISO window for a Bangkok day key. */
export function getUtcWindowForBangkokDay(day: string): DashboardTimeWindow {
  return {
    from: new Date(`${day}T00:00:00+07:00`).toISOString(),
    to:   new Date(`${day}T23:59:59+07:00`).toISOString(),
  };
}

/** Last `count` Bangkok day keys ending at (and including) referenceDate. */
export function buildRecentBangkokDays(count: number, referenceDate: Date): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getTime() - i * 86_400_000);
    days.push(getBangkokTodayKey(d));
  }
  return days;
}

/** "29 Apr" style label from a Bangkok day key. */
export function formatBangkokDayLabel(day: string): string {
  return new Date(`${day}T12:00:00+07:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  });
}

/** "HH:MM" Bangkok time from any Date or ISO string. */
export function formatBangkokTimeLabel(time: Date | string): string {
  const d = typeof time === "string" ? new Date(time) : time;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

/**
 * Append `from`, `to`, and optional extra params to a relative URL path.
 * Null/undefined values are omitted.
 */
export function buildWindowedUrl(
  path: string,
  timeWindow: DashboardTimeWindow | null,
  params?: Record<string, string | number | null | undefined>,
): string {
  const url = new URL(path, "http://x");
  if (timeWindow) {
    url.searchParams.set("from", timeWindow.from);
    url.searchParams.set("to", timeWindow.to);
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.pathname + url.search;
}
