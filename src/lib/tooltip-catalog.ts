export interface TooltipContent {
  fn: string;
  shows: string;
  importance: string;
  source: string;
  sourceUrl: string;
}

/* ── Base Maps (12) ──────────────────────────────────────── */

export const BASE_MAP_TOOLTIPS: Record<string, TooltipContent> = {
  ESRI: {
    fn: "Set base imagery to Esri World Imagery",
    shows: "High-resolution satellite and aerial photographs worldwide",
    importance: "Primary visual reference for terrain, structures, and land use identification along border corridors",
    source: "Esri ArcGIS",
    sourceUrl: "https://www.arcgis.com",
  },
  S2C: {
    fn: "Switch to ESA Sentinel-2 cloudless mosaic",
    shows: "10-meter resolution cloud-free composite imagery from 2021",
    importance: "Sharpest free satellite basemap available — ideal for identifying small structures and vegetation patterns",
    source: "EOX / ESA Copernicus",
    sourceUrl: "https://s2maps.eu",
  },
  OSM: {
    fn: "Switch to OpenStreetMap street map",
    shows: "Community-maintained vector street map with roads, buildings, and place names",
    importance: "Best map for road networks, border crossings, and named locations when satellite imagery is insufficient",
    source: "OpenStreetMap",
    sourceUrl: "https://www.openstreetmap.org",
  },
  TOPO: {
    fn: "Switch to Esri World Topographic map",
    shows: "Topographic map with contour lines, elevation shading, roads, and boundaries",
    importance: "Essential for understanding terrain elevation and mountain passes along border regions",
    source: "Esri ArcGIS",
    sourceUrl: "https://www.arcgis.com",
  },
  LITE: {
    fn: "Switch to CartoDB Positron (light theme)",
    shows: "Minimal light-colored base map optimized for data overlay visibility",
    importance: "Clean background that makes colored data overlays (fires, floods, aerosol) stand out clearly",
    source: "CARTO",
    sourceUrl: "https://carto.com",
  },
  DARK: {
    fn: "Switch to CartoDB Dark Matter",
    shows: "Dark-themed base map for night operations and high-contrast overlays",
    importance: "Reduces eye strain during extended monitoring and makes bright overlays (thermal, night lights) more visible",
    source: "CARTO",
    sourceUrl: "https://carto.com",
  },
  VRS: {
    fn: "Switch to VIIRS natural color satellite view",
    shows: "Daily true-color imagery from the VIIRS sensor on Suomi-NPP satellite",
    importance: "Near real-time satellite view showing current cloud cover, smoke plumes, and surface conditions",
    source: "NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  AQU: {
    fn: "Switch to MODIS Aqua true-color view",
    shows: "Afternoon-pass satellite imagery from NASA Aqua (1:30 PM local crossing)",
    importance: "Captures afternoon atmospheric conditions — useful for detecting late-day burning and haze buildup",
    source: "NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  TER: {
    fn: "Switch to MODIS Terra true-color view",
    shows: "Morning-pass satellite imagery from NASA Terra (10:30 AM local crossing)",
    importance: "Early-day satellite pass captures fresh smoke plumes and morning cloud formations before afternoon convection",
    source: "NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  BLU: {
    fn: "Switch to Blue Marble shaded relief",
    shows: "NASA composite terrain map with natural color and elevation shading",
    importance: "Best overview for understanding the physical geography and mountain ranges of the tri-border region",
    source: "NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  HIM: {
    fn: "Switch to Himawari-9 geostationary view",
    shows: "10-minute refresh visible imagery from JAXA's Himawari-9 satellite over Asia-Pacific",
    importance: "Near real-time weather monitoring — tracks typhoons, convective storms, and smoke plumes as they develop",
    source: "JAXA via NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  GRN: {
    fn: "Switch to Geostationary Ring natural color composite",
    shows: "5-satellite global mosaic from EUMETSAT, JAXA, and NOAA geostationary platforms",
    importance: "Full-disk global view useful for tracking large-scale weather systems approaching Southeast Asia",
    source: "EUMETSAT / JAXA / NOAA via NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
};

/* ── Data Overlays (14) ──────────────────────────────────── */

export const OVERLAY_TOOLTIPS: Record<string, TooltipContent> = {
  FLS: {
    fn: "Toggle fire and burn scar detection overlay",
    shows: "MODIS false-color composite (bands 7-2-1) highlighting active fires, burn scars, and thermal anomalies",
    importance: "Critical for cross-border burning season monitoring — Thailand, Myanmar, and Laos fire hotspots are a major security and health concern",
    source: "NASA GIBS (MODIS Terra)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  VFS: {
    fn: "Toggle VIIRS thermal anomaly detection",
    shows: "VIIRS false-color composite emphasizing thermal signatures and active fire fronts",
    importance: "Higher spatial resolution than MODIS — detects smaller fires and industrial thermal sources along borders",
    source: "NASA GIBS (VIIRS SNPP)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  SWI: {
    fn: "Toggle shortwave infrared heat overlay",
    shows: "MODIS surface reflectance bands 7-2-1 showing residual heat and recently burned areas",
    importance: "Reveals post-fire burn patterns even after flames are extinguished — useful for damage assessment",
    source: "NASA GIBS (MODIS Terra)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  AOD: {
    fn: "Toggle aerosol optical depth overlay",
    shows: "Combined MODIS aerosol density map showing smoke, dust, and particulate concentration",
    importance: "Tracks cross-border haze and air pollution events that trigger health alerts and affect visibility for operations",
    source: "NASA GIBS (MODIS Combined)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  LST: {
    fn: "Toggle land surface temperature overlay",
    shows: "Daytime surface temperature measured by MODIS thermal infrared sensors",
    importance: "Identifies urban heat islands, drought stress zones, and unusual thermal activity near border regions",
    source: "NASA GIBS (MODIS Terra)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  CO: {
    fn: "Toggle carbon monoxide concentration overlay",
    shows: "Total column CO measured by the MOPITT instrument on NASA Terra",
    importance: "Traces smoke transport from fires across borders — CO plumes reveal wind-carried pollution paths",
    source: "NASA GIBS (MOPITT)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  RNF: {
    fn: "Toggle precipitation rate overlay",
    shows: "Near real-time precipitation from the IMERG multi-satellite algorithm",
    importance: "Monitors rainfall that affects road conditions, river levels, and flood risk at border crossings",
    source: "NASA GIBS (GPM IMERG)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  EVI: {
    fn: "Toggle Enhanced Vegetation Index overlay",
    shows: "8-day composite vegetation health from MODIS showing plant density and vigor",
    importance: "Detects deforestation, agricultural clearing, and crop health changes along border corridors",
    source: "NASA GIBS (MODIS Terra EVI)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  NGT: {
    fn: "Toggle nighttime lights overlay",
    shows: "VIIRS Day/Night Band showing artificial light sources and nighttime activity",
    importance: "Reveals infrastructure, population density, and unusual nighttime activity patterns in remote border areas",
    source: "NASA GIBS (VIIRS DNB)",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  GRI: {
    fn: "Toggle geostationary infrared overlay",
    shows: "10.8μm infrared channel from geostationary ring showing cloud-top temperatures",
    importance: "Tracks storm development and cloud systems in real time — cold cloud tops indicate active thunderstorms",
    source: "EUMETSAT / JAXA / NOAA via NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  GRA: {
    fn: "Toggle geostationary airmass RGB overlay",
    shows: "Multi-channel composite showing air mass boundaries, jet streams, and moisture distribution",
    importance: "Professional meteorological product for tracking weather fronts and atmospheric features affecting the region",
    source: "EUMETSAT / JAXA / NOAA via NASA GIBS",
    sourceUrl: "https://worldview.earthdata.nasa.gov",
  },
  SWO: {
    fn: "Toggle surface water occurrence overlay",
    shows: "38-year water occurrence frequency from Landsat archive (1984-2021)",
    importance: "Maps permanent vs seasonal water bodies — essential for understanding flood risk and river border dynamics",
    source: "JRC / European Commission",
    sourceUrl: "https://global-surface-water.appspot.com",
  },
  SWC: {
    fn: "Toggle surface water change overlay",
    shows: "Long-term change in surface water extent comparing historical and recent Landsat data",
    importance: "Reveals dam construction, lake shrinkage, and river course changes affecting border geography",
    source: "JRC / European Commission",
    sourceUrl: "https://global-surface-water.appspot.com",
  },
  BAT: {
    fn: "Toggle ocean bathymetry overlay",
    shows: "Seabed depth and terrain from the EMODnet/GEBCO bathymetry grid",
    importance: "Essential for maritime border context in the Andaman Sea and Gulf of Thailand — reveals shipping channels and underwater terrain",
    source: "EMODnet / GEBCO",
    sourceUrl: "https://emodnet.ec.europa.eu",
  },
};

/* ── Intelligence Toggles (7) ────────────────────────────── */

export const INTEL_TOGGLE_TOOLTIPS: Record<string, TooltipContent> = {
  HEAT: {
    fn: "Switch incident display to heatmap mode",
    shows: "Density-weighted heatmap of all conflict incidents, replacing individual point markers",
    importance: "Reveals conflict concentration patterns that individual markers obscure — shows hotspot corridors clearly",
    source: "ACLED / OSINT Fusion",
    sourceUrl: "https://acleddata.com",
  },
  THRM: {
    fn: "Toggle NASA FIRMS thermal hotspot markers",
    shows: "Active fire and thermal anomaly point data from VIIRS and MODIS sensors",
    importance: "Real-time fire detection for cross-border burning, industrial activity, and potential conflict-related fires",
    source: "NASA FIRMS",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov",
  },
  AIR: {
    fn: "Toggle flight path tracking layer",
    shows: "Real-time aircraft positions and flight paths from ADS-B transponder data",
    importance: "Monitors military and civilian air traffic near borders — detects unusual flight patterns and surveillance aircraft",
    source: "OpenSky Network",
    sourceUrl: "https://opensky-network.org",
  },
  FLOW: {
    fn: "Toggle refugee and population movement arcs",
    shows: "Animated arcs showing refugee flows and cross-border population movements",
    importance: "Visualizes displacement patterns from conflict zones — critical for humanitarian response planning",
    source: "UNHCR Refugee Data",
    sourceUrl: "https://www.unhcr.org/refugee-statistics",
  },
  ZONE: {
    fn: "Toggle conflict zone boundaries",
    shows: "Polygons marking active conflict zones with severity coloring",
    importance: "Defines no-go areas and contested regions — provides spatial context for all other intelligence layers",
    source: "ACLED / Intelligence Fusion",
    sourceUrl: "https://acleddata.com",
  },
  LBL: {
    fn: "Toggle province label overlays",
    shows: "Thai province names and administrative boundary labels on the map",
    importance: "Provides geographic reference for briefings and reports — helps identify which province an incident belongs to",
    source: "Static Reference Data",
    sourceUrl: "https://www.openstreetmap.org",
  },
  GRID: {
    fn: "Toggle distance measurement grid",
    shows: "Kilometer-spaced grid lines with distance markers for spatial reference",
    importance: "Enables quick distance estimation between points — essential for operational planning and response time calculation",
    source: "DrNon Global Satellite Toolkit",
    sourceUrl: "https://github.com/Nonarkara/DrNon-Global-Satellite-Toolkit",
  },
};

/* ── Top Bar Buttons ─────────────────────────────────────── */

export const TOPBAR_TOOLTIPS: Record<string, TooltipContent> = {
  apis: {
    fn: "Open the APIs & System Architecture panel",
    shows: "Complete catalog of 29+ internal API routes and 38+ external data providers powering this dashboard",
    importance: "Transparency layer — verify exactly which data sources feed each panel and check live service health",
    source: "Dashboard System",
    sourceUrl: "#",
  },
  data: {
    fn: "Open the Database Explorer panel",
    shows: "Direct access to stored datasets including conflict events, market data, fire records, and cached intelligence",
    importance: "Enables ad-hoc queries, data export, and verification of raw data behind dashboard visualizations",
    source: "PostgreSQL + Supabase",
    sourceUrl: "#",
  },
  docs: {
    fn: "Open the Operator Manual",
    shows: "6-page guided walkthrough of every dashboard zone with annotated screenshots and operational workflows",
    importance: "Essential onboarding for new operators — explains how to read, navigate, and act on dashboard intelligence",
    source: "Dashboard Documentation",
    sourceUrl: "#",
  },
};
