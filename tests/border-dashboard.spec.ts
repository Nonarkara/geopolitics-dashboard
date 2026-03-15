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

async function mockBorderDashboard(page: Page) {
  await page.route("**/api/border-command/brief", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(borderBriefResponse),
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

  await page.route("**/api/map/overlays", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });

  await page.route("**/api/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
      }),
    });
  });

  await page.route("**/api/border/news", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
      }),
    });
  });

  await page.route("**/api/border/ticker", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        generatedAt: "2026-03-15T09:00:00.000Z",
        items: [
          { id: "fx-1", label: "USD/THB", value: "32.28", delta: "+0.05", tone: "up" },
          { id: "field-1", label: "Field signals", value: "4 active", delta: "Mae Sot", tone: "up" },
        ],
      }),
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
        services: {
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
}

test("renders the tri-border command story with scout camera coverage", async ({
  page,
}) => {
  await mockBorderDashboard(page);

  await page.goto("/");

  await expect(page.getByText("THAILAND TRI-BORDER COMMAND")).toBeVisible();
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

  await page.getByRole("button", { name: "Data" }).click();
  await expect(page.getByText("Data Explorer")).toBeVisible();
  await page.getByRole("button", { name: "Close data explorer" }).click();

  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByText("Operator Manual")).toBeVisible();
  await page.getByRole("button", { name: "Close dashboard manual" }).click();
});
