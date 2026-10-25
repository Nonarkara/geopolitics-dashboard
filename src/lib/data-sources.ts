export interface DataSourceAttribution {
  id: string;
  label: string;
  shortLabel: string;
  url: string;
  /**
   * How often the UPSTREAM source publishes new data. A human label, not a
   * measurement — it describes the provider's own cadence.
   */
  upstreamCadence: string;
  /**
   * How often THIS dashboard re-fetches the feed, in milliseconds. Present only
   * for feeds the client actually polls, and it is the single declaration of
   * that number: the `useFetch` interval and the feed-health dot's staleness
   * window both read it here rather than repeating a literal.
   *
   * These two fields used to be one (`refreshInterval`), which is how the
   * catalog came to advertise "6 hr" for FIRMS while the client polled it every
   * 15 minutes.
   */
  clientPollMs?: number;
}

/** Milliseconds -> the short label used in source tooltips. */
export function formatCadence(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} sec`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) {
    const hours = ms / 3_600_000;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
  }
  return `${Math.round(ms / 86_400_000)} days`;
}

/** Every upstream data source used by the dashboard, keyed by feed ID. */
export const DATA_SOURCE_CATALOG: Record<string, DataSourceAttribution> = {
  /* ── Border Status Strip feeds ─────────────────────────── */
  traffic: {
    id: "traffic",
    label: "Longdo Traffic API",
    shortLabel: "LONGDO",
    url: "https://www.longdo.com",
    upstreamCadence: "2 min",
    clientPollMs: 120_000,
  },
  earthquakes: {
    id: "earthquakes",
    label: "USGS Earthquake Hazards Program",
    shortLabel: "USGS",
    url: "https://earthquake.usgs.gov",
    upstreamCadence: "5 min",
    clientPollMs: 300_000,
  },
  flood: {
    id: "flood",
    label: "Open-Meteo River Discharge API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    upstreamCadence: "30 min",
    clientPollMs: 1800_000,
  },
  disasters: {
    id: "disasters",
    label: "GDACS — Global Disaster Alerting",
    shortLabel: "GDACS",
    url: "https://www.gdacs.org",
    upstreamCadence: "10 min",
    clientPollMs: 600_000,
  },
  eonet: {
    id: "eonet",
    label: "NASA EONET — Earth Observatory Natural Event Tracker (32 source agencies)",
    shortLabel: "EONET",
    url: "https://eonet.gsfc.nasa.gov",
    upstreamCadence: "30 min",
    clientPollMs: 1800_000,
  },
  commodities: {
    id: "commodities",
    label: "NABC Thai Agricultural Commodities",
    shortLabel: "NABC",
    url: "https://www.nabc.go.th",
    upstreamCadence: "1 hr",
    clientPollMs: 3600_000,
  },

  /* ── Environmental ─────────────────────────────────────── */
  fires: {
    id: "fires",
    label: "NASA FIRMS Active Fire Data",
    shortLabel: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov",
    upstreamCadence: "6 hr",
    clientPollMs: 900_000,
  },
  airQuality: {
    id: "airQuality",
    label: "Open-Meteo Air Quality API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    upstreamCadence: "1 hr",
  },
  rainfall: {
    id: "rainfall",
    label: "Open-Meteo Forecast API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    upstreamCadence: "1 hr",
  },

  /* ── Conflict & Intelligence ───────────────────────────── */
  acled: {
    id: "acled",
    label: "ACLED Armed Conflict Events",
    shortLabel: "ACLED",
    url: "https://acleddata.com",
    upstreamCadence: "24 hr",
  },
  refugees: {
    id: "refugees",
    label: "UNHCR Refugee Data Finder",
    shortLabel: "UNHCR",
    url: "https://www.unhcr.org/refugee-statistics",
    upstreamCadence: "24 hr",
  },
  hdx: {
    id: "hdx",
    label: "HDX HAPI Humanitarian Data",
    shortLabel: "HDX",
    url: "https://data.humdata.org",
    upstreamCadence: "24 hr",
  },

  /* ── Markets & Economics ───────────────────────────────── */
  fx: {
    id: "fx",
    label: "ExchangeRate API (Open)",
    shortLabel: "ER-API",
    url: "https://open.er-api.com",
    upstreamCadence: "24 hr",
  },
  crypto: {
    id: "crypto",
    label: "Binance Spot Ticker",
    shortLabel: "BINANCE",
    url: "https://www.binance.com",
    upstreamCadence: "5 min",
  },
  worldBank: {
    id: "worldBank",
    label: "World Bank WDI",
    shortLabel: "WORLD BANK",
    url: "https://data.worldbank.org",
    upstreamCadence: "30 days",
  },

  /* ── News & OSINT ──────────────────────────────────────── */
  bbc: {
    id: "bbc",
    label: "BBC World RSS",
    shortLabel: "BBC",
    url: "https://www.bbc.com/news/world",
    upstreamCadence: "15 min",
  },
  cna: {
    id: "cna",
    label: "Channel NewsAsia RSS",
    shortLabel: "CNA",
    url: "https://www.channelnewsasia.com",
    upstreamCadence: "15 min",
  },
  googleNews: {
    id: "googleNews",
    label: "Google News RSS",
    shortLabel: "GOOGLE",
    url: "https://news.google.com",
    upstreamCadence: "15 min",
  },
  gdelt: {
    id: "gdelt",
    label: "GDELT DOC 2.0 API",
    shortLabel: "GDELT",
    url: "https://api.gdeltproject.org",
    upstreamCadence: "15 min",
  },

  /* ── Mapping & Imagery ─────────────────────────────────── */
  nasaGibs: {
    id: "nasaGibs",
    label: "NASA GIBS Worldview",
    shortLabel: "NASA GIBS",
    url: "https://worldview.earthdata.nasa.gov",
    upstreamCadence: "Daily",
  },
  esri: {
    id: "esri",
    label: "Esri ArcGIS World Imagery",
    shortLabel: "ESRI",
    url: "https://www.arcgis.com",
    upstreamCadence: "Quarterly",
  },
  osm: {
    id: "osm",
    label: "OpenStreetMap",
    shortLabel: "OSM",
    url: "https://www.openstreetmap.org",
    upstreamCadence: "Continuous",
  },
  eox: {
    id: "eox",
    label: "EOX Sentinel-2 Cloudless",
    shortLabel: "EOX",
    url: "https://s2maps.eu",
    upstreamCadence: "Annual",
  },
  cartodb: {
    id: "cartodb",
    label: "CartoDB Basemaps",
    shortLabel: "CARTO",
    url: "https://carto.com",
    upstreamCadence: "Continuous",
  },
  jrc: {
    id: "jrc",
    label: "JRC Global Surface Water",
    shortLabel: "JRC",
    url: "https://global-surface-water.appspot.com",
    upstreamCadence: "Annual",
  },
  emodnet: {
    id: "emodnet",
    label: "EMODnet Bathymetry",
    shortLabel: "EMODNET",
    url: "https://emodnet.ec.europa.eu",
    upstreamCadence: "Annual",
  },

  /* ── Mobility ──────────────────────────────────────────── */
  opensky: {
    id: "opensky",
    label: "OpenSky Network ADS-B",
    shortLabel: "OPENSKY",
    url: "https://opensky-network.org",
    upstreamCadence: "10 sec",
  },
};
