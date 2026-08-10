export type ArchitectureSectionId =
  | "overview"
  | "flow"
  | "internal-apis"
  | "external-providers"
  | "runtime";

export type ArchitectureLayerTone =
  | "client"
  | "api"
  | "fusion"
  | "storage"
  | "external";

export type InternalApiCategory =
  | "System"
  | "Mapping"
  | "Environment"
  | "Operations"
  | "Analytics"
  | "Intelligence";

export type ExternalProviderCategory =
  | "News"
  | "Environmental"
  | "Mobility"
  | "Markets"
  | "Mapping & Media"
  | "Satellite Imagery"
  | "Maritime & Aviation"
  | "Financial Intelligence"
  | "Humanitarian"
  | "Cyber & Infrastructure"
  | "Prediction & Sentiment"
  | "Research & Reference"
  | "Optional";

export interface ArchitectureSection {
  id: ArchitectureSectionId;
  label: string;
  description: string;
}

export interface DashboardSurface {
  id: string;
  title: string;
  summary: string;
}

export interface ArchitectureLayer {
  id: string;
  title: string;
  tone: ArchitectureLayerTone;
  summary: string;
  bullets: string[];
}

export interface ArchitectureFlowStep {
  id: string;
  title: string;
  summary: string;
  outputs: string[];
}

export interface InternalApiDescriptor {
  path: string;
  category: InternalApiCategory;
  purpose: string;
  consumers: string[];
  upstreams: string[];
  fallback: string;
}

export interface ExternalProviderDescriptor {
  id: string;
  label: string;
  category: ExternalProviderCategory;
  description: string;
  surfaces: string[];
  endpoints: string[];
  optional?: boolean;
}

export const architectureSections: ArchitectureSection[] = [
  {
    id: "overview",
    label: "Overview",
    description: "UI surfaces, core layers, and the dashboard boundary.",
  },
  {
    id: "flow",
    label: "Data Flow",
    description: "How signals move from providers into curated operator views.",
  },
  {
    id: "internal-apis",
    label: "Internal APIs",
    description: "Every Next.js route exposed by this dashboard.",
  },
  {
    id: "external-providers",
    label: "External APIs",
    description: "All upstream services, feeds, tile servers, and optional enrichers.",
  },
  {
    id: "runtime",
    label: "Runtime",
    description: "Live service posture, storage, cache, and failover behavior.",
  },
];

export const dashboardSurfaces: DashboardSurface[] = [
  {
    id: "top-bar",
    title: "Top Bar",
    summary:
      "Regional clocks plus temperature and AQI snapshots, with entry points for the manual, architecture view, and database explorer.",
  },
  {
    id: "sidebar",
    title: "Sidebar",
    summary:
      "Command context, recent signals, priority checks, and area-pressure cues.",
  },
  {
    id: "map",
    title: "Regional Map",
    summary:
      "DeckGL and raster overlays for focus zones, signals, fires, rainfall, flights, movements, aerosol, AQI, and PM2.5.",
  },
  {
    id: "bottom-strip",
    title: "Bottom Analytics Strip",
    summary:
      "Markets, local trends, trending keywords, and source health for rapid cross-checking.",
  },
  {
    id: "intel-rail",
    title: "Intelligence Rail",
    summary:
      "Briefing packages, live regional TV embeds, and curated news extracted from the intelligence fusion layer.",
  },
  {
    id: "modal-layer",
    title: "Operator Overlays",
    summary:
      "Manual, architecture, and database-explorer modals that explain the system and expose stored data.",
  },
];

export const architectureLayers: ArchitectureLayer[] = [
  {
    id: "client",
    title: "Client Surfaces",
    tone: "client",
    summary:
      "React client components render the map, sidebars, charts, ticker, and modal overlays.",
    bullets: [
      "TopBar, map surface, Sidebar, BriefingPanel, NewsDesk, EconomicMonitor, ConflictTrends, TrendingKeywords, SignalTicker.",
      "The browser only talks to internal `/api/*` routes and local static assets.",
      "Modal documentation lives in the same app shell so operators do not leave the dashboard.",
    ],
  },
  {
    id: "api",
    title: "Internal API Layer",
    tone: "api",
    summary:
      "Next.js route handlers normalize all browser requests behind one controlled surface.",
    bullets: [
      "Routes cover environment, incidents, markets, intelligence, overlays, convergence, and health.",
      "Components fetch curated internal payloads instead of calling external providers directly.",
      "Fallback payloads keep panels rendering when upstreams or storage are unavailable.",
    ],
  },
  {
    id: "fusion",
    title: "Fusion and Scoring Layer",
    tone: "fusion",
    summary:
      "Library modules join siloed sources into news, tickers, package briefs, overlays, and area convergence.",
    bullets: [
      "`src/lib/intelligence.ts` deduplicates feeds, scores severity and freshness, and emits briefing/news/ticker/source views.",
      "`src/lib/convergence.ts` fuses incidents, news, markets, rainfall, thermal, and movement into area posture.",
      "`src/lib/map-overlays.ts` and `src/services/map-engine.ts` define overlay catalogs and render layers.",
    ],
  },
  {
    id: "storage",
    title: "Storage and Cache Layer",
    tone: "storage",
    summary:
      "Single-backbone architecture: Supabase Postgres stores operational state, history, refresh telemetry, and archival playback snapshots.",
    bullets: [
      "Core tables include `events`, `fire_events`, `rainfall_data`, `market_data`, `macro_country_snapshots`, `air_quality_snapshots`, `country_economic_indicators`, `signal_archive`, `feed_health`, and `data_snapshots`.",
      "Realtime and snapshot telemetry still live inside the same Supabase project rather than in a second production store.",
      "Intelligence and convergence can still keep memory-backed stale-safe payloads, but production truth is written back to Postgres-first tables.",
      "Static assets include regional GeoJSON, manual screenshots, and deterministic overlay catalogs.",
      "Graceful degradation is still available for local development, but production posture assumes the Supabase backbone is configured.",
    ],
  },
  {
    id: "external",
    title: "External Provider Layer",
    tone: "external",
    summary:
      "Weather, air quality, mobility, finance, RSS, imagery, and optional AI/media services feed the app.",
    bullets: [
      "External providers are never called directly from the map or charts; the server mediates them first.",
      "Raster tile services such as NASA GIBS, ESRI, and OSM feed the map base and analytic layers.",
      "Optional services such as OpenAI enrich the system without being required for baseline operation.",
    ],
  },
];

export const architectureFlowSteps: ArchitectureFlowStep[] = [
  {
    id: "operator-action",
    title: "Operator interaction",
    summary:
      "A panel loads or refreshes after the operator opens the dashboard, changes overlays, or requests a detail view.",
    outputs: ["UI event", "local state update", "internal fetch request"],
  },
  {
    id: "route-entry",
    title: "Internal route entry",
    summary:
      "The browser calls a local `/api/*` endpoint instead of reaching out to third-party providers directly.",
    outputs: ["route handler", "request timeout guards", "typed JSON response contract"],
  },
  {
    id: "loaders",
    title: "Loader fan-out",
    summary:
      "Route handlers call loaders in `lib/` or `services/` that pull from Postgres, cached payloads, or remote APIs.",
    outputs: ["database reads", "external fetches", "fallback selection"],
  },
  {
    id: "normalization",
    title: "Normalization and fusion",
    summary:
      "The app deduplicates, scores, tags, and reshapes raw inputs into route-specific payloads.",
    outputs: ["curated news", "ticker items", "overlay catalog", "convergence alerts"],
  },
  {
    id: "resilience",
    title: "Resilience pass",
    summary:
      "If live data is missing or stale, the route substitutes cache-backed or curated fallback payloads.",
    outputs: ["stale-safe payload", "no blank panels", "graceful degradation"],
  },
  {
    id: "render",
    title: "Render and inspect",
    summary:
      "Client components render the curated payloads into charts, cards, map layers, and operator documentation.",
    outputs: ["visual insight", "tooltips", "selected-place popup", "operator-facing explanation"],
  },
];

export const resiliencePatterns = [
  "Every external fetch path is wrapped with a timeout and a fallback branch.",
  "Mapbox is gone. The map renders on free raster tile basemaps (ESRI / OSM / CartoDB / NASA GIBS) with MapLibre GL — no token, no account, no billing.",
  "Intelligence and convergence can serve cached or synthesized payloads when feeds fail.",
  "Playback routes fail closed on invalid windows and storage failures instead of silently leaking live data.",
  "Grouped Vercel cron routes record their own freshness snapshots so scheduler health is observable in `/api/status`.",
  "Overlay metadata is generated locally, so control surfaces stay usable even when imagery providers are slow.",
  "V5.0 real-time refresh: shared useFetch hook exposes isRefreshing, lastRefreshed, and manual refresh. Bottom strip shows live feed health with per-source status dots.",
  "Supabase remains the single production backbone; missing config is treated as a degraded local-only posture, not an equivalent production mode.",
];

export const storageNotes = [
  "Primary analytical storage: Postgres via `query()` in `src/lib/db.ts`.",
  "Primary operational tables: `events`, `fire_events`, `rainfall_data`, `market_data`, `air_quality_snapshots`, `macro_country_snapshots`, `country_economic_indicators`, `signal_archive`, `feed_health`, and `data_snapshots`.",
  "Supplementary live features such as Realtime still run inside the same Supabase project rather than a second production data tier.",
  "Hybrid caches: intelligence cache and area convergence snapshots.",
  "Static assets: `public/data/*.geojson`, `public/manual/*`, and generated overlay catalog metadata.",
  "Runtime feature gates: `DATABASE_URL`, `CRON_SECRET`, `REFERENCE_DASHBOARD_URL`, `OPENAI_API_KEY`.",
  "Supabase gates: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.",
];

export const internalApiCategoryOrder: InternalApiCategory[] = [
  "System",
  "Mapping",
  "Environment",
  "Operations",
  "Analytics",
  "Intelligence",
];

export const internalApiCatalog: InternalApiDescriptor[] = [
  {
    path: "/api/status",
    category: "System",
    purpose:
      "Reports Vercel-first runtime posture for app health, database readiness, grouped cron freshness, per-dataset freshness, fallback posture, and AI summary configuration.",
    consumers: ["Architecture modal", "ops diagnostics", "external health checks"],
    upstreams: ["Environment configuration", "data_snapshots", "feed_health"],
    fallback: "Returns a degraded but truthful runtime envelope with `no-store` semantics instead of caching stale success.",
  },
  {
    path: "/api/cron/conflict-intel",
    category: "System",
    purpose:
      "Grouped Vercel-cron entrypoint that warms command brief, border OSINT, news, ticker, and intelligence package caches.",
    consumers: ["Vercel Cron", "operators triggering controlled warmups"],
    upstreams: ["Internal intelligence and border routes"],
    fallback:
      "Requires `Authorization: Bearer ${CRON_SECRET}` in production and records success or failure in `data_snapshots` plus `feed_health`.",
  },
  {
    path: "/api/cron/environment-thermal",
    category: "System",
    purpose:
      "Grouped Vercel-cron entrypoint that refreshes environment, disaster, and thermal surfaces.",
    consumers: ["Vercel Cron"],
    upstreams: ["Internal environment and disaster routes"],
    fallback:
      "Records scheduler truth in `data_snapshots` instead of hiding freshness gaps.",
  },
  {
    path: "/api/cron/markets-macro",
    category: "System",
    purpose:
      "Grouped Vercel-cron entrypoint that warms market, macro, and commodity surfaces backed by stored snapshots.",
    consumers: ["Vercel Cron"],
    upstreams: ["Internal market and commodity routes"],
    fallback:
      "Records partial failure details in the cron payload instead of pretending the whole group refreshed cleanly.",
  },
  {
    path: "/api/sources",
    category: "System",
    purpose:
      "Builds the source-health view for upstream feeds and discovered reference APIs.",
    consumers: ["SourceStack"],
    upstreams: ["`buildEnhancedSourceCatalog()`", "reference dashboard discovery", "intelligence feed health checks"],
    fallback: "Returns `fallbackSources` if source inspection fails.",
  },
  {
    path: "/api/data/catalog",
    category: "System",
    purpose:
      "Returns the curated list of database tables exposed for in-app preview and export.",
    consumers: ["DatabaseExplorerModal"],
    upstreams: ["Postgres table summaries"],
    fallback:
      "Returns an empty catalog with `databaseConfigured: false` when the database is not available.",
  },
  {
    path: "/api/data/table",
    category: "System",
    purpose:
      "Returns a limited preview of an allowlisted database table for in-app inspection.",
    consumers: ["DatabaseExplorerModal"],
    upstreams: ["Postgres table preview queries"],
    fallback:
      "Returns an empty preview when the database is not configured and rejects unknown table ids.",
  },
  {
    path: "/api/data/export",
    category: "System",
    purpose:
      "Exports an allowlisted database table as CSV or JSON using the same curated columns shown in the explorer.",
    consumers: ["DatabaseExplorerModal", "operators exporting snapshots"],
    upstreams: ["Postgres export queries"],
    fallback:
      "Returns `503` when the database is not configured and rejects unknown table ids or formats.",
  },
  {
    path: "/api/map/overlays",
    category: "Mapping",
    purpose:
      "Exposes the overlay catalog, default basemap choice, and overlay metadata used by operator controls.",
    consumers: ["SourceStack", "API clients"],
    upstreams: ["`buildMapOverlayCatalog()`"],
    fallback: "Deterministic local generation, no remote dependency required.",
  },
  {
    path: "/api/copernicus/preview",
    category: "Mapping",
    purpose:
      "Summarizes base imagery options and focus date for imagery preview clients.",
    consumers: ["API clients", "imagery diagnostics"],
    upstreams: ["Overlay catalog"],
    fallback: "Returns `fallbackCopernicusPreview` when catalog generation fails.",
  },
  {
    path: "/api/environment",
    category: "Environment",
    purpose:
      "Provides top-bar capital-city temperature and AQI snapshots across Southeast Asia.",
    consumers: ["TopBar"],
    upstreams: ["Open-Meteo weather", "Open-Meteo air quality"],
    fallback: "Merges in curated capital-city fallback values when live calls return null.",
  },
  {
    path: "/api/air-quality",
    category: "Environment",
    purpose:
      "Provides AQI and PM2.5 station data for air-quality heatmaps and map tooltips.",
    consumers: ["Map surface"],
    upstreams: ["Open-Meteo air quality", "Postgres `air_quality_snapshots`"],
    fallback:
      "Returns the latest stored station snapshots when live calls fail, then curated southern Thailand station values as a final fallback.",
  },
  {
    path: "/api/rainfall",
    category: "Environment",
    purpose:
      "Returns rainfall anomaly points mapped onto Phuket- and Andaman-relevant locations.",
    consumers: ["Map surface", "convergence scoring"],
    upstreams: ["Postgres `rainfall_data`"],
    fallback: "Returns `fallbackRainfall` when the database is empty or unavailable.",
  },
  {
    path: "/api/incidents",
    category: "Operations",
    purpose:
      "Delivers geocoded incident features for the map, sidebar, and incident-driven intelligence.",
    consumers: ["Map surface", "Sidebar", "convergence scoring"],
    upstreams: ["Postgres `events` via `loadThailandIncidents()`"],
    fallback: "Returns `fallbackIncidents` when the event store is unavailable.",
  },
  {
    path: "/api/border/incidents",
    category: "Operations",
    purpose:
      "Delivers a border-filtered incident layer for the Myanmar, Cambodia, and Malaysia frontiers.",
    consumers: ["Border map", "border command", "border news and ticker"],
    upstreams: ["Postgres `events` via `loadThailandIncidents()`", "border-region filtering"],
    fallback:
      "Returns curated tri-border incidents when the database is unavailable or when live events are outside the command footprint.",
  },
  {
    path: "/api/fires",
    category: "Operations",
    purpose:
      "Returns thermal hotspot events for fire layers and local thermal evidence.",
    consumers: ["Map surface", "convergence scoring"],
    upstreams: ["Postgres `fire_events`"],
    fallback: "Returns `fallbackFires` on query failure or empty result.",
  },
  {
    path: "/api/movements",
    category: "Operations",
    purpose:
      "Provides curated visitor-flow traces for airport, town, beach, and pier movement overlays.",
    consumers: ["Map surface", "convergence scoring"],
    upstreams: ["Curated fallback movement traces", "legacy `population_movements` cache"],
    fallback: "Returns `fallbackRefugees` as a local visitor-flow stand-in when no live mobility feed is configured.",
  },
  {
    path: "/api/border/movements",
    category: "Operations",
    purpose:
      "Provides tri-border movement overlays, with Myanmar humanitarian pressure enriched by UNHCR refugee counts.",
    consumers: ["Border map", "border command"],
    upstreams: ["UNHCR Refugee Data Finder", "curated crossing and freight traces"],
    fallback:
      "Returns static Myanmar, Cambodia, and Malaysia corridor traces when live humanitarian counts are unavailable.",
  },
  {
    path: "/api/flights",
    category: "Operations",
    purpose:
      "Provides live or fallback regional flight tracks for air-traffic context.",
    consumers: ["Map surface"],
    upstreams: ["OpenSky states API"],
    fallback: "Returns curated fallback flights when OpenSky is unavailable.",
  },
  {
    path: "/api/conflict-trends",
    category: "Analytics",
    purpose:
      "Builds the by-area and fatality trend panels from recent event history.",
    consumers: ["ConflictTrends"],
    upstreams: ["Postgres `events`"],
    fallback: "Returns a packaged regional trend snapshot if queries fail.",
  },
  {
    path: "/api/trends",
    category: "Analytics",
    purpose:
      "Tracks conflict-related Google Trends signals across Thailand, Cambodia, and Myanmar.",
    consumers: ["TrendingKeywords"],
    upstreams: ["Google Trends RSS", "curated conflict terms"],
    fallback: "Returns the curated term set if RSS fetches fail.",
  },
  {
    path: "/api/markets",
    category: "Analytics",
    purpose:
      "Returns the market radar payload used by the economic monitor panel.",
    consumers: ["EconomicMonitor"],
    upstreams: [
      "Reference dashboard discovery",
      "ER API FX rates",
      "Binance BTC ticker",
      "World Bank GDP and GDP per capita",
      "Postgres `market_data` and `macro_country_snapshots`",
    ],
    fallback:
      "Returns the latest stored market and macro snapshots when live feeds fail and otherwise fails closed with a 503 instead of serving packaged demo indicators.",
  },
  {
    path: "/api/economics",
    category: "Analytics",
    purpose:
      "Exposes an alternate market/economic endpoint that prefers reference feeds and then local DB history.",
    consumers: ["API clients", "future analytics views"],
    upstreams: ["Reference market loaders", "Postgres `market_data`"],
    fallback: "Returns `fallbackEconomicIndicators` if both live and DB-backed loaders fail.",
  },
  {
    path: "/api/intelligence/packages",
    category: "Intelligence",
    purpose:
      "Builds the package-level intelligence view that powers briefing panels and downstream derived products.",
    consumers: ["BriefingPanel", "convergence scoring", "API clients"],
    upstreams: ["RSS and JSON feeds", "reference markets", "Postgres incidents/weather/movement/fire", "intelligence cache"],
    fallback: "Serves cache-backed or synthesized stale payloads rather than dropping the briefing surface.",
  },
  {
    path: "/api/border/osint",
    category: "Intelligence",
    purpose:
      "Builds the border OSINT cache used for narrative corroboration, humanitarian context, and provider health.",
    consumers: ["Border command", "border news", "future provider diagnostics"],
    upstreams: ["GDELT DOC 2", "UNHCR Refugee Data Finder", "optional ACLED configuration"],
    fallback:
      "Serves cached or curated humanitarian snapshots when live OSINT providers are slow, rate-limited, or unavailable.",
  },
  {
    path: "/api/border/news",
    category: "Intelligence",
    purpose:
      "Builds the border news desk from GDELT narrative matches, UNHCR displacement context, field incidents, and markets.",
    consumers: ["BorderNewsDesk"],
    upstreams: ["Border OSINT cache", "border incidents", "reference markets"],
    fallback:
      "Historical mode serves archive snapshots, and live mode fails closed on real backend failure instead of returning packaged demo headlines.",
  },
  {
    path: "/api/border/ticker",
    category: "Intelligence",
    purpose:
      "Builds the tri-border ticker with FX, field pressure, narrative volume, and humanitarian context.",
    consumers: ["SignalTicker"],
    upstreams: ["Border OSINT cache", "border incidents", "reference markets"],
    fallback:
      "Historical mode serves archive snapshots, and live mode fails closed on real backend failure instead of returning packaged demo ticker items.",
  },
  {
    path: "/api/border-command/brief",
    category: "Intelligence",
    purpose:
      "Builds the executive border brief with area scoring, concerns, intervention queue, and cited source labels.",
    consumers: ["TopBar", "Sidebar", "border dashboard shell"],
    upstreams: ["border incidents", "reference markets", "critical cameras", "border OSINT cache"],
    fallback:
      "Serves a cached command brief for 60 seconds so the executive posture stays stable during transient upstream churn.",
  },
  {
    path: "/api/news",
    category: "Intelligence",
    purpose:
      "Builds the curated important-news stream derived from scored intelligence packages.",
    consumers: ["NewsDesk"],
    upstreams: ["Intelligence packages"],
    fallback: "Returns `fallbackNews` if curation fails.",
  },
  {
    path: "/api/ticker",
    category: "Intelligence",
    purpose:
      "Builds the bottom ticker with cross-domain alert snippets and market deltas.",
    consumers: ["SignalTicker"],
    upstreams: ["Intelligence packages"],
    fallback: "Returns `fallbackTicker` if ticker synthesis fails.",
  },
  {
    path: "/api/briefings/latest",
    category: "Intelligence",
    purpose:
      "Returns the highest-priority briefing card for external clients or future pinned views.",
    consumers: ["API clients", "future pinned briefing views"],
    upstreams: ["Intelligence packages"],
    fallback: "Returns `fallbackBriefing` if briefing synthesis fails.",
  },
  {
    path: "/api/intelligence/convergence",
    category: "Intelligence",
    purpose:
      "Scores area-level convergence and returns posture, alerts, evidence, and data gaps.",
    consumers: ["ConvergenceAlerts", "API clients"],
    upstreams: ["Incidents", "intelligence packages", "markets", "rainfall", "fires", "movements", "convergence cache"],
    fallback: "Serves cached or monitor-state snapshots when fresh corroboration is weak or delayed.",
  },
];

export const borderFeedApis: InternalApiDescriptor[] = [
  {
    path: "/api/border/traffic",
    category: "Operations",
    purpose:
      "Returns Longdo Traffic incidents (accidents, jams, road closures) near Thai borders. Refreshes every 2 minutes.",
    consumers: ["Bottom status strip", "border command"],
    upstreams: ["Longdo Traffic API"],
    fallback: "Returns empty array when Longdo API is unreachable.",
  },
  {
    path: "/api/border/earthquakes",
    category: "Environment",
    purpose:
      "Fetches USGS seismic events within 30 days for Southeast Asia. Refreshes every 5 minutes.",
    consumers: ["Bottom status strip", "convergence scoring"],
    upstreams: ["USGS Earthquake Hazards API"],
    fallback: "Returns empty array on API failure.",
  },
  {
    path: "/api/border/flood-risk",
    category: "Environment",
    purpose:
      "Returns river discharge levels and flood risk assessments from Open-Meteo. Refreshes every 30 minutes.",
    consumers: ["Bottom status strip", "convergence scoring"],
    upstreams: ["Open-Meteo River Discharge API"],
    fallback: "Returns empty array on API failure.",
  },
  {
    path: "/api/border/disasters",
    category: "Operations",
    purpose:
      "Returns GDACS active disaster alerts for the ASEAN region. Refreshes every 10 minutes.",
    consumers: ["Bottom status strip", "convergence scoring"],
    upstreams: ["GDACS RSS/GeoJSON feed"],
    fallback: "Returns empty array on API failure.",
  },
  {
    path: "/api/border/commodities",
    category: "Analytics",
    purpose:
      "Returns Thai agricultural commodity prices from NABC. Refreshes every hour.",
    consumers: ["Bottom status strip"],
    upstreams: ["NABC Thai Agricultural API"],
    fallback: "Returns empty array on API failure.",
  },
];

export const researchApis: InternalApiDescriptor[] = [
  {
    path: "/api/research/signals",
    category: "Analytics",
    purpose:
      "Query the signal_archive research database. Supports filtering by region, signal type, provider, date range, and keyword. Returns paginated results with total count.",
    consumers: ["Research clients", "future trend dashboard"],
    upstreams: ["signal_archive table (PostgreSQL)"],
    fallback: "Returns empty results when database is not configured.",
  },
  {
    path: "/api/research/trends",
    category: "Analytics",
    purpose:
      "Query pre-aggregated daily signal summaries for trend visualization. Returns counts, severity averages, and keyword trends per region and signal type.",
    consumers: ["Research clients", "future trend charts"],
    upstreams: ["signal_daily_summary table (PostgreSQL)"],
    fallback: "Returns empty results when database is not configured.",
  },
];

// Merge all API catalogs for counting
export const fullInternalApiCatalog = [...internalApiCatalog, ...borderFeedApis, ...researchApis];

export const externalProviderCategoryOrder: ExternalProviderCategory[] = [
  "News",
  "Environmental",
  "Mobility",
  "Maritime & Aviation",
  "Markets",
  "Financial Intelligence",
  "Humanitarian",
  "Mapping & Media",
  "Satellite Imagery",
  "Cyber & Infrastructure",
  "Prediction & Sentiment",
  "Research & Reference",
  "Optional",
];

export const externalProviderCatalog: ExternalProviderDescriptor[] = [
  {
    id: "bangkok-post-rss",
    label: "Bangkok Post RSS",
    category: "News",
    description: "Thailand-focused reporting feed used in intelligence package scoring.",
    surfaces: ["Briefing packages", "important news", "source health"],
    endpoints: ["https://www.bangkokpost.com/rss/data/news.xml"],
  },
  {
    id: "channel-newsasia-rss",
    label: "Channel NewsAsia RSS",
    category: "News",
    description: "Regional Asia reporting feed used in intelligence package scoring.",
    surfaces: ["Briefing packages", "important news", "source health"],
    endpoints: ["https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml"],
  },
  {
    id: "nikkei-asia-rss",
    label: "Nikkei Asia RSS",
    category: "News",
    description: "Asia business and policy feed used in market/logistics intelligence packages.",
    surfaces: ["Briefing packages", "source health"],
    endpoints: ["https://info.asia.nikkei.com/rss"],
  },
  {
    id: "bbc-world-rss",
    label: "BBC World RSS",
    category: "News",
    description: "Global reporting feed used as a high-trust external corroboration source.",
    surfaces: ["Briefing packages", "important news", "source health"],
    endpoints: ["https://feeds.bbci.co.uk/news/world/rss.xml"],
  },
  {
    id: "guardian-world-rss",
    label: "Guardian World RSS",
    category: "News",
    description: "World news feed used to broaden package coverage and corroboration.",
    surfaces: ["Briefing packages", "important news", "source health"],
    endpoints: ["https://www.theguardian.com/world/rss"],
  },
  {
    id: "city-reporter-bot",
    label: "City Reporter Bot",
    category: "News",
    description: "JSON news endpoint used as an internal-style live reference feed.",
    surfaces: ["Briefing packages", "important news", "source health"],
    endpoints: ["https://city-reporter-bot.onrender.com/api/news"],
  },
  {
    id: "google-news-rss",
    label: "Google News RSS Search",
    category: "News",
    description: "Query-based RSS searches used to widen intelligence coverage around local operating terms.",
    surfaces: ["Briefing packages"],
    endpoints: ["https://news.google.com/rss/search?q=..."],
  },
  {
    id: "gdelt-doc-2",
    label: "GDELT DOC 2",
    category: "News",
    description:
      "Near-real-time border narrative feed used to corroborate reporting around Myanmar, Cambodia, and Malaysia.",
    surfaces: ["Border news", "border ticker", "border command"],
    endpoints: ["https://api.gdeltproject.org/api/v2/doc/doc?query=...&mode=artlist&format=json"],
  },
  {
    id: "rss2json",
    label: "RSS2JSON Fallback",
    category: "News",
    description: "Feed parsing fallback for RSS sources that need JSON conversion.",
    surfaces: ["Intelligence parser fallback"],
    endpoints: ["https://api.rss2json.com/v1/api.json?rss_url=..."],
  },
  {
    id: "open-meteo-weather",
    label: "Open-Meteo Forecast",
    category: "Environmental",
    description: "Current weather feed used for top-bar regional temperature snapshots.",
    surfaces: ["TopBar"],
    endpoints: ["https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current_weather=true"],
  },
  {
    id: "open-meteo-air-quality",
    label: "Open-Meteo Air Quality",
    category: "Environmental",
    description: "AQI and PM2.5 provider for the top bar and the new air-quality heatmaps.",
    surfaces: ["TopBar", "AQI heatmap", "PM2.5 heatmap"],
    endpoints: ["https://air-quality-api.open-meteo.com/v1/air-quality?latitude=...&longitude=...&current=us_aqi,pm2_5"],
  },
  {
    id: "opensky",
    label: "OpenSky Network",
    category: "Mobility",
    description: "Regional state vector feed for live aircraft tracks.",
    surfaces: ["Flight paths overlay"],
    endpoints: ["https://opensky-network.org/api/states/all?lamin=...&lomin=...&lamax=...&lomax=..."],
  },
  {
    id: "unhcr-refugee-data-finder",
    label: "UNHCR Refugee Data Finder",
    category: "Mobility",
    description:
      "Public refugee and displacement statistics used to contextualize humanitarian pressure on the Myanmar frontier.",
    surfaces: ["Border command", "border ticker", "border movements"],
    endpoints: [
      "https://api.unhcr.org/population/v1/population/?cf_type=ISO&coo=MMR&coa=THA&yearFrom=...&yearTo=...",
      "https://api.unhcr.org/population/v1/demographics/?cf_type=ISO&coo=MMR&coa=THA&yearFrom=...&yearTo=...",
    ],
  },
  {
    id: "reference-dashboard",
    label: "DR Non Operating Systems Dashboard",
    category: "Markets",
    description: "Reference dashboard that advertises downstream APIs and market-related service discovery.",
    surfaces: ["Markets", "source catalog"],
    endpoints: ["https://dr-non-operating-systems.onrender.com/api/dashboard"],
  },
  {
    id: "er-api",
    label: "ER-API FX Rates",
    category: "Markets",
    description: "Foreign-exchange rates used for USD, THB, MMK, and EUR calculations.",
    surfaces: ["Economic monitor", "intelligence market signals"],
    endpoints: ["https://open.er-api.com/v6/latest/USD"],
  },
  {
    id: "binance",
    label: "Binance Ticker",
    category: "Markets",
    description: "BTC ticker used as a fast-moving risk and volatility reference.",
    surfaces: ["Economic monitor", "intelligence market signals"],
    endpoints: ["https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"],
  },
  {
    id: "world-bank-wdi",
    label: "World Bank WDI",
    category: "Markets",
    description:
      "Latest official annual GDP and GDP-per-capita series for ASEAN comparison in the market radar.",
    surfaces: ["Economic monitor"],
    endpoints: [
      "https://api.worldbank.org/v2/country/BRN;KHM;IDN;LAO;MYS;MMR;PHL;SGP;THA;VNM/indicator/NY.GDP.MKTP.CD?source=2&mrnev=1&format=json",
      "https://api.worldbank.org/v2/country/BRN;KHM;IDN;LAO;MYS;MMR;PHL;SGP;THA;VNM/indicator/NY.GDP.PCAP.CD?source=2&mrnev=1&format=json",
    ],
  },
  {
    id: "google-trends",
    label: "Google Trends RSS",
    category: "Markets",
    description: "Trending search RSS feeds used to detect local narrative momentum.",
    surfaces: ["Trending keywords"],
    endpoints: [
      "https://trends.google.com/trending/rss?geo=TH",
      "https://trends.google.com/trending/rss?geo=KH",
      "https://trends.google.com/trending/rss?geo=MM",
    ],
  },
  {
    id: "nasa-gibs",
    label: "NASA GIBS WMTS",
    category: "Mapping & Media",
    description: "Imagery, rainfall, lights, vegetation, and aerosol raster layers for the map.",
    surfaces: ["Base imagery", "rainfall", "night lights", "vegetation", "aerosol optical depth"],
    endpoints: ["https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/..."],
  },
  {
    id: "esri-world-imagery",
    label: "ESRI World Imagery",
    category: "Mapping & Media",
    description: "Token-free aerial imagery fallback for the map base layer.",
    surfaces: ["Aerial basemap"],
    endpoints: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
  },
  {
    id: "openstreetmap",
    label: "OpenStreetMap Tiles",
    category: "Mapping & Media",
    description: "Token-free road and street tiles for infrastructure context.",
    surfaces: ["Street basemap"],
    endpoints: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
  },
  {
    id: "overpass-api",
    label: "Overpass API",
    category: "Mapping & Media",
    description:
      "OpenStreetMap query API recommended for operational layers such as checkpoints, customs nodes, shelters, and hospitals.",
    surfaces: ["Future border infrastructure overlays"],
    endpoints: ["https://overpass-api.de/api/interpreter"],
  },
  {
    id: "sentinel-hub",
    label: "Sentinel Hub",
    category: "Mapping & Media",
    description:
      "Optional Copernicus processing layer for on-demand Sentinel imagery, statistics, and time-series over border areas of interest.",
    surfaces: ["Future satellite change detection", "operator imagery overlays"],
    endpoints: ["https://services.sentinel-hub.com/api/v1/process"],
    optional: true,
  },
  {
    id: "youtube",
    label: "YouTube Embed",
    category: "Mapping & Media",
    description: "Regional live TV embeds used in the intelligence rail.",
    surfaces: ["Live TV panel"],
    endpoints: ["https://www.youtube.com/embed/..."],
  },
  {
    id: "drnon-satellite-toolkit",
    label: "DrNon Global Satellite Toolkit",
    category: "Satellite Imagery",
    description:
      "Open-source satellite imagery integration toolkit providing basemap fallback chains, overlay catalogs, distance grids, and a registry of 22 satellite APIs across 80+ countries. Powers the dashboard's multi-provider resilience architecture.",
    surfaces: ["Base maps", "data overlays", "distance grid", "fallback chain"],
    endpoints: ["https://github.com/Nonarkara/DrNon-Global-Satellite-Toolkit"],
  },
  {
    id: "eox-sentinel2-cloudless",
    label: "EOX Sentinel-2 Cloudless",
    category: "Satellite Imagery",
    description:
      "High-resolution 10m cloud-free Sentinel-2 mosaic from EOX. Sharper baseline imagery than GIBS for detailed area inspection.",
    surfaces: ["High-res baselines overlay"],
    endpoints: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg"],
  },
  {
    id: "jrc-surface-water",
    label: "JRC Global Surface Water",
    category: "Satellite Imagery",
    description:
      "38-year surface water occurrence and change maps from JRC/Google. Used for border river monitoring and flood risk assessment.",
    surfaces: ["Hydro & terrain overlay"],
    endpoints: [
      "https://storage.googleapis.com/global-surface-water/tiles2021/occurrence/{z}/{x}/{y}.png",
      "https://storage.googleapis.com/global-surface-water/tiles2021/change/{z}/{x}/{y}.png",
    ],
  },
  {
    id: "emodnet-bathymetry",
    label: "EMODnet/GEBCO Bathymetry",
    category: "Satellite Imagery",
    description:
      "Ocean depth and seafloor terrain tiles for maritime border context along the Andaman Sea and Gulf of Thailand.",
    surfaces: ["Hydro & terrain overlay"],
    endpoints: ["https://tiles.emodnet-bathymetry.eu/v12/mean_atlas_land_latest/web_mercator/{z}/{x}/{y}.png"],
  },
  {
    id: "gibs-himawari",
    label: "JAXA Himawari-9 via GIBS",
    category: "Satellite Imagery",
    description:
      "Geostationary 10-minute visible imagery from JAXA Himawari-9 satellite, served through NASA GIBS. Covers all of Thailand and Southeast Asia.",
    surfaces: ["Geostationary overlay"],
    endpoints: ["https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band3_Red_Visible_1km/..."],
  },
  {
    id: "gibs-geo-ring",
    label: "EUMETSAT/NOAA Geo Ring via GIBS",
    category: "Satellite Imagery",
    description:
      "5-satellite global geostationary mosaic composites: natural color, infrared, and airmass RGB from EUMETSAT, JAXA, and NOAA via GIBS.",
    surfaces: ["Geostationary overlay"],
    endpoints: [
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Geostationary_Ring_Natural_Color/...",
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Geostationary_Ring_Infrared_Longwave_Window/...",
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Geostationary_Ring_Airmass_RGB/...",
    ],
  },
  {
    id: "carto-basemaps",
    label: "CartoDB Basemaps",
    category: "Satellite Imagery",
    description:
      "Clean minimal base maps (Positron light and Dark Matter) ideal for data-heavy overlay dashboards. Token-free.",
    surfaces: ["Base map selection"],
    endpoints: [
      "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    ],
  },
  {
    id: "esri-world-topo",
    label: "ESRI World Topographic",
    category: "Satellite Imagery",
    description:
      "Topographic map with terrain, boundaries, and labels. Token-free fallback in the basemap chain.",
    surfaces: ["Base map selection"],
    endpoints: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"],
  },
  /* ── Maritime & Aviation (sourced from World Monitor) ────── */
  {
    id: "aisstream",
    label: "AISStream",
    category: "Maritime & Aviation",
    description: "Real-time vessel tracking via WebSocket AIS data. Monitors vessel movements through strategic waterways including the Strait of Malacca.",
    surfaces: ["Future maritime overlay"],
    endpoints: ["wss://stream.aisstream.io/v0/stream"],
    optional: true,
  },
  {
    id: "imf-portwatch",
    label: "IMF PortWatch",
    category: "Maritime & Aviation",
    description: "Weekly vessel transit counts across strategic waterways and global shipping chokepoints. Tracks supply chain disruption signals.",
    surfaces: ["Future trade flow analytics"],
    endpoints: ["https://portwatch.imf.org/api/"],
    optional: true,
  },
  {
    id: "aviationstack",
    label: "AviationStack",
    category: "Maritime & Aviation",
    description: "Real-time and historical flight data for 40+ international airports. Tracks delays, cancellations, and air traffic disruptions.",
    surfaces: ["Future flight disruption overlay"],
    endpoints: ["https://api.aviationstack.com/v1/flights"],
    optional: true,
  },
  {
    id: "icao-notam",
    label: "ICAO NOTAM API",
    category: "Maritime & Aviation",
    description: "Airport and airspace closure notices (NOTAMs) for monitoring restricted zones, military exercises, and aviation disruptions.",
    surfaces: ["Future airspace monitoring"],
    endpoints: ["https://applications.icao.int/dataservices/api/notams-realtime-list"],
    optional: true,
  },
  {
    id: "adsb-exchange",
    label: "ADS-B Exchange",
    category: "Maritime & Aviation",
    description: "Unfiltered ADS-B transponder data for military and civilian aircraft tracking without commercial filtering.",
    surfaces: ["Future military flight overlay"],
    endpoints: ["https://globe.adsbexchange.com/"],
    optional: true,
  },
  /* ── Financial Intelligence (sourced from World Monitor) ── */
  {
    id: "yahoo-finance",
    label: "Yahoo Finance",
    category: "Financial Intelligence",
    description: "Stock tickers, indices, commodities, and ETF data for 92+ global exchanges. Real-time price movement correlation.",
    surfaces: ["Future market correlation analytics"],
    endpoints: ["https://query1.finance.yahoo.com/v8/finance/chart/"],
    optional: true,
  },
  {
    id: "coingecko",
    label: "CoinGecko",
    category: "Financial Intelligence",
    description: "Real-time cryptocurrency prices, stablecoin peg monitoring, and market capitalization data.",
    surfaces: ["Future crypto volatility indicator"],
    endpoints: ["https://api.coingecko.com/api/v3/"],
    optional: true,
  },
  {
    id: "bis-policy-rates",
    label: "Bank for International Settlements",
    category: "Financial Intelligence",
    description: "Central bank policy rates, real effective exchange rates, and credit-to-GDP ratios for ASEAN and global economies.",
    surfaces: ["Future macro financial analytics"],
    endpoints: ["https://data.bis.org/api/v2/"],
    optional: true,
  },
  {
    id: "eia-energy",
    label: "U.S. Energy Information Administration",
    category: "Financial Intelligence",
    description: "WTI/Brent crude oil prices, US oil production data, and petroleum inventory levels affecting ASEAN energy markets.",
    surfaces: ["Future energy price tracking"],
    endpoints: ["https://api.eia.gov/v2/"],
    optional: true,
  },
  {
    id: "fred-freight",
    label: "FRED (Federal Reserve Economic Data)",
    category: "Financial Intelligence",
    description: "Deep Sea Freight PPI and Freight Transportation Services Index for global supply chain pressure monitoring.",
    surfaces: ["Future supply chain analytics"],
    endpoints: ["https://api.stlouisfed.org/fred/series/observations"],
    optional: true,
  },
  {
    id: "wto-trade",
    label: "World Trade Organization",
    category: "Financial Intelligence",
    description: "Trade restrictions, tariff databases, bilateral flows, and SPS/TBT trade barriers affecting ASEAN economies.",
    surfaces: ["Future trade restriction analytics"],
    endpoints: ["https://apiportal.wto.org/"],
    optional: true,
  },
  /* ── Humanitarian ─────────────────────────────────────── */
  {
    id: "un-ocha-hapi",
    label: "UN OCHA HAPI",
    category: "Humanitarian",
    description: "Humanitarian API providing refugee, asylum seeker, and IDP population counts. Essential for displacement tracking along Myanmar and Cambodian borders.",
    surfaces: ["Refugee flow analytics", "border command"],
    endpoints: ["https://hapi.humdata.org/api/v2/"],
    optional: true,
  },
  {
    id: "worldpop",
    label: "WorldPop",
    category: "Humanitarian",
    description: "High-resolution population distribution estimates useful for displacement impact assessment in border regions.",
    surfaces: ["Future population density overlay"],
    endpoints: ["https://hub.worldpop.org/rest/data/"],
    optional: true,
  },
  {
    id: "cdc-travel-notices",
    label: "CDC Travel Health Notices",
    category: "Humanitarian",
    description: "Health travel advisories and disease outbreak notifications relevant to border crossing health screening.",
    surfaces: ["Future health alert layer"],
    endpoints: ["https://tools.cdc.gov/api/v2/resources/media"],
    optional: true,
  },
  /* ── Cyber & Infrastructure ───────────────────────────── */
  {
    id: "cloudflare-radar",
    label: "Cloudflare Radar",
    category: "Cyber & Infrastructure",
    description: "Internet outage detection and traffic anomaly monitoring. Tracks connectivity disruptions that correlate with conflict events.",
    surfaces: ["Future infrastructure monitoring"],
    endpoints: ["https://api.cloudflare.com/client/v4/radar/"],
    optional: true,
  },
  {
    id: "gpsjam",
    label: "GPSJam.org",
    category: "Cyber & Infrastructure",
    description: "GPS/GNSS jamming and spoofing analysis derived from ADS-B aircraft data. Detects electronic warfare activity.",
    surfaces: ["Future EW detection overlay"],
    endpoints: ["https://gpsjam.org/"],
    optional: true,
  },
  {
    id: "feodo-tracker",
    label: "Feodo Tracker (abuse.ch)",
    category: "Cyber & Infrastructure",
    description: "Botnet command-and-control infrastructure indicators. Tracks cyber threats originating from or targeting ASEAN networks.",
    surfaces: ["Future cyber threat layer"],
    endpoints: ["https://feodotracker.abuse.ch/downloads/ipblocklist.json"],
    optional: true,
  },
  /* ── Prediction & Sentiment ───────────────────────────── */
  {
    id: "polymarket",
    label: "Polymarket (Prediction Markets)",
    category: "Prediction & Sentiment",
    description: "Geopolitical prediction market data from Gamma API. Crowd-sourced probability estimates for conflict outcomes and geopolitical events.",
    surfaces: ["Future prediction market analytics"],
    endpoints: ["https://gamma-api.polymarket.com/"],
    optional: true,
  },
  {
    id: "fear-greed-index",
    label: "Fear & Greed Index",
    category: "Prediction & Sentiment",
    description: "Market sentiment indicator combining volatility, momentum, and safe-haven demand. Correlates with geopolitical risk perception.",
    surfaces: ["Future sentiment overlay"],
    endpoints: ["https://api.alternative.me/fng/"],
    optional: true,
  },
  /* ── Research & Reference ──────────────────────────────── */
  {
    id: "worldmonitor-reference",
    label: "World Monitor (Reference Architecture)",
    category: "Research & Reference",
    description: "Open-source geopolitical monitoring platform by koala73. Provides API discovery patterns, multi-source correlation techniques, and architectural reference for intelligence dashboards. Many providers in this catalog were discovered through World Monitor.",
    surfaces: ["API discovery", "architecture reference"],
    endpoints: ["https://github.com/koala73/worldmonitor"],
  },
  {
    id: "drnon-satellite-toolkit-ref",
    label: "DrNon Global Satellite Toolkit",
    category: "Research & Reference",
    description: "Open-source satellite imagery integration toolkit providing basemap fallback chains, overlay catalogs, distance grids, and a registry of 22 satellite APIs across 80+ countries.",
    surfaces: ["Base maps", "data overlays", "distance grid", "fallback chain"],
    endpoints: ["https://github.com/Nonarkara/DrNon-Global-Satellite-Toolkit"],
  },
  {
    id: "celestrak-tle",
    label: "CelesTrak TLE Database",
    category: "Research & Reference",
    description: "Free NORAD Two-Line Element data for ~185 satellites. Updated every 2 hours. Enables orbital surveillance and satellite pass prediction.",
    surfaces: ["Future satellite tracking overlay"],
    endpoints: ["https://celestrak.org/NORAD/elements/gp.php"],
    optional: true,
  },
  {
    id: "nasa-eonet",
    label: "NASA EONET",
    category: "Environmental",
    description: "Earth Observatory Natural Event Tracker for satellite-based disaster detection including wildfires, volcanic eruptions, and severe storms via GOES/Himawari, MODIS, and SAR.",
    surfaces: ["Future disaster tracking overlay"],
    endpoints: ["https://eonet.gsfc.nasa.gov/api/v3/events"],
    optional: true,
  },
  {
    id: "ucdp",
    label: "Uppsala Conflict Data Program",
    category: "Research & Reference",
    description: "Academic conflict dataset tracking active conflicts, battle-related deaths, and organized violence worldwide. Essential for historical trend analysis.",
    surfaces: ["Future conflict trend comparison"],
    endpoints: ["https://ucdp.uu.se/apidocs/"],
    optional: true,
  },
  {
    id: "supabase",
    label: "Supabase Postgres Backbone",
    category: "Research & Reference",
    description:
      "Primary production database for operational tables, archives, scheduler telemetry, and optional realtime subscriptions. This is the single source of truth for deployment-grade data.",
    surfaces: ["Data persistence", "feed health", "scheduler telemetry", "historical playback"],
    endpoints: ["NEXT_PUBLIC_SUPABASE_URL (configured per deployment)"],
  },
  {
    id: "longdo-traffic",
    label: "Longdo Traffic API",
    category: "Mobility",
    description:
      "Thai traffic incident feed providing real-time accidents, traffic jams, and road closures near border crossings.",
    surfaces: ["Bottom status strip"],
    endpoints: ["https://api.longdo.com/traffic/..."],
  },
  {
    id: "nabc-agriculture",
    label: "NABC Thai Agricultural Commodities",
    category: "Markets",
    description:
      "Thai National Agricultural Big Data Center commodity pricing for rice, rubber, cassava, and other local agricultural products.",
    surfaces: ["Bottom status strip", "market context"],
    endpoints: ["https://www.nabc.go.th/api/..."],
  },
  {
    id: "usgs-earthquakes",
    label: "USGS Earthquake Hazards",
    category: "Environmental",
    description:
      "Real-time seismic event feed for Southeast Asia from the USGS Earthquake Hazards Program. Shows magnitude, depth, and location.",
    surfaces: ["Bottom status strip", "convergence scoring"],
    endpoints: ["https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&..."],
  },
  {
    id: "gdacs-disasters",
    label: "GDACS Active Disasters",
    category: "Environmental",
    description:
      "Global Disaster Alerting and Coordination System providing active disaster alerts (earthquakes, floods, cyclones) for the ASEAN region.",
    surfaces: ["Bottom status strip", "convergence scoring"],
    endpoints: ["https://www.gdacs.org/gdacsapi/api/events/..."],
  },
  {
    id: "open-meteo-river",
    label: "Open-Meteo River Discharge",
    category: "Environmental",
    description:
      "River discharge forecasts and flood risk levels for major rivers along Thai border crossings.",
    surfaces: ["Bottom status strip", "convergence scoring"],
    endpoints: ["https://flood-api.open-meteo.com/v1/flood?..."],
  },
  {
    id: "mapbox",
    label: "Mapbox Styles API",
    category: "Optional",
    description:
      "Removed — the Mapbox account was deleted. Basemaps render exclusively on free raster tiles (ESRI / CARTO / OSM / NASA GIBS) and MapLibre GL.",
    surfaces: [],
    endpoints: [],
    optional: true,
  },
  {
    id: "acled",
    label: "ACLED",
    category: "Optional",
    description:
      "Optional coded conflict-event provider recommended for border violence, protest, and civilian-harm overlays once credentials are configured.",
    surfaces: ["Future coded conflict overlays", "border command corroboration"],
    endpoints: ["https://acleddata.com/acled-api-documentation"],
    optional: true,
  },
  {
    id: "google-earth-engine",
    label: "Google Earth Engine",
    category: "Optional",
    description:
      "Optional planetary analysis platform for scripted Sentinel and Landsat change detection across Thai border areas.",
    surfaces: ["Future satellite analytics"],
    endpoints: ["https://earthengine.googleapis.com/"],
    optional: true,
  },
  {
    id: "thai-customs-catalog",
    label: "Thai Customs Data Catalog",
    category: "Optional",
    description:
      "Optional official trade and customs source for border throughput, import/export, and HS-code trend overlays.",
    surfaces: ["Future trade and smuggling indicators"],
    endpoints: ["https://catalog.customs.go.th/"],
    optional: true,
  },
  {
    id: "thailand-open-government-data",
    label: "Thailand Open Government Data",
    category: "Optional",
    description:
      "Optional CKAN-based dataset catalog for public Thai government data discovery and aggregate border indicators.",
    surfaces: ["Future official-data enrichment"],
    endpoints: ["https://data.go.th/api/3/action/package_search"],
    optional: true,
  },
  {
    id: "openai-responses",
    label: "OpenAI Responses API",
    category: "Optional",
    description: "Optional AI summarization and enrichment path for intelligence packages.",
    surfaces: ["AI summary enrichment"],
    endpoints: ["https://api.openai.com/v1/responses"],
    optional: true,
  },
];

export const architectureSummary = {
  internalApiCount: fullInternalApiCatalog.length,
  externalProviderCount: externalProviderCatalog.length,
  uiSurfaceCount: dashboardSurfaces.length,
  architectureLayerCount: architectureLayers.length,
  optionalProviderCount: externalProviderCatalog.filter((provider) => provider.optional)
    .length,
};

/* ═══════════════════════════════════════════════════════════════
 * SATELLITE DATA BEST PRACTICES (STAC/COG/ARD)
 * ═══════════════════════════════════════════════════════════════ */

export interface SatelliteProviderEntry {
  id: string;
  name: string;
  type: "public" | "commercial";
  stacEndpoint?: string;
  description: string;
  authMethod: string;
  bestFor: string;
}

export const satelliteProviderRegistry: SatelliteProviderEntry[] = [
  {
    id: "nasa-cmr-stac",
    name: "NASA Earthdata CMR-STAC",
    type: "public",
    stacEndpoint: "https://cmr.earthdata.nasa.gov/stac/",
    description: "Near-complete NASA archive including Landsat, MODIS, VIIRS, GPM. Cloud-hosted for in-region analysis.",
    authMethod: "Earthdata Login Bearer token",
    bestFor: "Historical analysis, fire detection, vegetation monitoring",
  },
  {
    id: "sentinel-hub",
    name: "Sentinel Hub Processing API",
    type: "public",
    stacEndpoint: "https://services.sentinel-hub.com/api/v1/catalog/",
    description: "On-demand processing with custom evalscripts (JS-like band math). Returns PNG/JPEG/GeoTIFF in seconds. Batch processing for large areas.",
    authMethod: "OAuth Client ID/Secret (1-hour token expiry)",
    bestFor: "Custom indices (NDVI, EVI), change detection, rapid prototyping",
  },
  {
    id: "planetary-computer",
    name: "Microsoft Planetary Computer",
    type: "public",
    stacEndpoint: "https://planetarycomputer.microsoft.com/api/stac/v1",
    description: "Easiest signed STAC access. Auto-signed SAS tokens via pystac_client modifier. Hosts Sentinel-2, Landsat, and derived products.",
    authMethod: "planetary_computer.sign_inplace modifier (auto-signs)",
    bestFor: "Quick analysis, Jupyter notebooks, cloud-native workflows",
  },
  {
    id: "usgs-landsat-stac",
    name: "USGS Landsat STAC",
    type: "public",
    stacEndpoint: "https://landsatlook.usgs.gov/stac-server",
    description: "Dedicated STAC API for Landsat Collection 2 COGs. 50+ years of continuous Earth observation.",
    authMethod: "None (public COGs)",
    bestFor: "Long-term change detection, historical baselines",
  },
  {
    id: "google-earth-engine-sat",
    name: "Google Earth Engine",
    type: "public",
    description: "Planetary-scale JS/Python API on analysis-ready catalogs (Landsat, Sentinel, etc.). No storage/compute management needed.",
    authMethod: "Google Cloud service account",
    bestFor: "Large-scale temporal analysis, ML-ready pipelines",
  },
  {
    id: "planet-api",
    name: "Planet Labs",
    type: "commercial",
    stacEndpoint: "https://api.planet.com/data/v1/",
    description: "Daily global coverage at 3-5m resolution. STAC-like API with rate limits and credit system.",
    authMethod: "API key (commercial license)",
    bestFor: "Daily monitoring, high-frequency change detection",
  },
];

export const stacBestPractices: string[] = [
  "Use STAC as the universal catalog standard: Collections (datasets), Items (granules with GeoJSON geometry), Assets (band files as COGs).",
  "Query efficiently: POST /search with bbox, datetime, collections, limit. Use eo:cloud_cover filter (e.g., {lt: 20}) to pre-filter cloudy scenes.",
  "Always paginate results. Never assume a single page contains all matching items.",
  "Prefer Cloud Optimized GeoTIFF (COG) assets — they enable HTTP range requests for partial reads (tiles/pyramids) without downloading full files.",
  "Use pystac-client (Python) + rioxarray/stackstac for loading STAC items into xarray datacubes.",
  "Query Catalog/Search first to confirm data exists in your AOI/time before requesting assets or processing.",
  "For Planetary Computer: use modifier=planetary_computer.sign_inplace for auto-signed SAS tokens (unsigned → 404).",
  "For Sentinel Hub: use Requests Builder UI to prototype evalscripts, then call Processing API programmatically.",
  "For NASA Earthdata: nearly all data is cloud-hosted — use their Python recipes for cost-effective in-cloud analysis.",
  "Prioritize Analysis Ready Data (CEOS-ARD): standardized radiometric/geometric corrections, per-pixel cloud masks, and QA metadata.",
  "Store credentials securely (never in code). Handle rate limits (429s) with exponential backoff.",
  "Filter early: cloud cover, quality bands, date range. Process to common grid (radiometric calibration, atmospheric correction, reprojection).",
  "Enable CORS everywhere. Provide HTML views via STAC Browser. Use relative links for portable catalogs.",
];

export const cogWorkflowNotes: string[] = [
  "COG (Cloud Optimized GeoTIFF) is the non-negotiable format for modern satellite workflows.",
  "COGs use internal tiling and overviews to enable HTTP range requests — read only the pixels/bands you need.",
  "Open COGs with rioxarray.open_rasterio(url, overview_level=...) or GDAL virtual filesystem (/vsicurl/).",
  "Traditional full-file downloads are obsolete. STAC + COG lets you query, then read only needed data directly from cloud storage.",
  "Media type: image/tiff; application=geotiff; profile=cloud-optimized",
  "For multi-item analysis: use stackstac to build lazy datacubes from STAC search results, then compute with Dask for parallelism.",
  "TiTiler provides dynamic tiling from COG/STAC for web visualization — ideal for dashboard map overlays.",
];
