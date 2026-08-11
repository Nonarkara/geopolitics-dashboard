import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const borderBriefResponse = {
  generatedAt: "2026-03-15T09:00:00.000Z",
  headline: "Myanmar frontier is the lead intervention area today",
  summary:
    "Conflict spillover remains concentrated on the western frontier, while Cambodia and Malaysia need tighter queue and flow visibility.",
  overallPosture: "priority",
  overallScore: 86,
  areas: [
    {
      id: "myanmar-frontier",
      label: "Myanmar frontier",
      counterpart: "Myanmar",
      posture: "priority",
      score: 86,
      incidentCount: 4,
      fatalityCount: 7,
      verifiedCameras: 2,
      candidateCameras: 0,
      summary: "4 matched field incidents and 7 reported fatalities are keeping the western frontier at priority.",
      watchpoints: [
        "Conflict spillover around Mae Sot / Myawaddy",
        "Shelter and humanitarian pressure in Tak",
      ],
      signals: ["4 matched field incidents", "2 verified camera feeds", "USD/THB +0.4"],
      recommendedAction: "Stabilize the western frontier posture. Escalate cross-agency coordination immediately.",
    },
    {
      id: "cambodia-frontier",
      label: "Cambodia frontier",
      counterpart: "Cambodia",
      posture: "watch",
      score: 58,
      incidentCount: 0,
      fatalityCount: 0,
      verifiedCameras: 0,
      candidateCameras: 1,
      summary:
        "The eastern frontier is a visibility problem first: queue pressure can build faster than the current camera coverage can confirm it.",
      watchpoints: [
        "Queue visibility gap at Aranyaprathet / Poipet",
        "Cross-border passenger and casino-linked traffic surges",
      ],
      signals: [
        "No confirmed incident cluster in the last sweep",
        "0 verified camera feeds",
        "1 scout slots still need validation",
      ],
      recommendedAction: "Tighten eastern crossing visibility. Keep provincial leads on a tighter check-in cycle.",
    },
    {
      id: "malaysia-frontier",
      label: "Malaysia frontier",
      counterpart: "Malaysia",
      posture: "watch",
      score: 55,
      incidentCount: 1,
      fatalityCount: 0,
      verifiedCameras: 1,
      candidateCameras: 1,
      summary:
        "Southern corridor flow remains active, but the command picture is still relying too heavily on proxy visibility south of Hat Yai.",
      watchpoints: [
        "Coach and freight pressure on Hat Yai / Sadao approaches",
        "Southern security tempo near Sungai Kolok and Narathiwat",
      ],
      signals: ["1 matched field incidents", "1 verified camera feeds", "1 scout slots still need validation"],
      recommendedAction: "Keep the southern corridor moving. Keep provincial leads on a tighter check-in cycle.",
    },
  ],
  topConcerns: [
    {
      id: "myanmar-frontier-concern-1",
      areaId: "myanmar-frontier",
      areaLabel: "Myanmar frontier",
      label: "Conflict spillover around Mae Sot / Myawaddy",
      posture: "priority",
      detail: "4 matched field incidents and 7 reported fatalities are keeping the western frontier at priority.",
      metric: "4 incidents",
    },
    {
      id: "cambodia-frontier-concern-1",
      areaId: "cambodia-frontier",
      areaLabel: "Cambodia frontier",
      label: "Queue visibility gap at Aranyaprathet / Poipet",
      posture: "watch",
      detail:
        "The eastern frontier is a visibility problem first: queue pressure can build faster than the current camera coverage can confirm it.",
      metric: "0/1 feeds",
    },
  ],
  actionQueue: [
    {
      id: "myanmar-frontier-action",
      areaId: "myanmar-frontier",
      areaLabel: "Myanmar frontier",
      title: "Stabilize the western frontier posture. Escalate cross-agency coordination immediately.",
      detail:
        "Myanmar frontier is the lead intervention area because it combines live field pressure with the highest command score.",
      owner: "Interior + provincial governors",
      posture: "priority",
    },
    {
      id: "cambodia-frontier-action",
      areaId: "cambodia-frontier",
      areaLabel: "Cambodia frontier",
      title: "Tighten eastern crossing visibility. Keep provincial leads on a tighter check-in cycle.",
      detail:
        "Cambodia frontier needs a governor-ready check because pressure is building faster than static reporting can show.",
      owner: "Customs + immigration",
      posture: "watch",
    },
  ],
  sources: [
    "Thailand incident monitor",
    "Reference market indicators",
    "Critical camera network",
  ],
};

const historicalBorderBriefResponse = {
  generatedAt: "2026-03-14T10:45:00.000Z",
  headline: "Cambodia frontier carried the archived command picture",
  summary:
    "Archived queue pressure on the eastern frontier outran camera validation, while Myanmar and Malaysia sat one notch lower in the stored command stack.",
  overallPosture: "watch",
  overallScore: 62,
  overallScoreMethod: "archive-reconstructed",
  mode: "historical",
  areas: [
    {
      id: "cambodia-frontier",
      label: "Cambodia frontier",
      counterpart: "Cambodia",
      posture: "watch",
      score: 62,
      incidentCount: 1,
      fatalityCount: 0,
      verifiedCameras: 0,
      candidateCameras: 1,
      summary: "Archived queue pressure around Aranyaprathet outran camera validation on that command day.",
      watchpoints: [
        "Checkpoint queue surge at Aranyaprathet / Poipet",
        "Visibility gap on the eastern gate",
      ],
      signals: ["1 archived incident", "0 verified camera feeds", "USD/THB -0.2"],
      recommendedAction: "Rebuild eastern crossing visibility from the archived command note.",
      scoreBreakdown: {
        baseScore: 40,
        baseScoreRationale: "Archived eastern-border baseline.",
        contributions: [],
        rawTotal: 62,
        clampedScore: 62,
        formula: "archive",
      },
    },
    {
      id: "myanmar-frontier",
      label: "Myanmar frontier",
      counterpart: "Myanmar",
      posture: "watch",
      score: 58,
      incidentCount: 2,
      fatalityCount: 1,
      verifiedCameras: 1,
      candidateCameras: 0,
      summary: "Western spillover stayed present in the archive but no longer led the board.",
      watchpoints: ["Mae Sot freight disruption"],
      signals: ["2 archived incidents", "1 verified camera feed"],
      recommendedAction: "Maintain western monitoring from the archived brief.",
      scoreBreakdown: {
        baseScore: 42,
        baseScoreRationale: "Archived western-border baseline.",
        contributions: [],
        rawTotal: 58,
        clampedScore: 58,
        formula: "archive",
      },
    },
  ],
  topConcerns: [
    {
      id: "historical-cambodia-1",
      areaId: "cambodia-frontier",
      areaLabel: "Cambodia frontier",
      label: "Checkpoint queue surge at Aranyaprathet / Poipet",
      posture: "watch",
      detail: "Archived queue pressure around Aranyaprathet outran camera validation on that command day.",
      metric: "1 incident",
    },
  ],
  actionQueue: [
    {
      id: "historical-cambodia-action",
      areaId: "cambodia-frontier",
      areaLabel: "Cambodia frontier",
      title: "Rebuild eastern crossing visibility from the archived command note.",
      detail: "Eastern gate visibility was the lead archived intervention queue item.",
      owner: "Customs + immigration",
      posture: "watch",
    },
  ],
  sources: ["Border command archive"],
};

const liveNarrativeResponse = {
  narrative:
    "Myanmar frontier still leads the live command story while Cambodia needs tighter queue visibility and Malaysia stays on proxy watch.",
  generatedAt: "2026-03-15T09:00:00.000Z",
  signalCount: 12,
  mode: "live",
};

const historicalNarrativeResponse = {
  narrative:
    "14 Mar 2026 playback captured 8 archived border signals, with Cambodia frontier carrying the densest command picture. No alert-weight signals were archived in that window. Lead archive marker: Archived checkpoint queues overwhelmed the eastern gate notes.",
  generatedAt: "2026-03-14T10:45:00.000Z",
  signalCount: 8,
  mode: "historical",
};

const criticalCameraResponse = {
  generatedAt: "2026-03-15T09:00:00.000Z",
  cameras: [
    {
      id: "mae-sot-crossing",
      label: "Mae Sot crossing",
      category: "border",
      lat: 16.7163,
      lng: 98.5746,
      provider: "Pictimo public webcam",
      sourcePageUrl: "https://example.com/mae-sot",
      snapshotUrl: "/api/critical-cameras/mae-sot-crossing/snapshot",
      validationState: "verified",
      locationLabel: "Tak / Myawaddy approach",
      focusArea: "Border gate",
      strategicNote: "Western crossing watchpoint for queue buildup and truck movement.",
      status: "live",
      refreshSeconds: 180,
      lastCheckedAt: "2026-03-15T09:00:00.000Z",
    },
    {
      id: "aranyaprathet-gate",
      label: "Aranyaprathet gate",
      category: "border",
      lat: 13.6587,
      lng: 102.5636,
      provider: "Scout slot",
      sourcePageUrl: "https://example.com/aranyaprathet",
      validationState: "candidate",
      locationLabel: "Sa Kaeo / Poipet approach",
      focusArea: "Eastern gate",
      strategicNote: "Camera scout slot for queue buildup and customs pressure.",
      status: "stale",
      refreshSeconds: 180,
      lastCheckedAt: "2026-03-15T09:00:00.000Z",
    },
  ],
};

const historicalMarketResponse = {
  generatedAt: "2026-03-14T08:55:00.000Z",
  data: [
    {
      label: "USD/THB",
      value: 31.98,
      change: -0.2,
      up: false,
      category: "FX",
      source: "Postgres market history",
    },
    {
      label: "MYR/THB",
      value: 8.05,
      change: -0.03,
      up: false,
      category: "FX",
      source: "Postgres market history",
    },
  ],
  signals: [],
  aseanGdp: [],
  sources: ["Postgres market history"],
  mode: "historical",
};

const historicalNewsResponse = {
  generatedAt: "2026-03-14T10:40:00.000Z",
  mode: "historical",
  news: [
    {
      id: "border-news-h-1",
      title: "Archived checkpoint queues overwhelmed the eastern gate notes",
      summary: "Stored border headlines show the Cambodia frontier carrying the archived command picture.",
      source: "Border command archive",
      tag: "Archive",
      publishedAt: "2026-03-14T10:20:00.000Z",
      severity: "watch",
    },
  ],
};

const historicalTickerResponse = {
  generatedAt: "2026-03-14T10:45:00.000Z",
  mode: "historical",
  items: [
    { id: "arch-1", label: "USD/THB", value: "31.98", delta: "-0.2", tone: "down" },
    { id: "arch-2", label: "Archive", value: "8 signals", delta: "Cambodia frontier", tone: "neutral" },
  ],
};

const borderTrafficResponse = [
  {
    id: "traffic-1",
    title: "Queue buildup near Mae Sot customs approach",
    description: "Truck movement is slowing on the western gate.",
    lat: 16.72,
    lng: 98.58,
    category: "jam",
    severity: 4,
    start: "2026-03-15T08:10:00.000Z",
    stop: "2026-03-15T10:10:00.000Z",
  },
  {
    id: "traffic-2",
    title: "Checkpoint friction south of Sadao",
    description: "Coach traffic is bunching before the customs lanes.",
    lat: 6.76,
    lng: 100.43,
    category: "roadclosed",
    severity: 3,
    start: "2026-03-15T08:25:00.000Z",
    stop: "2026-03-15T11:00:00.000Z",
  },
];

const operationsMapResponse = {
  generatedAt: "2026-03-15T09:00:00.000Z",
  nationalView: {
    longitude: 100.85,
    latitude: 14.2,
    zoom: 6.25,
    pitch: 40,
    bearing: 0,
  },
  theaters: [
    {
      id: "myanmar-frontier",
      label: "Myanmar frontier",
      counterpart: "Myanmar",
      summary: "Western conflict-spillover theater with Mae Sot and Tak logistics as the main operational spine.",
      focusView: {
        longitude: 98.86,
        latitude: 16.82,
        zoom: 8.45,
        pitch: 48,
        bearing: 18,
      },
      deepZoomRadiusKm: 170,
      generalZoom: 8.45,
      deepZoom: 15.6,
    },
    {
      id: "cambodia-frontier",
      label: "Cambodia frontier",
      counterpart: "Cambodia",
      summary: "Eastern customs and queue-management theater anchored on Aranyaprathet.",
      focusView: {
        longitude: 102.42,
        latitude: 13.61,
        zoom: 8.65,
        pitch: 46,
        bearing: 12,
      },
      deepZoomRadiusKm: 155,
      generalZoom: 8.65,
      deepZoom: 15.6,
    },
    {
      id: "malaysia-frontier",
      label: "Southern frontier",
      counterpart: "Malaysia",
      summary: "Southern freight and security theater from Sadao through Hat Yai to Sungai Kolok.",
      focusView: {
        longitude: 100.82,
        latitude: 6.84,
        zoom: 8.6,
        pitch: 47,
        bearing: 10,
      },
      deepZoomRadiusKm: 185,
      generalZoom: 8.6,
      deepZoom: 15.8,
    },
  ],
  nodes: [
    {
      id: "mae-sot-sez",
      theaterId: "myanmar-frontier",
      label: "Mae Sot SEZ",
      shortLabel: "MAE SOT",
      type: "sez",
      coordinates: [98.5746, 16.7163],
      summary: "Primary western customs and industrial gate facing Myawaddy.",
      usage: "Truck, relief, and labor flows stack here first when conflict hits the frontier.",
      focusView: {
        longitude: 98.6104,
        latitude: 16.7089,
        zoom: 12.45,
        pitch: 50,
        bearing: 16,
      },
      allowsDeepZoom: true,
      emphasis: "primary",
    },
    {
      id: "aranyaprathet-sez",
      theaterId: "cambodia-frontier",
      label: "Aranyaprathet SEZ",
      shortLabel: "ARAN",
      type: "sez",
      coordinates: [102.5636, 13.6587],
      summary: "Eastern gate where queue visibility and customs processing collide.",
      usage: "Passenger processing and bus turnover all compress into one gate picture here.",
      focusView: {
        longitude: 102.5608,
        latitude: 13.6669,
        zoom: 12.55,
        pitch: 50,
        bearing: 12,
      },
      allowsDeepZoom: true,
      emphasis: "primary",
    },
    {
      id: "sadao-sez",
      theaterId: "malaysia-frontier",
      label: "Sadao SEZ",
      shortLabel: "SADAO",
      type: "sez",
      coordinates: [100.4186, 6.7483],
      summary: "Primary southern customs gate facing Bukit Kayu Hitam.",
      usage: "The main freight and coach pressure valve on the Malaysia corridor.",
      focusView: {
        longitude: 100.4275,
        latitude: 6.7481,
        zoom: 12.45,
        pitch: 50,
        bearing: 10,
      },
      allowsDeepZoom: true,
      emphasis: "primary",
    },
  ],
  corridors: [
    {
      id: "west-conflict-spine",
      theaterId: "myanmar-frontier",
      label: "Mae Sot / Myawaddy spine",
      shortLabel: "WEST SPINE",
      coordinates: [
        [98.5746, 16.7163],
        [98.7212, 16.6408],
        [98.9115, 16.6911],
        [99.1296, 16.8847],
      ],
      mode: "mixed",
      summary: "Primary western corridor linking the border bridge to inland staging.",
      usage: "2,400 daily displacement and relief transfers near Mae Sot",
      emphasis: "primary",
    },
    {
      id: "east-customs-spine",
      theaterId: "cambodia-frontier",
      label: "Aranyaprathet / Poipet customs spine",
      shortLabel: "EAST SPINE",
      coordinates: [
        [102.5636, 13.6587],
        [102.4308, 13.6196],
        [102.2518, 13.6211],
        [102.0837, 13.6904],
      ],
      mode: "passenger",
      summary: "Primary eastern customs line where passenger queues become visible first.",
      usage: "6,800 daily passenger and customs crossings at Aranyaprathet",
      emphasis: "primary",
    },
    {
      id: "south-freight-spine",
      theaterId: "malaysia-frontier",
      label: "Sadao / Hat Yai freight spine",
      shortLabel: "SOUTH SPINE",
      coordinates: [
        [100.4186, 6.7483],
        [100.4529, 6.8797],
        [100.4747, 7.0084],
        [100.6172, 7.1628],
      ],
      mode: "freight",
      summary: "Primary southern freight spine linking customs to Hat Yai consolidation.",
      usage: "18,200 daily freight and coach movements through Sadao / Hat Yai",
      emphasis: "primary",
    },
  ],
  liveFlows: [],
  sources: [
    "Curated tri-border theater geometry",
    "Border movement API",
    "Operational node annotations",
  ],
};

function isHistoricalUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  return url.searchParams.has("from") && url.searchParams.has("to");
}

async function mockBorderDashboard(page: Page) {
  const sparklineRequests: string[] = [];
  await page.clock.setFixedTime(new Date("2026-03-15T09:00:00.000Z"));

  await page.route("**/api/border-command/brief**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isHistoricalUrl(route.request().url())
          ? historicalBorderBriefResponse
          : borderBriefResponse,
      ),
    });
  });

  await page.route("**/api/border-command/narrative**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isHistoricalUrl(route.request().url())
          ? historicalNarrativeResponse
          : liveNarrativeResponse,
      ),
    });
  });

  await page.route("**/api/critical-cameras", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(criticalCameraResponse),
    });
  });

  await page.route("**/api/critical-cameras/**/snapshot", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
        <rect width="100%" height="100%" fill="#111827"/>
        <text x="24" y="92" fill="#f8fafc" font-family="Arial" font-size="18">Border camera</text>
      </svg>`,
    });
  });

  await page.route("**/api/border/incidents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/fires", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/flights", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/border/movements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/border/traffic", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(borderTrafficResponse),
    });
  });

  await page.route("**/api/border/operations-map", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(operationsMapResponse),
    });
  });

  await page.route("**/api/map/overlays", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });

  await page.route("**/api/markets**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isHistoricalUrl(route.request().url())
          ? historicalMarketResponse
          : {
              generatedAt: "2026-03-15T09:00:00.000Z",
              data: [
                {
                  label: "USD/THB",
                  value: 32.28,
                  change: 0.05,
                  up: true,
                  category: "FX",
                  source: "ExchangeRate API (open.er-api.com)",
                },
                {
                  label: "MYR/THB",
                  value: 8.21,
                  change: 0,
                  up: true,
                  category: "FX",
                  source: "ExchangeRate API (open.er-api.com)",
                },
              ],
              signals: [],
              aseanGdp: [],
              sources: ["ExchangeRate API (open.er-api.com)", "Binance BTCUSDT"],
              mode: "live",
            },
      ),
    });
  });

  await page.route("**/api/border/news**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isHistoricalUrl(route.request().url())
          ? historicalNewsResponse
          : {
              generatedAt: "2026-03-15T09:00:00.000Z",
              news: [
                {
                  id: "border-news-1",
                  title: "Mae Sot trade queue lengthens after overnight clashes",
                  summary: "Truck clearance times extended on the western frontier after renewed conflict spillover.",
                  source: "ACLED / Border Monitor",
                  tag: "Conflict",
                  publishedAt: "2026-03-15T08:40:00.000Z",
                  severity: "alert",
                },
                {
                  id: "border-news-2",
                  title: "Aranyaprathet checkpoint visibility remains thin",
                  summary: "Officials are still relying on intermittent field checks while eastern queue pressure builds.",
                  source: "Provincial logistics desk",
                  tag: "Crossing",
                  publishedAt: "2026-03-15T08:10:00.000Z",
                  severity: "watch",
                },
              ],
              mode: "live",
            },
      ),
    });
  });

  await page.route("**/api/border/ticker**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isHistoricalUrl(route.request().url())
          ? historicalTickerResponse
          : {
              generatedAt: "2026-03-15T09:00:00.000Z",
              items: [
                { id: "fx-1", label: "USD/THB", value: "32.28", delta: "+0.05", tone: "up" },
                { id: "field-1", label: "Field signals", value: "4 active", delta: "Mae Sot", tone: "up" },
              ],
              mode: "live",
            },
      ),
    });
  });

  await page.route("**/api/research/trends**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        trends: [
          { summary_date: "2026-03-13", region: "cambodia-frontier", signal_type: "political", signal_count: 3 },
          { summary_date: "2026-03-14", region: "cambodia-frontier", signal_type: "political", signal_count: 8 },
          { summary_date: "2026-03-15", region: "myanmar-frontier", signal_type: "political", signal_count: 5 },
        ],
        total: 3,
      }),
    });
  });

  await page.route("**/api/research/signals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        signals: [],
        total: 0,
      }),
    });
  });

  await page.route("**/api/research/sparklines**", async (route) => {
    const rawUrl = route.request().url();
    sparklineRequests.push(rawUrl);
    const url = new URL(rawUrl);
    const metric = url.searchParams.get("metric");
    const historical = isHistoricalUrl(rawUrl);

    const values =
      historical && metric === "score:cambodia-frontier"
        ? [48, 51, 55, 62]
        : historical
          ? [30, 31, 31.4, 31.98]
          : metric === "score:myanmar-frontier"
            ? [72, 78, 81, 86]
            : [31.8, 32.0, 32.1, 32.28];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ values }),
    });
  });

  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        version: "test-build",
        signal_strength: 92,
        checkedAt: "2026-03-15T09:00:00.000Z",
        posture: "live",
        datasets: [],
        services: {
          database: "supabase-postgres",
          markets: "live",
          border_command: "live",
          satellite_layers: "live",
        },
      }),
    });
  });

  await page.route("**/api/data/catalog", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        databaseConfigured: true,
        generatedAt: "2026-03-15T09:00:00.000Z",
        totalRows: 1280,
        tables: [
          {
            id: "events",
            label: "Events",
            description: "Border incident stream",
            category: "signals",
            columns: ["external_id", "event_type", "location"],
            rowCount: 320,
            latestValue: "2026-03-15T08:40:00.000Z",
          },
        ],
      }),
    });
  });

  await page.route("**/api/data/table**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        databaseConfigured: true,
        generatedAt: "2026-03-15T09:00:00.000Z",
        table: {
          id: "events",
          label: "Events",
          description: "Border incident stream",
          category: "signals",
          columns: ["external_id", "event_type", "location"],
          rowCount: 320,
          latestValue: "2026-03-15T08:40:00.000Z",
        },
        limit: 25,
        rows: [
          {
            external_id: "EVT-001",
            event_type: "Conflict",
            location: "Mae Sot",
          },
        ],
      }),
    });
  });

  return { sparklineRequests };
}

test("renders the tri-border command story with scout camera coverage", async ({
  page,
}) => {
  await mockBorderDashboard(page);

  await page.goto("/");

  await expect(page.getByText("THAILAND GEOPOLITICAL WATCH")).toBeVisible();
  await expect(page.getByText("Operations Focus")).toBeVisible();
  await expect(page.getByText("National frame")).toBeVisible();
  await expect(
    page.getByText("Myanmar frontier is the lead intervention area today").first(),
  ).toBeVisible();
  await expect(page.getByText("Cambodia frontier").first()).toBeVisible();
  await expect(
    page.getByText("Queue visibility gap at Aranyaprathet / Poipet").first(),
  ).toBeVisible();
  await expect(page.getByTestId("border-market-pulse")).toContainText("32.28");
  await expect(page.getByTestId("border-market-pulse")).toContainText(
    "ExchangeRate API (open.er-api.com)",
  );
  await expect(page.getByTestId("border-news-desk")).toContainText(
    "Mae Sot trade queue lengthens after overnight clashes",
  );
  await expect(page.getByTestId("critical-camera-rail")).toContainText("Aranyaprathet gate");
  await expect(page.getByTestId("critical-camera-rail")).toContainText("candidate");
});

test("opens the top-bar command modals from the border dashboard", async ({
  page,
}) => {
  await mockBorderDashboard(page);

  await page.goto("/");

  await page.getByRole("button", { name: "APIs" }).click();
  await expect(page.getByText("APIs And System Architecture")).toBeVisible();
  await page.getByRole("button", { name: "Close architecture reference" }).click();

  await expect(page.getByText("APIs And System Architecture")).toHaveCount(0);

  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByText("Operator Manual", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close dashboard manual" }).click();
});

test("gives phone users a map-first shell with reachable intelligence panels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBorderDashboard(page);

  await page.goto("/");

  const title = page.getByText("THAILAND GEOPOLITICAL WATCH");
  await expect(title).toBeVisible();
  const titleBox = await title.boundingBox();
  expect(titleBox?.x ?? 400).toBeLessThan(390);
  expect((titleBox?.x ?? 0) + (titleBox?.width ?? 400)).toBeLessThanOrEqual(390);

  await page.getByRole("button", { name: "Open mobile intelligence panels" }).click();
  const commandPanels = page.getByRole("dialog", { name: "Command Panels" });
  await expect(commandPanels).toBeVisible();
  await expect(commandPanels.getByRole("button", { name: "brief" })).toHaveAttribute("aria-pressed", "true");

  await commandPanels.getByRole("button", { name: "news" }).click();
  await expect(commandPanels.getByText("Border News Wire", { exact: true })).toBeVisible();

  await commandPanels.getByRole("button", { name: "history" }).click();
  await expect(commandPanels.getByTestId("time-machine-day-2026-03-14")).toBeVisible();
});

test("replays archived command surfaces while keeping live-only panels labeled", async ({
  page,
}) => {
  const { sparklineRequests } = await mockBorderDashboard(page);

  await page.goto("/");
  await page.getByTestId("time-machine-day-2026-03-14").click();

  await expect(page.getByText("Playback 14 Mar 2026", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Cambodia frontier carried the archived command picture").first(),
  ).toBeVisible();
  await expect(page.getByTestId("border-market-pulse")).toContainText("31.98");
  await expect(page.getByTestId("border-news-desk")).toContainText(
    "Archived checkpoint queues overwhelmed the eastern gate notes",
  );
  await expect(page.getByTestId("critical-camera-rail")).toContainText(
    "Live reference only during playback for 14 Mar 2026",
  );
  await expect(
    page.getByText("Map and overlay feeds stay live during playback for 14 Mar 2026."),
  ).toBeVisible();

  await expect.poll(() =>
    sparklineRequests.some((url) =>
      url.includes("metric=score%3Acambodia-frontier")
      && url.includes("from=2026-03-13T17%3A00%3A00.000Z")
      && url.includes("to=2026-03-14T16%3A59%3A59.999Z"),
    ),
  ).toBeTruthy();
});
