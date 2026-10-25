import { isDatabaseConfigured, query } from "./db";

export const researchAnalysisDeps = { isDatabaseConfigured: () => isDatabaseConfigured, query, now: () => new Date() };

export interface DailyResearchActivity { region: string; day: string; types: string[] }

export function completeUtcWindow(days: number, now: Date) {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: new Date(to.getTime() - days * 86400000).toISOString(), to: to.toISOString() };
}

export function sharedTypeDayOverlap(rows: DailyResearchActivity[], days: number, minOverlap: number, now: Date) {
  if (!Number.isInteger(days) || days < 1 || days > 365 || !Number.isInteger(minOverlap) || minOverlap < 1 || minOverlap > days || !Number.isFinite(now.getTime())) throw new Error("Invalid analysis window.");
  if (rows.length > 10000) throw new Error("Daily activity exceeds the analysis budget.");
  const window = completeUtcWindow(days, now);
  const regions = new Set(rows.map(row => row.region));
  if (regions.size > 25) throw new Error("More than 25 regions requires a separately scoped analysis.");
  const byDay = new Map<string, Map<string, Set<string>>>();
  for (const row of rows) {
    if (typeof row.region !== "string" || !row.region.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(row.day) || !Array.isArray(row.types) || row.types.some(type => typeof type !== "string" || !type.trim())) throw new Error("Invalid daily activity.");
    const stamp = `${row.day}T00:00:00.000Z`;
    const parsed = new Date(stamp);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== stamp) throw new Error("Invalid calendar day.");
    if (stamp < window.from || stamp >= window.to) continue;
    const day = byDay.get(row.day) ?? new Map<string, Set<string>>();
    const types = day.get(row.region) ?? new Set<string>();
    row.types.forEach(type => types.add(type));
    day.set(row.region, types);
    byDay.set(row.day, day);
  }
  const pairs = new Map<string, { region_a: string; region_b: string; dates: Set<string>; types: Set<string> }>();
  for (const [date, activity] of byDay) {
    const ordered = [...activity.keys()].sort();
    for (let a = 0; a < ordered.length; a++) for (let b = a + 1; b < ordered.length; b++) {
      const common = [...activity.get(ordered[a])!].filter(type => activity.get(ordered[b])!.has(type));
      if (!common.length) continue;
      const key = JSON.stringify([ordered[a], ordered[b]]);
      const pair = pairs.get(key) ?? { region_a: ordered[a], region_b: ordered[b], dates: new Set<string>(), types: new Set<string>() };
      pair.dates.add(date);
      common.forEach(type => pair.types.add(type));
      pairs.set(key, pair);
    }
  }
  return [...pairs.values()].filter(pair => pair.dates.size >= minOverlap).map(pair => ({
    region_a: pair.region_a, region_b: pair.region_b, co_occurring_days: pair.dates.size,
    shared_signal_types: [...pair.types].sort(), correlation_strength: Number((pair.dates.size / days).toFixed(4)),
  })).sort((a, b) => b.co_occurring_days - a.co_occurring_days || a.region_a.localeCompare(b.region_a) || a.region_b.localeCompare(b.region_b));
}

export function researchUnavailable(fields: Record<string, unknown>, message = "The research archive is unavailable.") {
  return Response.json({ ...fields, source: "unavailable", state: "unavailable", error: { code: "RESEARCH_ARCHIVE_UNAVAILABLE", message } }, {
    status: 503, headers: { "cache-control": "no-store", "x-data-source": "unavailable" },
  });
}
