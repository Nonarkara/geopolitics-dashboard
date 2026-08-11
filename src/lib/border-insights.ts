/**
 * Border educational insights — free APIs only.
 * Air: Open-Meteo CAMS (AQI / PM2.5 / CO₂ model — not satellite XCO₂ column).
 * Mekong: Open-Meteo GloFAS river discharge at Thai-bank gauges.
 * Compare: World Bank GDP growth + urbanisation + forest cover.
 *
 * Worker note: do not use short AbortSignal.timeout on these upstreams.
 * Cold Open-Meteo from CF can exceed 12s; flood-risk already proves the
 * durable pattern is `next: { revalidate }` without a tight abort.
 */

export interface InsightAirPoint {
  id: string;
  label: string;
  theater: string;
  lat: number;
  lng: number;
  usAqi: number | null;
  pm25: number | null;
  co2Ppm: number | null;
  observedAt: string | null;
  source: string;
}

export interface InsightRiverPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentDischarge: number;
  forecastPeak: number;
  forecastPeakDate: string;
  trend: "rising" | "falling" | "stable";
  riskLevel: "low" | "moderate" | "high" | "critical";
  series: Array<{ date: string; discharge: number }>;
}

export interface InsightCountryAxis {
  iso3: string;
  label: string;
  gdpGrowthPct: number | null;
  urbanPct: number | null;
  forestPct: number | null;
  year: string | null;
}

export interface BorderInsightsPayload {
  generatedAt: string;
  air: InsightAirPoint[];
  rivers: InsightRiverPoint[];
  countries: InsightCountryAxis[];
  notes: string[];
  sources: Array<{
    id: string;
    label: string;
    url: string;
    status: "live" | "stale" | "offline";
  }>;
}

const AIR_SITES = [
  {
    id: "mae-sot",
    label: "Mae Sot",
    theater: "Myanmar frontier",
    lat: 16.716,
    lng: 98.566,
  },
  {
    id: "chiang-saen",
    label: "Chiang Saen",
    theater: "Mekong / China upstream",
    lat: 20.273,
    lng: 100.088,
  },
  {
    id: "aranyaprathet",
    label: "Aranyaprathet",
    theater: "Cambodia frontier",
    lat: 13.692,
    lng: 102.502,
  },
  {
    id: "sadao",
    label: "Sadao",
    theater: "Malaysia frontier",
    lat: 6.639,
    lng: 100.424,
  },
  {
    id: "bangkok",
    label: "Bangkok",
    theater: "National reference",
    lat: 13.756,
    lng: 100.502,
  },
] as const;

const MEKONG_SITES = [
  { id: "mekong-chiangsaen", name: "Mekong · Chiang Saen", lat: 20.27, lng: 100.09 },
  { id: "mekong-nongkhai", name: "Mekong · Nong Khai", lat: 17.87, lng: 102.74 },
  { id: "mekong-mukdahan", name: "Mekong · Mukdahan", lat: 16.54, lng: 104.73 },
] as const;

const COUNTRIES = [
  { iso3: "THA", label: "Thailand" },
  { iso3: "MMR", label: "Myanmar" },
  { iso3: "KHM", label: "Cambodia" },
  { iso3: "MYS", label: "Malaysia" },
  { iso3: "CHN", label: "China" },
] as const;

const INSIGHT_SOURCE_BUDGET_MS = 5_000;
const INSIGHT_CACHE_TTL_MS = 15 * 60 * 1000;

let insightCache: { payload: BorderInsightsPayload; cachedAt: number } | null = null;

export async function settleWithin<T>(
  work: Promise<T>,
  fallback: T,
  timeoutMs = INSIGHT_SOURCE_BUDGET_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      work,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type AirCurrent = {
  time?: string;
  us_aqi?: number;
  pm2_5?: number;
  carbon_dioxide?: number;
};

type AirPayload = {
  latitude?: number;
  longitude?: number;
  current?: AirCurrent;
};

function emptyAir(site: (typeof AIR_SITES)[number]): InsightAirPoint {
  return {
    id: site.id,
    label: site.label,
    theater: site.theater,
    lat: site.lat,
    lng: site.lng,
    usAqi: null,
    pm25: null,
    co2Ppm: null,
    observedAt: null,
    source: "Open-Meteo CAMS",
  };
}

async function fetchAirBatch(): Promise<InsightAirPoint[]> {
  const latitudes = AIR_SITES.map((site) => site.lat).join(",");
  const longitudes = AIR_SITES.map((site) => site.lng).join(",");
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}` +
    `&longitude=${longitudes}&current=us_aqi,pm2_5,carbon_dioxide`;

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) return AIR_SITES.map(emptyAir);

    const payload = (await response.json()) as AirPayload | AirPayload[];
    const rows = Array.isArray(payload) ? payload : [payload];

    return AIR_SITES.map((site, index) => {
      const row = rows[index];
      const current = row?.current;
      if (!current || typeof current.us_aqi !== "number") return emptyAir(site);
      return {
        id: site.id,
        label: site.label,
        theater: site.theater,
        lat: site.lat,
        lng: site.lng,
        usAqi: current.us_aqi,
        pm25: typeof current.pm2_5 === "number" ? current.pm2_5 : null,
        co2Ppm:
          typeof current.carbon_dioxide === "number" ? current.carbon_dioxide : null,
        observedAt: current.time ?? null,
        source: "Open-Meteo CAMS",
      };
    });
  } catch {
    return AIR_SITES.map(emptyAir);
  }
}

async function fetchRiver(
  site: (typeof MEKONG_SITES)[number],
): Promise<InsightRiverPoint> {
  const fallback: InsightRiverPoint = {
    ...site,
    currentDischarge: 0,
    forecastPeak: 0,
    forecastPeakDate: "",
    trend: "stable",
    riskLevel: "low",
    series: [],
  };

  try {
    const url =
      `https://flood-api.open-meteo.com/v1/flood?latitude=${site.lat}` +
      `&longitude=${site.lng}&daily=river_discharge&past_days=14&forecast_days=7`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as {
      daily?: { time?: string[]; river_discharge?: Array<number | null> };
    };
    const times = payload.daily?.time ?? [];
    const discharges = payload.daily?.river_discharge ?? [];
    if (discharges.length === 0) return fallback;

    let peak = 0;
    let peakIdx = 0;
    const series: InsightRiverPoint["series"] = [];
    for (let i = 0; i < discharges.length; i++) {
      const value = discharges[i] ?? 0;
      series.push({ date: times[i] ?? "", discharge: Math.round(value * 10) / 10 });
      if (value > peak) {
        peak = value;
        peakIdx = i;
      }
    }

    const current = discharges[discharges.length - 1] ?? 0;
    const mid = Math.floor(discharges.length / 2);
    const earlyAvg =
      discharges.slice(0, mid).reduce<number>((sum, value) => sum + (value ?? 0), 0) /
      Math.max(mid, 1);
    const lateAvg =
      discharges.slice(mid).reduce<number>((sum, value) => sum + (value ?? 0), 0) /
      Math.max(discharges.length - mid, 1);
    const trend: InsightRiverPoint["trend"] =
      lateAvg > earlyAvg * 1.15
        ? "rising"
        : lateAvg < earlyAvg * 0.85
          ? "falling"
          : "stable";
    const riskLevel: InsightRiverPoint["riskLevel"] =
      peak > 5000 || current > 4000
        ? "critical"
        : peak > 2000 || current > 1500
          ? "high"
          : peak > 500 || current > 300
            ? "moderate"
            : "low";

    return {
      ...site,
      currentDischarge: Math.round(current * 10) / 10,
      forecastPeak: Math.round(peak * 10) / 10,
      forecastPeakDate: times[peakIdx] ?? "",
      trend,
      riskLevel,
      series,
    };
  } catch {
    return fallback;
  }
}

async function fetchWorldBankIndicator(
  indicator: string,
): Promise<Map<string, { value: number; year: string }>> {
  const codes = COUNTRIES.map((country) => country.iso3).join(";");
  const url =
    `https://api.worldbank.org/v2/country/${codes}/indicator/${indicator}` +
    `?format=json&per_page=60&date=2018:2024`;
  const map = new Map<string, { value: number; year: string }>();

  try {
    const response = await fetch(url, {
      next: { revalidate: 86_400 },
      headers: {
        Accept: "application/json",
        "User-Agent": "geopolitics-dashboard/2.0 (educational border insights)",
      },
    });
    if (!response.ok) return map;
    const payload = (await response.json()) as unknown;
    const rows = Array.isArray(payload) ? payload[1] : null;
    if (!Array.isArray(rows)) return map;

    for (const row of rows) {
      if (
        typeof row !== "object" ||
        row === null ||
        typeof (row as { value?: unknown }).value !== "number" ||
        typeof (row as { countryiso3code?: unknown }).countryiso3code !== "string" ||
        typeof (row as { date?: unknown }).date !== "string"
      ) {
        continue;
      }
      const iso3 = (row as { countryiso3code: string }).countryiso3code;
      const year = (row as { date: string }).date;
      const value = (row as { value: number }).value;
      const existing = map.get(iso3);
      if (!existing || year > existing.year) {
        map.set(iso3, { value, year });
      }
    }
  } catch {
    /* offline */
  }

  return map;
}

export async function loadBorderInsights(): Promise<BorderInsightsPayload> {
  if (insightCache && Date.now() - insightCache.cachedAt < INSIGHT_CACHE_TTL_MS) {
    return insightCache.payload;
  }

  const generatedAt = new Date().toISOString();
  const emptyRivers = MEKONG_SITES.map((site) => ({
    ...site,
    currentDischarge: 0,
    forecastPeak: 0,
    forecastPeakDate: "",
    trend: "stable" as const,
    riskLevel: "low" as const,
    series: [],
  }));
  const emptyIndicator = new Map<string, { value: number; year: string }>();
  const [air, rivers, gdp, urban, forest] = await Promise.all([
    settleWithin(fetchAirBatch(), AIR_SITES.map(emptyAir)),
    settleWithin(Promise.all(MEKONG_SITES.map(fetchRiver)), emptyRivers),
    settleWithin(fetchWorldBankIndicator("NY.GDP.MKTP.KD.ZG"), emptyIndicator),
    settleWithin(fetchWorldBankIndicator("SP.URB.TOTL.IN.ZS"), emptyIndicator),
    settleWithin(fetchWorldBankIndicator("AG.LND.FRST.ZS"), emptyIndicator),
  ]);

  const countries: InsightCountryAxis[] = COUNTRIES.map((country) => {
    const g = gdp.get(country.iso3);
    const u = urban.get(country.iso3);
    const f = forest.get(country.iso3);
    return {
      iso3: country.iso3,
      label: country.label,
      gdpGrowthPct: g ? Math.round(g.value * 100) / 100 : null,
      urbanPct: u ? Math.round(u.value * 10) / 10 : null,
      forestPct: f ? Math.round(f.value * 10) / 10 : null,
      year: g?.year ?? u?.year ?? f?.year ?? null,
    };
  });

  const airLive = air.some((point) => point.usAqi !== null);
  const riverLive = rivers.some((point) => point.currentDischarge > 0);
  const econLive = countries.some((country) => country.gdpGrowthPct !== null);

  const payload: BorderInsightsPayload = {
    generatedAt,
    air,
    rivers,
    countries,
    notes: [
      "CO₂ here is CAMS near-surface model concentration (ppm), not a satellite column retrieval (OCO-2/GOSAT).",
      "Mekong values are GloFAS simulated discharge — educational proxy. Official station telemetry lives at MRC; China shares limited flood-season data under bilateral protocols.",
      "Urban % and forest % are World Bank structural proxies for built pressure vs green cover — not pixel-level land-cover change.",
      "Spider axes are normalised for comparison; they are not a forecast of conflict.",
    ],
    sources: [
      {
        id: "open-meteo-cams",
        label: "Open-Meteo CAMS Air",
        url: "https://open-meteo.com/en/docs/air-quality-api",
        status: airLive ? "live" : "offline",
      },
      {
        id: "open-meteo-glofas",
        label: "Open-Meteo GloFAS Flood",
        url: "https://open-meteo.com/en/docs/flood-api",
        status: riverLive ? "live" : "offline",
      },
      {
        id: "world-bank",
        label: "World Bank Open Data",
        url: "https://data.worldbank.org",
        status: econLive ? "live" : "offline",
      },
    ],
  };

  if (airLive || riverLive || econLive) {
    insightCache = { payload, cachedAt: Date.now() };
  } else if (insightCache) {
    return {
      ...insightCache.payload,
      sources: insightCache.payload.sources.map((source) => ({
        ...source,
        status: "stale" as const,
      })),
    };
  }

  return payload;
}
