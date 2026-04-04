const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardTimeWindow {
  bangkokDay: string;
  from: string;
  to: string;
}

export type DashboardTimeWindowParseResult =
  | { mode: "live" }
  | { mode: "historical"; timeWindow: DashboardTimeWindow }
  | { mode: "invalid"; reason: string };

export function isIsoTimestamp(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function isCanonicalIsoTimestamp(value: string | null | undefined): value is string {
  if (!value || !isIsoTimestamp(value)) {
    return false;
  }

  return new Date(value).toISOString() === value;
}

export function getBangkokDayKey(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const bangkok = new Date(date.getTime() + BANGKOK_OFFSET_MS);

  return bangkok.toISOString().slice(0, 10);
}

export function getBangkokTodayKey(now: Date | number = new Date()) {
  return getBangkokDayKey(now);
}

export function getUtcWindowForBangkokDay(day: string): DashboardTimeWindow | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null;
  }

  const start = new Date(`${day}T00:00:00+07:00`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start.getTime() + DAY_MS - 1);

  return {
    bangkokDay: day,
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function buildRecentBangkokDays(
  count: number,
  anchor: Date | number = new Date(),
) {
  const anchorKey = getBangkokDayKey(anchor);

  if (!anchorKey) {
    return [];
  }

  const anchorStart = new Date(`${anchorKey}T00:00:00+07:00`);
  const days: string[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const value = new Date(anchorStart.getTime() - index * DAY_MS);
    const dayKey = getBangkokDayKey(value);

    if (dayKey) {
      days.push(dayKey);
    }
  }

  return days;
}

export function formatBangkokDayLabel(day: string) {
  const date = new Date(`${day}T00:00:00+07:00`);

  if (Number.isNaN(date.getTime())) {
    return day;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatBangkokTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function parseDashboardTimeWindow(
  searchParams: Pick<URLSearchParams, "get">,
): DashboardTimeWindowParseResult {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from && !to) {
    return { mode: "live" };
  }

  if (!from || !to) {
    return {
      mode: "invalid",
      reason: "Playback requests must provide both from and to together.",
    };
  }

  if (!isCanonicalIsoTimestamp(from) || !isCanonicalIsoTimestamp(to)) {
    return {
      mode: "invalid",
      reason: "Playback requests must use canonical ISO timestamps.",
    };
  }

  const parsedFrom = new Date(from);
  const parsedTo = new Date(to);

  if (parsedFrom.getTime() > parsedTo.getTime()) {
    return {
      mode: "invalid",
      reason: "Playback requests must not use a reversed time window.",
    };
  }

  const bangkokDayFrom = getBangkokDayKey(parsedFrom);
  const bangkokDayTo = getBangkokDayKey(parsedTo);

  if (!bangkokDayFrom || !bangkokDayTo || bangkokDayFrom !== bangkokDayTo) {
    return {
      mode: "invalid",
      reason: "Playback requests must stay within one Bangkok command day.",
    };
  }

  const exactWindow = getUtcWindowForBangkokDay(bangkokDayFrom);

  if (!exactWindow || exactWindow.from !== from || exactWindow.to !== to) {
    return {
      mode: "invalid",
      reason: "Playback requests must match the canonical Bangkok command-day UTC window.",
    };
  }

  return {
    mode: "historical",
    timeWindow: {
      bangkokDay: bangkokDayFrom,
      from: parsedFrom.toISOString(),
      to: parsedTo.toISOString(),
    } satisfies DashboardTimeWindow,
  };
}

export function buildWindowedUrl(
  path: string,
  timeWindow: DashboardTimeWindow | null,
  params?: Record<string, string | number | null | undefined>,
) {
  const url = new URL(path, "http://codex.local");

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  if (timeWindow) {
    url.searchParams.set("from", timeWindow.from);
    url.searchParams.set("to", timeWindow.to);
  }

  return `${url.pathname}${url.search}`;
}

export function getLookbackWindowEnd(timeWindow: DashboardTimeWindow | null) {
  return timeWindow?.to ?? new Date().toISOString();
}

export function getLookbackWindowStart(
  timeWindow: DashboardTimeWindow | null,
  days: number,
) {
  const end = new Date(getLookbackWindowEnd(timeWindow));
  const clampedDays = Math.max(days, 1);
  const start = new Date(end.getTime() - (clampedDays - 1) * DAY_MS);

  return start.toISOString();
}

export function buildHistoricalPlaybackHeadline(day: string) {
  return `No archived command brief for ${formatBangkokDayLabel(day)}`;
}
