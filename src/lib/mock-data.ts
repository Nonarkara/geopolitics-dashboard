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

/** Generate recent event dates relative to now */
function recentDate(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3600_000).toISOString();
}

export const fallbackIncidents: IncidentFeature[] = [
  // ── Myanmar Frontier (8 incidents) ──────────────────────
  { id: "MM-001", geometry: { coordinates: [98.5746, 16.7163] }, properties: { title: "Clashes near Myawaddy bridge", type: "Battles", fatalities: 3, notes: "Resistance forces exchanged fire with Tatmadaw units near the first friendship bridge. Artillery fire audible from Mae Sot. Border crossing suspended.", location: "Mae Sot / Myawaddy", eventDate: recentDate(4) } },
  { id: "MM-002", geometry: { coordinates: [98.6104, 16.6408] }, properties: { title: "Refugee shelter overflow in Tak", type: "Strategic developments", fatalities: 0, notes: "Temporary shelters in Tak province approaching capacity as displaced families from Kayin State continue to arrive. UNHCR coordinating additional relief.", location: "Tak province", eventDate: recentDate(8) } },
  { id: "MM-003", geometry: { coordinates: [98.8115, 15.3208] }, properties: { title: "Three Pagodas Pass skirmish", type: "Battles", fatalities: 1, notes: "Small arms fire reported near Three Pagodas Pass as ethnic armed organizations clashed with military patrols along the border.", location: "Three Pagodas Pass", eventDate: recentDate(18) } },
  { id: "MM-004", geometry: { coordinates: [99.8762, 20.4335] }, properties: { title: "Mae Sai checkpoint surge", type: "Strategic developments", fatalities: 0, notes: "Cross-border vehicle queue at Mae Sai reached 4-hour wait time as northern commercial traffic diverted from closed western crossings.", location: "Mae Sai", eventDate: recentDate(12) } },
  { id: "MM-005", geometry: { coordinates: [98.6, 9.97] }, properties: { title: "Ranong maritime intercept", type: "Strategic developments", fatalities: 0, notes: "Thai Navy intercepted vessel carrying undocumented migrants from Myanmar near Ranong coast. 42 individuals transferred to immigration processing.", location: "Ranong", eventDate: recentDate(24) } },
  { id: "MM-006", geometry: { coordinates: [97.97, 19.30] }, properties: { title: "Mae Hong Son border fire", type: "Violence against civilians", fatalities: 0, notes: "Cross-border shelling caused brush fire in Mae Hong Son frontier zone. Thai rangers deployed to establish buffer perimeter.", location: "Mae Hong Son", eventDate: recentDate(30) } },
  { id: "MM-007", geometry: { coordinates: [98.95, 16.45] }, properties: { title: "Humanitarian convoy attack", type: "Violence against civilians", fatalities: 2, notes: "Aid convoy carrying medical supplies attacked on Myanmar side near Kawkareik. Two drivers injured, supplies partially destroyed.", location: "Kawkareik / Tak border", eventDate: recentDate(36) } },
  { id: "MM-008", geometry: { coordinates: [99.13, 16.88] }, properties: { title: "Tak logistics disruption", type: "Strategic developments", fatalities: 0, notes: "Truck queue at Tak inland staging grew to 340 vehicles as western frontier congestion pushed freight onto secondary routes.", location: "Tak logistics hub", eventDate: recentDate(14) } },

  // ── Deep South (7 incidents) ────────────────────────────
  { id: "DS-001", geometry: { coordinates: [101.25, 6.87] }, properties: { title: "IED detonation in Pattani", type: "Explosions/Remote violence", fatalities: 2, notes: "Improvised explosive device detonated near a security checkpoint in Pattani city center. Two soldiers injured, one critically. BRN involvement suspected.", location: "Pattani", eventDate: recentDate(6) } },
  { id: "DS-002", geometry: { coordinates: [101.28, 6.54] }, properties: { title: "Ambush on patrol in Yala", type: "Battles", fatalities: 1, notes: "Rangers came under fire during routine patrol in Bannang Sata district. One insurgent killed in return fire. Area cordoned for search operation.", location: "Yala / Bannang Sata", eventDate: recentDate(16) } },
  { id: "DS-003", geometry: { coordinates: [101.82, 6.43] }, properties: { title: "School arson in Narathiwat", type: "Violence against civilians", fatalities: 0, notes: "Unidentified group set fire to a primary school in Rangae district overnight. Teachers had been receiving threatening letters. ISOC Region 4 investigating.", location: "Narathiwat / Rangae", eventDate: recentDate(22) } },
  { id: "DS-004", geometry: { coordinates: [101.96, 6.03] }, properties: { title: "Sungai Kolok checkpoint shooting", type: "Battles", fatalities: 1, notes: "Gunfire exchanged at Sungai Kolok border crossing after suspects refused to stop at security checkpoint. One suspect killed, motorcycle seized.", location: "Sungai Kolok", eventDate: recentDate(28) } },
  { id: "DS-005", geometry: { coordinates: [101.07, 5.77] }, properties: { title: "Betong security sweep", type: "Strategic developments", fatalities: 0, notes: "Joint military-police operation in Betong district following intelligence about weapons cache. Several arrests made, investigation ongoing.", location: "Betong", eventDate: recentDate(42) } },
  { id: "DS-006", geometry: { coordinates: [101.45, 6.70] }, properties: { title: "Market bombing attempt foiled", type: "Explosions/Remote violence", fatalities: 0, notes: "Security forces discovered and neutralized a roadside bomb near a busy morning market in Yarang district before detonation.", location: "Pattani / Yarang", eventDate: recentDate(50) } },
  { id: "DS-007", geometry: { coordinates: [101.60, 6.25] }, properties: { title: "Communal tension incident", type: "Riots", fatalities: 0, notes: "Tensions flared between communities in Bacho district following rumors about desecration of religious site. Security forces deployed to maintain order.", location: "Narathiwat / Bacho", eventDate: recentDate(56) } },

  // ── Cambodia Frontier (5 incidents) ─────────────────────
  { id: "KH-001", geometry: { coordinates: [102.5636, 13.6587] }, properties: { title: "Scam compound raid at Poipet", type: "Strategic developments", fatalities: 0, notes: "Thai-Cambodian joint operation raided suspected scam compound near Poipet. 180 foreign nationals rescued, 12 operators detained for trafficking charges.", location: "Aranyaprathet / Poipet", eventDate: recentDate(10) } },
  { id: "KH-002", geometry: { coordinates: [102.08, 13.69] }, properties: { title: "Casino traffic surge at Sa Kaeo", type: "Protests", fatalities: 0, notes: "Cross-border passenger volumes at Sa Kaeo exceeded normal capacity by 40%. Customs processing delays reached 3 hours during peak transit.", location: "Sa Kaeo", eventDate: recentDate(20) } },
  { id: "KH-003", geometry: { coordinates: [102.12, 12.60] }, properties: { title: "Ban Laem smuggling intercept", type: "Strategic developments", fatalities: 0, notes: "Customs officers at Ban Laem intercepted 2 tonnes of undeclared goods in concealed truck compartments. Driver arrested, investigation into network ongoing.", location: "Ban Laem", eventDate: recentDate(32) } },
  { id: "KH-004", geometry: { coordinates: [102.90, 13.35] }, properties: { title: "Migrant labor dispute", type: "Protests", fatalities: 0, notes: "Approximately 200 Cambodian workers staged protest near border crossing over unpaid wages and document confiscation by Thai employer.", location: "Eastern border zone", eventDate: recentDate(44) } },
  { id: "KH-005", geometry: { coordinates: [102.35, 14.10] }, properties: { title: "Preah Vihear area tension", type: "Strategic developments", fatalities: 0, notes: "Military presence increased near Preah Vihear temple area after reports of unauthorized construction activity in disputed zone.", location: "Preah Vihear vicinity", eventDate: recentDate(60) } },

  // ── Malaysia Corridor (4 incidents) ─────────────────────
  { id: "MY-001", geometry: { coordinates: [100.42, 6.75] }, properties: { title: "Sadao freight disruption", type: "Strategic developments", fatalities: 0, notes: "Heavy rain caused flooding at Sadao customs yard, delaying 120+ trucks. Malaysian counterpart at Bukit Kayu Hitam activated diversion protocol.", location: "Sadao", eventDate: recentDate(15) } },
  { id: "MY-002", geometry: { coordinates: [100.47, 7.01] }, properties: { title: "Hat Yai security alert", type: "Strategic developments", fatalities: 0, notes: "Suspicious package found at Hat Yai rail station prompted evacuation. Bomb disposal unit confirmed it was non-threatening after 2-hour closure.", location: "Hat Yai", eventDate: recentDate(26) } },
  { id: "MY-003", geometry: { coordinates: [100.32, 6.66] }, properties: { title: "Padang Besar rail congestion", type: "Protests", fatalities: 0, notes: "Cross-border rail freight backlog reached 18-hour delay as customs processing slowed due to new inspection requirements.", location: "Padang Besar", eventDate: recentDate(38) } },
  { id: "MY-004", geometry: { coordinates: [100.60, 7.16] }, properties: { title: "Contraband seizure on highway", type: "Strategic developments", fatalities: 0, notes: "Police checkpoint on Highway 4 south of Hat Yai intercepted vehicle carrying undeclared electronics and counterfeit goods valued at 12M baht.", location: "Songkhla / Highway 4", eventDate: recentDate(48) } },
];

export const fallbackFires: FireEvent[] = [
  // Northern Thailand burning season
  { latitude: 19.91, longitude: 99.84, brightness: 342, confidence: "high", acq_date: recentDate(2) },
  { latitude: 18.79, longitude: 98.98, brightness: 318, confidence: "nominal", acq_date: recentDate(3) },
  { latitude: 19.30, longitude: 97.97, brightness: 356, confidence: "high", acq_date: recentDate(5) },
  { latitude: 20.05, longitude: 99.25, brightness: 304, confidence: "nominal", acq_date: recentDate(6) },
  // Myanmar border conflict fires
  { latitude: 16.72, longitude: 98.58, brightness: 380, confidence: "high", acq_date: recentDate(4) },
  { latitude: 16.45, longitude: 98.82, brightness: 312, confidence: "nominal", acq_date: recentDate(7) },
  { latitude: 15.32, longitude: 98.75, brightness: 295, confidence: "nominal", acq_date: recentDate(10) },
  // Deep south
  { latitude: 6.85, longitude: 101.30, brightness: 288, confidence: "nominal", acq_date: recentDate(8) },
  { latitude: 6.42, longitude: 101.78, brightness: 310, confidence: "high", acq_date: recentDate(12) },
  // Cambodia border
  { latitude: 13.55, longitude: 102.48, brightness: 275, confidence: "low", acq_date: recentDate(9) },
];

export const fallbackEconomicIndicators: EconomicIndicator[] = [
  {
    label: "USD/THB",
    value: 32.28,
    change: 0.05,
    up: true,
    category: "FX",
    source: "ExchangeRate API (fallback)",
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
  // US Equity — fallback values (refreshed every 5 min when live)
  {
    label: "DOW",
    value: 39118,
    change: 0.32,
    up: true,
    category: "US Equity",
    source: "Yahoo Finance (fallback)",
  },
  {
    label: "NASDAQ",
    value: 18188,
    change: 0.55,
    up: true,
    category: "US Equity",
    source: "Yahoo Finance (fallback)",
  },
  {
    label: "NVDA",
    value: 875.4,
    change: 1.2,
    up: true,
    category: "Tech",
    source: "Yahoo Finance (fallback)",
  },
  {
    label: "TSLA",
    value: 248.5,
    change: -0.8,
    up: false,
    category: "Tech",
    source: "Yahoo Finance (fallback)",
  },
  {
    label: "GOOGL",
    value: 176.3,
    change: 0.4,
    up: true,
    category: "Tech",
    source: "Yahoo Finance (fallback)",
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
    "ExchangeRate API (fallback)",
    "Regional market snapshot",
    "Fallback macro snapshot",
  ],
};

export const fallbackRefugees: RefugeeMovement[] = [
  {
    source: [98.50, 16.80],
    target: [99.13, 16.88],
    count: 2400,
    label: "2,400 displaced/day Myanmar → Mae Sot / Tak corridor",
  },
  {
    source: [97.80, 19.50],
    target: [97.97, 19.30],
    count: 850,
    label: "850 displaced/day Kayin → Mae Hong Son frontier",
  },
  {
    source: [102.80, 13.40],
    target: [102.08, 13.69],
    count: 12600,
    label: "12,600 crossings/day Cambodia → Aranyaprathet / Sa Kaeo",
  },
  {
    source: [101.96, 6.03],
    target: [101.25, 6.87],
    count: 3200,
    label: "3,200 movements/day Deep South security corridor",
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
        "USD/THB is holding near the low-32 range while regional instability still weighs on sentiment and border-trade confidence.",
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
      value: "32.28",
      delta: "+0.05",
      tone: "up",
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
