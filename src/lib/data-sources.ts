export interface DataSourceAttribution {
  id: string;
  label: string;
  shortLabel: string;
  url: string;
  refreshInterval: string;
}

/** Every upstream data source used by the dashboard, keyed by feed ID. */
export const DATA_SOURCE_CATALOG: Record<string, DataSourceAttribution> = {
  /* ── Border Status Strip feeds ─────────────────────────── */
  traffic: {
    id: "traffic",
    label: "Longdo Traffic API",
    shortLabel: "LONGDO",
    url: "https://www.longdo.com",
    refreshInterval: "2 min",
  },
  earthquakes: {
    id: "earthquakes",
    label: "USGS Earthquake Hazards Program",
    shortLabel: "USGS",
    url: "https://earthquake.usgs.gov",
    refreshInterval: "5 min",
  },
  flood: {
    id: "flood",
    label: "Open-Meteo River Discharge API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    refreshInterval: "30 min",
  },
  disasters: {
    id: "disasters",
    label: "GDACS — Global Disaster Alerting",
    shortLabel: "GDACS",
    url: "https://www.gdacs.org",
    refreshInterval: "10 min",
  },
  commodities: {
    id: "commodities",
    label: "NABC Thai Agricultural Commodities",
    shortLabel: "NABC",
    url: "https://www.nabc.go.th",
    refreshInterval: "1 hr",
  },

  /* ── Environmental ─────────────────────────────────────── */
  fires: {
    id: "fires",
    label: "NASA FIRMS Active Fire Data",
    shortLabel: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov",
    refreshInterval: "6 hr",
  },
  airQuality: {
    id: "airQuality",
    label: "Open-Meteo Air Quality API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    refreshInterval: "1 hr",
  },
  rainfall: {
    id: "rainfall",
    label: "Open-Meteo Forecast API",
    shortLabel: "OPEN-METEO",
    url: "https://open-meteo.com",
    refreshInterval: "1 hr",
  },

  /* ── Conflict & Intelligence ───────────────────────────── */
  acled: {
    id: "acled",
    label: "ACLED Armed Conflict Events",
    shortLabel: "ACLED",
    url: "https://acleddata.com",
    refreshInterval: "24 hr",
  },
  refugees: {
    id: "refugees",
    label: "UNHCR Refugee Data Finder",
    shortLabel: "UNHCR",
    url: "https://www.unhcr.org/refugee-statistics",
    refreshInterval: "24 hr",
  },
  hdx: {
    id: "hdx",
    label: "HDX HAPI Humanitarian Data",
    shortLabel: "HDX",
    url: "https://data.humdata.org",
    refreshInterval: "24 hr",
  },

  /* ── Markets & Economics ───────────────────────────────── */
  fx: {
    id: "fx",
    label: "ExchangeRate API (Open)",
    shortLabel: "ER-API",
    url: "https://open.er-api.com",
    refreshInterval: "24 hr",
  },
  crypto: {
    id: "crypto",
    label: "Binance Spot Ticker",
    shortLabel: "BINANCE",
    url: "https://www.binance.com",
    refreshInterval: "5 min",
  },
  worldBank: {
    id: "worldBank",
    label: "World Bank WDI",
    shortLabel: "WORLD BANK",
    url: "https://data.worldbank.org",
    refreshInterval: "30 days",
  },

  /* ── News & OSINT ──────────────────────────────────────── */
  bbc: {
    id: "bbc",
    label: "BBC World RSS",
    shortLabel: "BBC",
    url: "https://www.bbc.com/news/world",
    refreshInterval: "15 min",
  },
  cna: {
    id: "cna",
    label: "Channel NewsAsia RSS",
    shortLabel: "CNA",
    url: "https://www.channelnewsasia.com",
    refreshInterval: "15 min",
  },
  googleNews: {
    id: "googleNews",
    label: "Google News RSS",
    shortLabel: "GOOGLE",
    url: "https://news.google.com",
    refreshInterval: "15 min",
  },
  gdelt: {
    id: "gdelt",
    label: "GDELT DOC 2.0 API",
    shortLabel: "GDELT",
    url: "https://api.gdeltproject.org",
    refreshInterval: "15 min",
  },

  /* ── Mapping & Imagery ─────────────────────────────────── */
  nasaGibs: {
    id: "nasaGibs",
    label: "NASA GIBS Worldview",
    shortLabel: "NASA GIBS",
    url: "https://worldview.earthdata.nasa.gov",
    refreshInterval: "Daily",
  },
  esri: {
    id: "esri",
    label: "Esri ArcGIS World Imagery",
    shortLabel: "ESRI",
    url: "https://www.arcgis.com",
    refreshInterval: "Quarterly",
  },
  osm: {
    id: "osm",
    label: "OpenStreetMap",
    shortLabel: "OSM",
    url: "https://www.openstreetmap.org",
    refreshInterval: "Continuous",
  },
  eox: {
    id: "eox",
    label: "EOX Sentinel-2 Cloudless",
    shortLabel: "EOX",
    url: "https://s2maps.eu",
    refreshInterval: "Annual",
  },
  cartodb: {
    id: "cartodb",
    label: "CartoDB Basemaps",
    shortLabel: "CARTO",
    url: "https://carto.com",
    refreshInterval: "Continuous",
  },
  jrc: {
    id: "jrc",
    label: "JRC Global Surface Water",
    shortLabel: "JRC",
    url: "https://global-surface-water.appspot.com",
    refreshInterval: "Annual",
  },
  emodnet: {
    id: "emodnet",
    label: "EMODnet Bathymetry",
    shortLabel: "EMODNET",
    url: "https://emodnet.ec.europa.eu",
    refreshInterval: "Annual",
  },

  /* ── Mobility ──────────────────────────────────────────── */
  opensky: {
    id: "opensky",
    label: "OpenSky Network ADS-B",
    shortLabel: "OPENSKY",
    url: "https://opensky-network.org",
    refreshInterval: "10 sec",
  },
};
