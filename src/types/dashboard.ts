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
