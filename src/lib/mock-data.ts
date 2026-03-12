import type {
  AseanGdpDatum,
  ApiSourceResponse,
  BriefingPayload,
  CopernicusPreviewResponse,
  EconomicIndicator,
  FireEvent,
  MarketRadarResponse,
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
  {
    id: "THA124",
    geometry: { coordinates: [101.828, 6.425] },
    properties: {
      title: "Armed clash",
      type: "Armed clash",
      fatalities: 1,
      notes: "Security forces reported a short-duration exchange near a secondary route in Narathiwat.",
      location: "Narathiwat",
      eventDate: "2026-03-09T09:20:00.000Z",
    },
  },
  {
    id: "THA125",
    geometry: { coordinates: [101.2502, 6.868] },
    properties: {
      title: "Checkpoint alert",
      type: "Strategic development",
      fatalities: 0,
      notes: "Checkpoint posture increased along the Pattani corridor after cross-border monitoring alerts.",
      location: "Pattani",
      eventDate: "2026-03-08T14:10:00.000Z",
    },
  },
  {
    id: "THA126",
    geometry: { coordinates: [97.9685, 19.3011] },
    properties: {
      title: "Cross-border movement watch",
      type: "Population movement",
      fatalities: 0,
      notes: "Monitoring teams reported temporary movement pressure along the Mae Hong Son frontier.",
      location: "Mae Hong Son",
      eventDate: "2026-03-07T08:40:00.000Z",
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

export const fallbackAseanGdp: AseanGdpDatum[] = [
  {
    countryCode: "IDN",
    country: "Indonesia",
    gdpUsd: 1_390_000_000_000,
    gdpPerCapitaUsd: 4_980,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "THA",
    country: "Thailand",
    gdpUsd: 515_000_000_000,
    gdpPerCapitaUsd: 7_180,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "SGP",
    country: "Singapore",
    gdpUsd: 530_000_000_000,
    gdpPerCapitaUsd: 89_400,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "PHL",
    country: "Philippines",
    gdpUsd: 472_000_000_000,
    gdpPerCapitaUsd: 4_140,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "VNM",
    country: "Vietnam",
    gdpUsd: 476_000_000_000,
    gdpPerCapitaUsd: 4_710,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "MYS",
    country: "Malaysia",
    gdpUsd: 422_000_000_000,
    gdpPerCapitaUsd: 12_450,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "TLS",
    country: "Timor-Leste",
    gdpUsd: 2_300_000_000,
    gdpPerCapitaUsd: 1_730,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "MMR",
    country: "Myanmar",
    gdpUsd: 64_000_000_000,
    gdpPerCapitaUsd: 1_180,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "KHM",
    country: "Cambodia",
    gdpUsd: 49_000_000_000,
    gdpPerCapitaUsd: 2_870,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "BRN",
    country: "Brunei",
    gdpUsd: 17_000_000_000,
    gdpPerCapitaUsd: 39_900,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
  {
    countryCode: "LAO",
    country: "Laos",
    gdpUsd: 16_000_000_000,
    gdpPerCapitaUsd: 2_120,
    gdpYear: 2024,
    gdpPerCapitaYear: 2024,
    source: "Fallback macro snapshot",
  },
].sort((left, right) => right.gdpUsd - left.gdpUsd);

export const fallbackMarketRadarResponse: MarketRadarResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  data: fallbackEconomicIndicators,
  signals: fallbackEconomicIndicators,
  aseanGdp: fallbackAseanGdp,
  sources: [
    "ExchangeRate API",
    "Binance Ticker",
    "Fallback macro snapshot",
  ],
};

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
      source: "Thailand monitor",
      tag: "Field signal",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "alert",
    },
    {
      id: "news-02",
      title: "Currency spread remains the main market pressure",
      summary:
        "THB/MMK and fuel-linked trade inputs continue to set the operating tempo for border commerce.",
      source: "Market radar",
      tag: "Markets",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "watch",
    },
    {
      id: "news-03",
      title: "Satellite review cycle remains active",
      summary:
        "True-color imagery, rainfall products, and thermal anomaly layers stay on standby for daily checks.",
      source: "Orbital overlay",
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
      value: "4 active",
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
    "Western and southern Thai corridors remain the highest-sensitivity sectors, with market volatility and logistics pressure still acting as the primary early-warning signals.",
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
      label: "Regional briefing",
      url: "https://middle-east-monitor.onrender.com/api/briefings/iran",
      kind: "internal",
      target: "Middle East Monitor",
    },
    {
      id: "source-02",
      label: "Markets snapshot",
      url: "https://middle-east-monitor.onrender.com/api/markets",
      kind: "internal",
      target: "Middle East Monitor",
    },
    {
      id: "source-03",
      label: "Ticker feed",
      url: "https://middle-east-monitor.onrender.com/api/ticker",
      kind: "internal",
      target: "Middle East Monitor",
    },
    {
      id: "source-04",
      label: "FX rates",
      url: "https://open.er-api.com/v6/latest/USD",
      kind: "external",
      target: "Tech Monitor",
    },
    {
      id: "source-05",
      label: "Binance ticker",
      url: "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
      kind: "external",
      target: "Tech Monitor",
    },
    {
      id: "source-06",
      label: "NASA GIBS true color",
      url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/",
      kind: "external",
      target: "NASA GIBS",
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
      id: "modisFalseColor",
      label: "MODIS False Color",
      description: "False-color land and burn-scar view with stronger terrain and vegetation contrast.",
    },
    {
      id: "blueMarble",
      label: "Blue Marble Relief",
      description: "Shaded relief base for terrain-first orientation and corridor framing.",
    },
  ],
};
