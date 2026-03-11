import type {
  ApiSourceResponse,
  BriefingPayload,
  CopernicusPreviewResponse,
  EconomicIndicator,
  FireEvent,
  IncidentFeature,
  NewsResponse,
  RainfallPoint,
  RefugeeMovement,
  TickerResponse,
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

export const fallbackNews: NewsResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  news: [
    {
      id: "news-01",
      title: "Mae Sot corridor remains the primary watchpoint",
      summary:
        "Field reporting continues to cluster around logistics and crossing-point activity along the western border.",
      source: "Fallback briefing",
      tag: "Field signal",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "alert",
    },
    {
      id: "news-02",
      title: "Currency spread remains the main market pressure",
      summary:
        "THB/MMK and fuel-linked trade inputs continue to set the operating tempo for border commerce.",
      source: "Fallback briefing",
      tag: "Markets",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "watch",
    },
    {
      id: "news-03",
      title: "Satellite review cycle remains active",
      summary:
        "True-color imagery, rainfall products, and thermal anomaly layers stay on standby for daily checks.",
      source: "Fallback briefing",
      tag: "Imagery",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "stable",
    },
  ],
};

export const fallbackTicker: TickerResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  items: [
    {
      id: "ticker-01",
      label: "Field reports",
      value: "12 active",
      delta: "+2 today",
      tone: "up",
    },
    {
      id: "ticker-02",
      label: "THB/MMK",
      value: "72.4",
      delta: "-2.1%",
      tone: "down",
    },
    {
      id: "ticker-03",
      label: "Thermal anomalies",
      value: "8 hotspots",
      delta: "stable",
      tone: "neutral",
    },
    {
      id: "ticker-04",
      label: "Rainfall watch",
      value: "3 provinces",
      delta: "monitor",
      tone: "neutral",
    },
  ],
};

export const fallbackBriefing: BriefingPayload = {
  title: "Border operations briefing",
  summary:
    "Western and southern corridors remain the highest-sensitivity sectors, with market volatility and logistics pressure still acting as the primary early-warning signals.",
  updatedAt: "2026-03-11T09:00:00.000Z",
  priorities: [
    "Keep Mae Sot and Tak crossings under daily incident review.",
    "Track currency spread and trade friction alongside field reports.",
    "Refresh thermal, rainfall, and true-color imagery on a rolling cycle.",
  ],
  marketSignals: [
    "THB/MMK remains the lead cross-border stress signal.",
    "Fuel and staples should be watched as second-order indicators.",
  ],
  outlook:
    "Current conditions support a watch posture rather than a surge posture, but escalation remains possible when field incidents and market stress move together.",
};

export const fallbackSources: ApiSourceResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  sources: [
    {
      id: "source-01",
      label: "Reports",
      url: "https://city-reporter-bot.onrender.com/api/reports",
      kind: "internal",
      target: "city-reporter-bot",
    },
    {
      id: "source-02",
      label: "News",
      url: "https://city-reporter-bot.onrender.com/api/news",
      kind: "internal",
      target: "city-reporter-bot",
    },
    {
      id: "source-03",
      label: "FX rates",
      url: "https://open.er-api.com/v6/latest/USD",
      kind: "external",
      target: "tech-monitor",
    },
    {
      id: "source-04",
      label: "Binance ticker",
      url: "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
      kind: "external",
      target: "tech-monitor",
    },
  ],
};

export const fallbackCopernicusPreview: CopernicusPreviewResponse = {
  updatedAt: "2026-03-11T09:00:00.000Z",
  focusDate: "2026-02-25",
  imagerySources: [
    {
      id: "viirsTrueColor",
      label: "VIIRS True Color",
      description: "Broad true-color composite for fast regional situational review.",
    },
    {
      id: "modisTerra",
      label: "MODIS Terra",
      description: "Daily daytime composite for land/water and cloud field inspection.",
    },
    {
      id: "modisAqua",
      label: "MODIS Aqua",
      description: "Second-pass true-color imagery for comparative atmospheric reads.",
    },
  ],
};
