import type {
  EconomicIndicator,
  FireEvent,
  IncidentFeature,
  RainfallPoint,
  RefugeeMovement,
} from "../types/dashboard";

export const fallbackIncidents: IncidentFeature[] = [
  {
    id: "THA123",
    geometry: { coordinates: [98.5678, 16.7161] },
    properties: {
      title: "Explosions/Remote violence",
      type: "Explosions/Remote violence",
      fatalities: 2,
      notes: "Explosion reported near the border crossing near Mae Sot.",
      location: "Mae Sot",
      eventDate: "2026-03-10T17:00:00.000Z",
    },
  },
];

export const fallbackFires: FireEvent[] = [
  {
    latitude: 16.5,
    longitude: 98.5,
    brightness: 310,
    confidence: "nominal",
    acq_date: "2026-03-10T17:00:00.000Z",
  },
];

export const fallbackEconomicIndicators: EconomicIndicator[] = [
  {
    label: "THB/MMK",
    value: 72.4,
    change: -2.1,
    up: false,
    category: "Forex",
    source: "Fallback",
  },
  {
    label: "Diesel",
    value: 31.2,
    change: 0.6,
    up: true,
    category: "Energy",
    source: "Fallback",
  },
  {
    label: "Rice",
    value: 14.8,
    change: -0.4,
    up: false,
    category: "Staples",
    source: "Fallback",
  },
  {
    label: "Border Trade",
    value: 84.6,
    change: 1.8,
    up: true,
    category: "Logistics",
    source: "Fallback",
  },
];

export const fallbackRefugees: RefugeeMovement[] = [
  {
    source: [98.5, 16.7],
    target: [100.5, 13.7],
    count: 92000,
    label: "92,000 from Myanmar",
  },
  {
    source: [104.2, 12.5],
    target: [100.5, 13.7],
    count: 5000,
    label: "5,000 from Cambodia",
  },
];

export const fallbackRainfall: RainfallPoint[] = [
  { lat: 16.71, lng: 98.56, value: 12.5, label: "Mae Sot" },
  { lat: 16.88, lng: 99.12, value: 8.2, label: "Tak" },
  { lat: 14.02, lng: 99.53, value: -5.0, label: "Kanchanaburi" },
];
