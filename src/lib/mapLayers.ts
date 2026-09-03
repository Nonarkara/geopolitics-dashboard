// Catalog of base maps and overlay layers for the V8 map.
// Each entry carries attribution + a cadence field so the UI can
// render "updated N days ago" alongside every toggle.

export type Cadence = "real-time" | "10-minute" | "hourly" | "daily" | "3-hour" | "8-day" | "annual" | "static";

export interface MapSource {
  id: string;
  label: string;         // short code (3-letter) shown in toggles
  name: string;          // long name shown in tooltips / info card
  source: string;        // attribution text
  sourceUrl?: string;
  cadence: Cadence;
  maxZoom: number;
}

export interface BaseMapEntry extends MapSource {
  kind: "raster-xyz" | "gibs";
  urlTemplate?: string;  // for raster-xyz
  gibsLayer?: string;    // for gibs
  gibsFormat?: "jpg" | "png";
  needsDate?: boolean;   // if true, substitute {date}; uses "best recent" date
}

export interface OverlayEntry extends MapSource {
  kind: "raster-xyz" | "gibs";
  urlTemplate?: string;
  gibsLayer?: string;
  gibsFormat?: "jpg" | "png";
  needsDate?: boolean;
  category: "ATMOSPHERE" | "THERMAL" | "VEGETATION" | "HYDRO" | "INFRASTRUCTURE";
  defaultOpacity: number;
}

// ── Base maps ────────────────────────────────────────────────
// All render as raster tiles on top of a blank MapLibre GL style.
export const BASE_MAPS: BaseMapEntry[] = [
  {
    id: "ESRI_SAT",
    label: "SAT",
    name: "ESRI World Imagery (satellite)",
    kind: "raster-xyz",
    urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    source: "ESRI · Maxar · Earthstar Geographics",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9",
    cadence: "annual",
    maxZoom: 19,
  },
  {
    id: "ESRI_TOPO",
    label: "TOPO",
    name: "ESRI World Topographic",
    kind: "raster-xyz",
    urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    source: "ESRI Topographic",
    sourceUrl: "https://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f",
    cadence: "annual",
    maxZoom: 19,
  },
  {
    id: "OSM",
    label: "OSM",
    name: "OpenStreetMap (streets + roads)",
    kind: "raster-xyz",
    urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    source: "OpenStreetMap contributors",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    cadence: "real-time",
    maxZoom: 19,
  },
  {
    id: "CARTO_DARK",
    label: "DARK",
    name: "CartoDB Dark Matter",
    kind: "raster-xyz",
    urlTemplate: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    source: "CARTO · OpenStreetMap",
    sourceUrl: "https://carto.com/basemaps/",
    cadence: "real-time",
    maxZoom: 20,
  },
  {
    id: "CARTO_LIGHT",
    label: "LITE",
    name: "CartoDB Positron (light)",
    kind: "raster-xyz",
    urlTemplate: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
    source: "CARTO · OpenStreetMap",
    sourceUrl: "https://carto.com/basemaps/",
    cadence: "real-time",
    maxZoom: 20,
  },
  {
    id: "S2_CLOUDLESS",
    label: "S2C",
    name: "Sentinel-2 Cloudless 10m (2021)",
    kind: "raster-xyz",
    urlTemplate: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg",
    source: "EOX · Sentinel-2 ESA Copernicus",
    sourceUrl: "https://s2maps.eu/",
    cadence: "annual",
    maxZoom: 15,
  },
  {
    id: "VIIRS_TRUE",
    label: "VRS",
    name: "VIIRS True Color (daily)",
    kind: "gibs",
    gibsLayer: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    gibsFormat: "jpg",
    source: "NASA Worldview · VIIRS SNPP",
    sourceUrl: "https://worldview.earthdata.nasa.gov/",
    cadence: "daily",
    maxZoom: 9,
    needsDate: true,
  },
];

// ── Overlay layers ───────────────────────────────────────────
export const OVERLAYS: OverlayEntry[] = [
  // Atmosphere
  {
    id: "AOD",
    label: "AOD",
    name: "Aerosol Optical Depth (air quality)",
    category: "ATMOSPHERE",
    kind: "gibs",
    gibsLayer: "MODIS_Combined_Value_Added_AOD",
    gibsFormat: "png",
    source: "NASA MODIS Combined · Level 3",
    sourceUrl: "https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MODIS_Combined_Value_Added_AOD/",
    cadence: "daily",
    maxZoom: 6,
    defaultOpacity: 0.55,
    needsDate: true,
  },
  {
    id: "RNF",
    label: "RNF",
    name: "Precipitation Rate (IMERG)",
    category: "ATMOSPHERE",
    kind: "gibs",
    gibsLayer: "IMERG_Precipitation_Rate",
    gibsFormat: "png",
    source: "NASA GPM IMERG",
    sourceUrl: "https://gpm.nasa.gov/data/imerg",
    cadence: "3-hour",
    maxZoom: 6,
    defaultOpacity: 0.55,
    needsDate: true,
  },
  {
    id: "LST",
    label: "LST",
    name: "Land Surface Temperature (day)",
    category: "ATMOSPHERE",
    kind: "gibs",
    gibsLayer: "MODIS_Terra_Land_Surface_Temp_Day",
    gibsFormat: "png",
    source: "NASA MODIS Terra",
    sourceUrl: "https://lance.modaps.eosdis.nasa.gov/data_products/",
    cadence: "daily",
    maxZoom: 7,
    defaultOpacity: 0.5,
    needsDate: true,
  },
  {
    id: "CO",
    label: "CO",
    name: "Carbon Monoxide (MOPITT total column)",
    category: "ATMOSPHERE",
    kind: "gibs",
    gibsLayer: "MOPITT_CO_Daily_Total_Column_Day",
    gibsFormat: "png",
    source: "NASA MOPITT · Terra",
    sourceUrl: "https://www2.acom.ucar.edu/mopitt",
    cadence: "daily",
    maxZoom: 5,
    defaultOpacity: 0.5,
    needsDate: true,
  },
  // Thermal
  {
    id: "FIR",
    label: "FIR",
    name: "MODIS Thermal Anomalies / Fires",
    category: "THERMAL",
    kind: "gibs",
    gibsLayer: "MODIS_Terra_Thermal_Anomalies_Day",
    gibsFormat: "png",
    source: "NASA MODIS Terra (day)",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov/",
    cadence: "daily",
    maxZoom: 8,
    defaultOpacity: 0.8,
    needsDate: true,
  },
  // Vegetation
  {
    id: "EVI",
    label: "EVI",
    name: "Enhanced Vegetation Index (8-day)",
    category: "VEGETATION",
    kind: "gibs",
    gibsLayer: "MODIS_Terra_EVI_8Day",
    gibsFormat: "png",
    source: "NASA MODIS Terra · MOD13A2",
    sourceUrl: "https://modis.gsfc.nasa.gov/data/dataprod/mod13.php",
    cadence: "8-day",
    maxZoom: 9,
    defaultOpacity: 0.5,
    needsDate: true,
  },
  // Infrastructure
  {
    id: "NGT",
    label: "NGT",
    name: "Night Lights (VIIRS Day/Night Band)",
    category: "INFRASTRUCTURE",
    kind: "gibs",
    gibsLayer: "VIIRS_SNPP_DayNightBand_AtSensor_M15",
    gibsFormat: "png",
    source: "NASA VIIRS SNPP",
    sourceUrl: "https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VIIRS_SNPP_DayNightBand_AtSensor_M15/",
    cadence: "daily",
    maxZoom: 8,
    defaultOpacity: 0.7,
    needsDate: true,
  },
  // Hydro
  {
    id: "SWO",
    label: "SWO",
    name: "Surface Water Occurrence (1984–2021)",
    category: "HYDRO",
    kind: "raster-xyz",
    urlTemplate: "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png",
    source: "EC JRC · Google Global Surface Water",
    sourceUrl: "https://global-surface-water.appspot.com/",
    cadence: "static",
    maxZoom: 13,
    defaultOpacity: 0.65,
  },
  {
    id: "BAT",
    label: "BAT",
    name: "Bathymetry (EMODnet)",
    category: "HYDRO",
    kind: "raster-xyz",
    urlTemplate: "https://tiles.emodnet-bathymetry.eu/v12/mean_atlas_land_latest/web_mercator/{z}/{x}/{y}.png",
    source: "EMODnet Bathymetry · European Commission",
    sourceUrl: "https://emodnet.ec.europa.eu/en/bathymetry",
    cadence: "annual",
    maxZoom: 12,
    defaultOpacity: 0.5,
  },
];

// ── Date helpers ─────────────────────────────────────────────

/**
 * NASA GIBS has a processing lag. For daily products, safest to query
 * 2 days ago. For 3-hourly products (IMERG), also 2 days. For 8-day
 * products, 4 days. Returns yyyy-mm-dd.
 */
export function gibsDateFor(cadence: Cadence): string {
  const lagDays = cadence === "8-day" ? 4 : cadence === "static" ? 0 : 2;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lagDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Human-readable "updated N days ago" for display.
 * For static/annual, returns cadence label.
 */
export function freshnessLabel(cadence: Cadence, dateStr?: string): string {
  if (cadence === "static") return "static dataset";
  if (cadence === "annual") return "updated annually";
  if (cadence === "real-time") return "real-time";
  if (!dateStr) return cadence;
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return cadence;
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "captured today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/**
 * Build the XYZ tile URL template used by the MapLibre GL raster source.
 * For GIBS: inserts date + resolution path.
 * For static XYZ: returns as-is.
 */
export function buildTileUrl(entry: BaseMapEntry | OverlayEntry, dateOverride?: string): string {
  if (entry.kind === "raster-xyz" && entry.urlTemplate) return entry.urlTemplate;
  if (entry.kind === "gibs" && entry.gibsLayer) {
    const date = entry.needsDate ? (dateOverride || gibsDateFor(entry.cadence)) : "default";
    const fmt = entry.gibsFormat || "jpg";
    // GIBS tile matrix. We use GoogleMapsCompatible_Level{n}.
    const level = entry.maxZoom >= 9 ? 9 : entry.maxZoom >= 8 ? 8 : entry.maxZoom >= 7 ? 7 : 6;
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${entry.gibsLayer}/default/${date}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${fmt}`;
  }
  return "";
}
