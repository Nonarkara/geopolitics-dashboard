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
    id: "PHU-001",
    geometry: { coordinates: [98.3089, 7.8804] },
    properties: {
      title: "Road safety alert",
      type: "Road safety alert",
      fatalities: 1,
      notes:
        "Motorbike crash risk rose on the Patong Hill approach after evening rain and dense visitor traffic.",
      location: "Patong Hill",
      eventDate: "2026-03-11T17:20:00.000Z",
    },
  },
  {
    id: "PHU-002",
    geometry: { coordinates: [98.2785, 7.9663] },
    properties: {
      title: "Marine advisory",
      type: "Marine advisory",
      fatalities: 0,
      notes:
        "Small-boat operators were advised to delay departures off Kamala and the west coast as swell and gusts strengthened.",
      location: "Kamala coast",
      eventDate: "2026-03-11T12:40:00.000Z",
    },
  },
  {
    id: "PHU-003",
    geometry: { coordinates: [98.5308, 8.4383] },
    properties: {
      title: "Flooded roadway",
      type: "Flooded roadway",
      fatalities: 0,
      notes:
        "Runoff and standing water slowed vehicle movement near Takua Pa and Khao Lak after a heavy burst of rain.",
      location: "Takua Pa / Khao Lak",
      eventDate: "2026-03-10T09:15:00.000Z",
    },
  },
  {
    id: "PHU-004",
    geometry: { coordinates: [98.9126, 8.0863] },
    properties: {
      title: "Arrival surge",
      type: "Tourism surge",
      fatalities: 0,
      notes:
        "Airport arrivals and transfer demand strengthened across the Phuket-Krabi visitor route ahead of the weekend.",
      location: "Phuket-Krabi route",
      eventDate: "2026-03-10T06:50:00.000Z",
    },
  },
];

export const fallbackFires: FireEvent[] = [
  {
    latitude: 9.97,
    longitude: 98.63,
    brightness: 304,
    confidence: "nominal",
    acq_date: "2026-03-10T17:00:00.000Z",
  },
];

export const fallbackEconomicIndicators: EconomicIndicator[] = [
  {
    label: "USD/THB",
    value: 35.72,
    change: 0.18,
    up: false,
    category: "FX",
    source: "ExchangeRate API",
  },
  {
    label: "SET Index",
    value: 1412,
    change: -1.2,
    up: false,
    category: "Equity",
    source: "SET",
  },
  {
    label: "BTC/USDT",
    value: 67240,
    change: 2.3,
    up: true,
    category: "Crypto",
    source: "Binance",
  },
  {
    label: "Diesel ฿/L",
    value: 32.6,
    change: 0.4,
    up: true,
    category: "Energy",
    source: "EPPO",
  },
  {
    label: "Gold (XAU)",
    value: 2340,
    change: 0.8,
    up: true,
    category: "Commodity",
    source: "LBMA",
  },
  {
    label: "Thai CPI",
    value: 1.8,
    unit: "%",
    change: -0.2,
    up: false,
    category: "Inflation",
    source: "BOT",
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
  sources: ["Tourism snapshot", "Regional FX reference", "Fallback macro snapshot"],
};

export const fallbackRefugees: RefugeeMovement[] = [
  {
    source: [98.3057, 8.1132],
    target: [98.2965, 7.8964],
    count: 18200,
    label: "18,200 arrivals/day Airport -> Patong",
  },
  {
    source: [98.3917, 7.884],
    target: [98.3409, 7.8227],
    count: 6400,
    label: "6,400 trips/day Old Town -> Chalong",
  },
];

export const fallbackRainfall: RainfallPoint[] = [
  { lat: 7.8804, lng: 98.3923, value: 31.4, label: "Phuket Town" },
  { lat: 7.8964, lng: 98.2965, value: 42.8, label: "Patong" },
  { lat: 8.6367, lng: 98.2487, value: 55.2, label: "Khao Lak" },
  { lat: 8.0863, lng: 98.9126, value: 24.6, label: "Krabi" },
];

export const fallbackNews: NewsResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  news: [
    {
      id: "news-01",
      title: "Myawaddy fighting intensifies near Thai border crossing",
      summary:
        "Clashes between resistance forces and Myanmar military escalated near Myawaddy, with artillery fire audible from Mae Sot. Border trade disrupted for third consecutive day.",
      source: "ACLED / Border Monitor",
      tag: "Conflict",
      publishedAt: "2026-03-11T09:00:00.000Z",
      severity: "alert",
    },
    {
      id: "news-02",
      title: "Refugee intake surges at Mae Sot corridor checkpoints",
      summary:
        "UNHCR reports increased cross-border movement from Karen State into Tak province. Temporary shelters approaching capacity in several districts.",
      source: "UNHCR / HDX",
      tag: "Displacement",
      publishedAt: "2026-03-11T08:30:00.000Z",
      severity: "alert",
    },
    {
      id: "news-03",
      title: "ASEAN foreign ministers convene emergency session on Myanmar",
      summary:
        "Thailand hosts special ASEAN meeting to address humanitarian corridor proposals and ceasefire negotiations amid growing regional instability.",
      source: "Reuters / CNA",
      tag: "Diplomacy",
      publishedAt: "2026-03-11T07:00:00.000Z",
      severity: "watch",
    },
    {
      id: "news-04",
      title: "NASA FIRMS detects elevated thermal activity along border",
      summary:
        "Satellite fire detection shows anomalous hot spots consistent with conflict-related burning near Three Pagodas Pass and northern Tak province.",
      source: "NASA FIRMS",
      tag: "Satellite",
      publishedAt: "2026-03-11T06:00:00.000Z",
      severity: "watch",
    },
    {
      id: "news-05",
      title: "Thai baht weakens on regional instability concerns",
      summary:
        "USD/THB rises to 35.7 as foreign investors reduce exposure to Thai assets amid border tensions. SET Index declines 1.2% in early trading.",
      source: "Bloomberg / BOT",
      tag: "Markets",
      publishedAt: "2026-03-11T05:00:00.000Z",
      severity: "stable",
    },
  ],
};

export const fallbackTicker: TickerResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  items: [
    {
      id: "ticker-01",
      label: "USD/THB",
      value: "35.72",
      delta: "+0.18",
      tone: "down",
    },
    {
      id: "ticker-02",
      label: "SET Index",
      value: "1,412",
      delta: "-1.2%",
      tone: "down",
    },
    {
      id: "ticker-03",
      label: "BTC/USDT",
      value: "$67,240",
      delta: "+2.3%",
      tone: "up",
    },
    {
      id: "ticker-04",
      label: "Mae Sot AQI",
      value: "156",
      delta: "Unhealthy",
      tone: "down",
    },
    {
      id: "ticker-05",
      label: "Border Trade",
      value: "Disrupted",
      delta: "Day 3",
      tone: "down",
    },
    {
      id: "ticker-06",
      label: "Refugee Intake",
      value: "2,400/day",
      delta: "+340%",
      tone: "down",
    },
    {
      id: "ticker-07",
      label: "FIRMS Alerts",
      value: "24 active",
      delta: "+8 new",
      tone: "down",
    },
    {
      id: "ticker-08",
      label: "Flight Traffic",
      value: "142 tracked",
      delta: "normal",
      tone: "neutral",
    },
  ],
};

export const fallbackBriefing: BriefingPayload = {
  title: "Thailand Border Strategic Briefing",
  summary:
    "Myanmar civil conflict continues to drive cross-border instability along the Thai-Myanmar frontier. Myawaddy fighting has disrupted trade at Mae Sot, while refugee flows into Tak province are accelerating. FIRMS thermal data shows elevated burn activity consistent with conflict operations.",
  updatedAt: "2026-03-11T09:00:00.000Z",
  priorities: [
    "Monitor Mae Sot / Myawaddy corridor for escalation signals. Cross-reference ACLED incidents with FIRMS thermal detections.",
    "Track refugee intake rates against shelter capacity in Tak and surrounding provinces. Coordinate with UNHCR HDX feeds.",
    "Watch USD/THB and SET Index for contagion effects from border instability on broader Thai economic indicators.",
    "Maintain satellite surveillance via VIIRS, MODIS, and Sentinel-2 for terrain changes and military movement patterns.",
  ],
  marketSignals: [
    "Thai baht under pressure from regional instability and capital outflows.",
    "Border trade volumes at Mae Sot down 60% from pre-conflict baseline.",
    "Energy costs rising as supply chain disruptions affect cross-border logistics.",
  ],
  outlook:
    "The Myanmar-Thailand border remains the primary geopolitical flashpoint in mainland Southeast Asia. Without a ceasefire, expect continued refugee flows, trade disruption, and periodic escalation cycles that will test Thailand's border management capacity.",
};

export const fallbackSources: ApiSourceResponse = {
  generatedAt: "2026-03-11T09:00:00.000Z",
  sources: [
    {
      id: "source-01",
      label: "Operations briefing",
      url: "https://phuket-dashboard.local/api/briefings/latest",
      kind: "internal",
      target: "Phuket Dashboard",
    },
    {
      id: "source-02",
      label: "Economic radar",
      url: "https://phuket-dashboard.local/api/markets",
      kind: "internal",
      target: "Phuket Dashboard",
    },
    {
      id: "source-03",
      label: "Signal ticker",
      url: "https://phuket-dashboard.local/api/ticker",
      kind: "internal",
      target: "Phuket Dashboard",
    },
    {
      id: "source-04",
      label: "Open-Meteo weather",
      url: "https://api.open-meteo.com/v1/forecast",
      kind: "external",
      target: "Open-Meteo",
    },
    {
      id: "source-05",
      label: "Open-Meteo air quality",
      url: "https://air-quality-api.open-meteo.com/v1/air-quality",
      kind: "external",
      target: "Open-Meteo",
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
      description: "Shaded relief base for terrain-first orientation across coastlines, hills, and island approaches.",
    },
  ],
};
