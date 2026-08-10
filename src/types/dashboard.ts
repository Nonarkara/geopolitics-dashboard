import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";

export type Coordinates = [number, number];
export type LatLng = [number, number];

export interface ProvinceSelection {
  name: string;
  type?: string;
  notes?: string;
  fatalities?: number;
  iso?: string;
  location?: string;
  eventDate?: string;
}

export interface IncidentProperties {
  title: string;
  type: string;
  fatalities: number;
  notes: string;
  location: string;
  eventDate: string;
}

export interface IncidentFeature {
  id: string;
  geometry: {
    coordinates: Coordinates;
  };
  properties: IncidentProperties;
}

export interface FireEvent {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: string;
  acq_date: string;
}

export interface FlightData {
  icao24: string;
  callsign: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  origin_country: string;
  on_ground: boolean;
}

export interface RefugeeMovement {
  source: Coordinates;
  target: Coordinates;
  count: number;
  label: string;
}

export interface TrafficIncident {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  severity: number;
  start: string;
  stop: string;
}

export interface OperationalMapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export type BorderOperationalNodeType =
  | "checkpoint"
  | "sez"
  | "logistics-hub"
  | "rail"
  | "port"
  | "security";

export interface BorderOperationalTheater {
  id: "myanmar-frontier" | "cambodia-frontier" | "malaysia-frontier" | "deep-south";
  label: string;
  counterpart: string;
  summary: string;
  focusView: OperationalMapViewState;
  deepZoomRadiusKm: number;
  generalZoom: number;
  deepZoom: number;
}

export interface BorderOperationalNode {
  id: string;
  theaterId: BorderOperationalTheater["id"];
  label: string;
  shortLabel: string;
  type: BorderOperationalNodeType;
  coordinates: Coordinates;
  summary: string;
  usage: string;
  focusView: OperationalMapViewState;
  allowsDeepZoom: boolean;
  emphasis: "primary" | "secondary";
}

export type BorderOperationalCorridorMode =
  | "freight"
  | "passenger"
  | "mixed"
  | "security";

export interface BorderOperationalCorridor {
  id: string;
  theaterId: BorderOperationalTheater["id"];
  label: string;
  shortLabel: string;
  coordinates: Coordinates[];
  mode: BorderOperationalCorridorMode;
  summary: string;
  usage: string;
  emphasis: "primary" | "secondary";
}

export interface BorderOperationalMapResponse {
  generatedAt: string;
  nationalView: OperationalMapViewState;
  theaters: BorderOperationalTheater[];
  nodes: BorderOperationalNode[];
  corridors: BorderOperationalCorridor[];
  liveFlows: RefugeeMovement[];
  sources: string[];
}

export interface RainfallPoint {
  lat: number;
  lng: number;
  value: number;
  label: string;
}

export interface AirQualityPoint {
  lat: number;
  lng: number;
  label: string;
  aqi: number;
  pm25: number;
  category: string;
  observedAt?: string;
  source?: string;
}

export interface RegionBorderProperties {
  NAME_0?: string;
  ISO_A3?: string;
  ADM0_A3?: string;
}

export interface RegionBorderFeature {
  properties: RegionBorderProperties;
}

export interface RegionBorderCollection {
  type: "FeatureCollection";
  features: RegionBorderFeature[];
}

export interface ConflictZoneProperties {
  id: string;
  name: string;
  status: string;
  priority: number;
  summary: string;
}

export type ConflictZoneFeature = Feature<
  Polygon | MultiPolygon,
  ConflictZoneProperties
>;

export type ConflictZoneCollection = FeatureCollection<
  Polygon | MultiPolygon,
  ConflictZoneProperties
>;

export interface EconomicIndicator {
  label: string;
  value: number | string;
  unit?: string | null;
  category?: string | null;
  source?: string | null;
  change: number | string;
  up: boolean;
  province?: string | null;
}

export interface AseanGdpDatum {
  countryCode: string;
  country: string;
  gdpUsd: number;
  gdpPerCapitaUsd: number;
  gdpYear: number;
  gdpPerCapitaYear: number;
  source: string;
}

export interface CountryEconomicIndicatorSnapshot {
  countryCode: string;
  country: string;
  indicatorCode: string;
  indicatorLabel: string;
  value: number;
  unit: string | null;
  refYear: number;
  source: string;
}

export interface CountryCurrency {
  code: string;
  name: string | null;
  symbol: string | null;
}

export interface CountryLanguage {
  code: string;
  name: string;
}

export interface CountryCapital {
  name: string | null;
  latlng: LatLng | null;
}

export interface CountryMetadata {
  alpha2: string | null;
  alpha3: string;
  officialName: string | null;
  flagEmoji: string | null;
  flagSvgUrl: string | null;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  capitalLatLng: LatLng | null;
  currencies: CountryCurrency[];
  languages: CountryLanguage[];
  timezones: string[];
  borders: string[];
}

export interface AseanProfileMetric {
  id: string;
  label: string;
  value: number | null;
  unit: string | null;
  year: number | null;
  source: string;
  note?: string;
  secondaryValue?: number | null;
  secondaryUnit?: string | null;
  secondaryYear?: number | null;
}

export interface AseanProfileNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface AseanCountryProfileResponse {
  generatedAt: string;
  country: {
    code: string;
    label: string;
    aliases: string[];
  };
  metadata: CountryMetadata;
  metrics: AseanProfileMetric[];
  news: AseanProfileNewsItem[];
  sources: string[];
}

export interface MarketRadarResponse {
  generatedAt: string;
  data: EconomicIndicator[];
  signals: EconomicIndicator[];
  aseanGdp: AseanGdpDatum[];
  sources: string[];
  mode?: DashboardPlaybackMode;
}

export interface DatabaseTableSummary {
  id: string;
  label: string;
  description: string;
  category: string;
  columns: string[];
  rowCount: number | null;
  latestValue: string | null;
}

export interface DatabaseCatalogResponse {
  databaseConfigured: boolean;
  generatedAt: string;
  totalRows: number;
  tables: DatabaseTableSummary[];
}

export interface DatabaseTablePreviewResponse {
  databaseConfigured: boolean;
  generatedAt: string;
  table: DatabaseTableSummary;
  limit: number;
  rows: Array<Record<string, unknown>>;
}

export interface ConflictTrendSeries {
  labels: string[];
  current: number[];
  yoy: number[];
}

export interface FatalityTrendSeries {
  labels: string[];
  data: number[];
}

export interface ConflictTrendsResponse {
  provincialData: ConflictTrendSeries;
  fatalities: FatalityTrendSeries;
  rainfall: FatalityTrendSeries;
}

export type DashboardPlaybackMode = "live" | "historical" | "historical-empty";
export type SignalTone = "up" | "down" | "neutral";
export type NewsSeverity = "alert" | "watch" | "stable";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  tag: string;
  publishedAt: string;
  severity: NewsSeverity;
  provider?: string;
}

export interface NewsResponse {
  news: NewsItem[];
  generatedAt: string;
  mode?: DashboardPlaybackMode;
  sources?: SourceHealth[];
  errorCode?: string;
}

export interface TickerItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: SignalTone;
}

export interface TickerResponse {
  items: TickerItem[];
  generatedAt: string;
  mode?: DashboardPlaybackMode;
}

export interface BriefingPayload {
  title: string;
  summary: string;
  updatedAt: string;
  priorities: string[];
  marketSignals: string[];
  outlook: string;
}

export interface ApiSourceEntry {
  id: string;
  label: string;
  url: string;
  kind: string;
  target: string;
  health?: PackageStatus;
  checkedAt?: string;
}

export interface ApiSourceResponse {
  generatedAt: string;
  sources: ApiSourceEntry[];
}

export type RuntimeDatasetState =
  | "live"
  | "stale"
  | "fallback"
  | "on_demand"
  | "disabled";

export type DashboardDatasetCriticality = "core" | "optional";

export type DashboardCronState =
  | "healthy"
  | "stale"
  | "missing"
  | "failing"
  | "disabled";

export interface DashboardDatasetStatus {
  id: string;
  label: string;
  source: string;
  criticality: DashboardDatasetCriticality;
  state: RuntimeDatasetState;
  latestTimestamp: string | null;
  ageMinutes: number | null;
  freshnessTargetMinutes: number;
  details: string;
}

export interface DashboardCronStatus {
  id: string;
  label: string;
  cadence: string;
  state: DashboardCronState;
  lastRunAt: string | null;
  ageMinutes: number | null;
  details: string;
}

export interface DashboardStatusPayload {
  status: string;
  version: string;
  signal_strength: number;
  checkedAt: string;
  posture?: "live" | "hybrid" | "fallback";
  services: Record<string, string>;
  datasets: DashboardDatasetStatus[];
  crons?: DashboardCronStatus[];
}

export type PublicCameraCategory =
  | "beach"
  | "traffic"
  | "town"
  | "nightlife"
  | "harbor"
  | "border"
  | "logistics"
  | "capital";

export type PublicCameraValidationState = "verified" | "candidate";

export interface PublicCamera {
  id: string;
  label: string;
  category: PublicCameraCategory;
  lat: number;
  lng: number;
  provider: string;
  sourcePageUrl: string;
  embedUrl?: string;
  snapshotUrl?: string;
  validationState: PublicCameraValidationState;
  locationLabel?: string;
  focusArea?: string;
  strategicNote?: string;
  status: PackageStatus;
  refreshSeconds: number;
  lastCheckedAt: string;
}

export interface PublicCameraResponse {
  generatedAt: string;
  cameras: PublicCamera[];
}

export interface CopernicusPreviewLayer {
  id: string;
  label: string;
  description: string;
}

export interface CopernicusPreviewResponse {
  updatedAt: string;
  focusDate: string;
  imagerySources: CopernicusPreviewLayer[];
}

export type PackageStatus = "live" | "stale" | "offline";

export interface SourceHealth {
  id: string;
  label: string;
  url: string;
  status: PackageStatus;
  checkedAt: string;
  responseTimeMs: number | null;
  message: string | null;
}

export interface IntelligenceItem {
  id: string;
  packageId: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  url: string;
  tags: string[];
  score: number;
  severity: NewsSeverity;
  kind: "news" | "incident" | "market" | "weather" | "movement" | "thermal";
}

export interface IntelligencePackageStats {
  total: number;
  elevated: number;
  dominantTags: string[];
  incidents: number;
  markets: number;
  weather: number;
}

export interface IntelligencePackage {
  id: string;
  title: string;
  headline: string;
  summary: string;
  description: string;
  priorities: string[];
  dominantTags: string[];
  sourceLabels: string[];
  updatedAt: string;
  status: PackageStatus;
  items: IntelligenceItem[];
  stats: IntelligencePackageStats;
}

export interface IntelligencePackageResponse {
  generatedAt: string;
  mode: PackageStatus;
  packages: IntelligencePackage[];
  sources: SourceHealth[];
}

export type ConvergencePosture = "priority" | "watch" | "monitor";
export type ConvergenceFamily =
  | "incident"
  | "news"
  | "market"
  | "weather"
  | "thermal"
  | "movement";

export interface ConvergenceEvidence {
  id: string;
  family: ConvergenceFamily;
  title: string;
  source: string;
  observedAt: string;
  score: number;
  reason: string;
  url: string;
}

export interface ConvergenceAlert {
  id: string;
  title: string;
  summary: string;
  score: number;
  posture: ConvergencePosture;
  windowHours: number;
  families: ConvergenceFamily[];
  evidence: ConvergenceEvidence[];
  dataGaps: string[];
  updatedAt: string;
}

export interface ConvergenceCorridor {
  id: string;
  label: string;
  center: Coordinates;
  radiusKm: number;
  aliases: string[];
}

export interface ConvergenceSourceCoverage {
  live: number;
  stale: number;
  offline: number;
  total: number;
  labels: string[];
}

export interface CorridorConvergenceResponse {
  generatedAt: string;
  corridor: ConvergenceCorridor;
  posture: ConvergencePosture;
  score: number;
  summary: string;
  alerts: ConvergenceAlert[];
  sourceCoverage: ConvergenceSourceCoverage;
  dataGaps: string[];
}

export type BorderCommandPosture = "priority" | "watch" | "stable";

export interface ScoreContribution {
  factor: string;
  rawValue: number;
  weight: number;
  contribution: number;
  source: string;
  sourceUrl?: string;
}

export interface ScoreBreakdown {
  baseScore: number;
  baseScoreRationale: string;
  contributions: ScoreContribution[];
  rawTotal: number;
  clampedScore: number;
  formula: string;
}

export interface BorderAreaStatus {
  id: string;
  label: string;
  counterpart: string;
  posture: BorderCommandPosture;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  incidentCount: number;
  fatalityCount: number;
  verifiedCameras: number;
  candidateCameras: number;
  summary: string;
  watchpoints: string[];
  signals: string[];
  recommendedAction: string;
}

export interface BorderCommandConcern {
  id: string;
  areaId: string;
  areaLabel: string;
  label: string;
  posture: BorderCommandPosture;
  detail: string;
  metric: string;
}

export interface BorderActionItem {
  id: string;
  areaId: string;
  areaLabel: string;
  title: string;
  detail: string;
  owner: string;
  posture: BorderCommandPosture;
}

export interface BorderCommandBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  overallPosture: BorderCommandPosture;
  overallScore: number;
  overallScoreMethod: string;
  areas: BorderAreaStatus[];
  topConcerns: BorderCommandConcern[];
  actionQueue: BorderActionItem[];
  sources: string[];
  mode?: DashboardPlaybackMode;
}

export interface BorderNarrativeSignal {
  id: string;
  areaId: string;
  areaLabel: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  provider: string;
  severity: NewsSeverity;
  tags: string[];
}

export interface BorderHumanitarianSnapshot {
  id: string;
  areaId: string;
  areaLabel: string;
  label: string;
  count: number;
  unit: string;
  asOf: string;
  source: string;
  sourceUrl: string;
  detail: string;
}

export interface BorderOsintResponse {
  generatedAt: string;
  signals: BorderNarrativeSignal[];
  humanitarian: BorderHumanitarianSnapshot[];
  sources: SourceHealth[];
}

/* ── V6.1 New Data Sources ─────────────────────────────── */

export interface GkgEntity {
  id: number;
  entityType: "person" | "organization" | "theme" | "location";
  entityName: string;
  mentionCount: number;
  avgTone: number | null;
  sourceCount: number;
  firstSeen: string;
  lastSeen: string;
  sampleSources: string[];
  refDate: string;
}

export interface GkgResponse {
  generatedAt: string;
  entities: GkgEntity[];
}

export interface VesselPosition {
  mmsi: string;
  vesselName: string | null;
  shipType: number | null;
  lat: number;
  lng: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  destination: string | null;
  flagCountry: string | null;
  observedAt: string;
}

export interface VesselTrackingResponse {
  generatedAt: string;
  vessels: VesselPosition[];
  vesselCount: number;
}

/* ── Border Feed Types (shared across API routes + components) ── */

export interface CommodityPrice {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  unit: string;
  market: string;
  date: string;
}

export interface RiverDischarge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentDischarge: number;
  forecastPeak: number;
  forecastPeakDate: string;
  trend: "rising" | "falling" | "stable";
  riskLevel: "low" | "moderate" | "high" | "critical";
}

export interface SeismicEvent {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lng: number;
  depth: number;
  time: string;
  url: string;
}

export interface RegionalDisaster {
  id: string;
  title: string;
  type: string;
  alertLevel: string;
  lat: number;
  lng: number;
  date: string;
  source: string;
}

export type MapOverlayKind = "raster" | "vector";
export type MapOverlayFamily =
  | "imagery"
  | "vegetation"
  | "terrain"
  | "weather"
  | "air"
  | "lights"
  | "thermal"
  | "operational";
export type MapOverlayRole = "base-option" | "analytic" | "operational";

export interface MapOverlay {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  source: string;
  kind: MapOverlayKind;
  family: MapOverlayFamily;
  role: MapOverlayRole;
  defaultOpacity: number;
  updatedAt: string;
  enabledByDefault: boolean;
  maxZoom?: number;
  tileTemplate?: string;
  timeMode?: "dated" | "default";
}

export interface MapOverlayCatalogResponse {
  updatedAt: string;
  defaultBasemap: "detailed-streets";
  defaultImageryOverlayId: string;
  overlays: MapOverlay[];
}
