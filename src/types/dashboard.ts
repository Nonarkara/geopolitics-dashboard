export type Coordinates = [number, number];

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

export interface RefugeeMovement {
  source: Coordinates;
  target: Coordinates;
  count: number;
  label: string;
}

export interface RainfallPoint {
  lat: number;
  lng: number;
  value: number;
  label: string;
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
}

export type SignalTone = "up" | "down" | "neutral";
export type NewsSeverity = "alert" | "watch" | "stable";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  tag: string;
  publishedAt: string;
  severity: NewsSeverity;
}

export interface NewsResponse {
  news: NewsItem[];
  generatedAt: string;
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
}

export interface ApiSourceResponse {
  generatedAt: string;
  sources: ApiSourceEntry[];
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
