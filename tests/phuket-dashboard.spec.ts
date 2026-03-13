import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const cameraResponse = {
  generatedAt: "2026-03-14T09:00:00.000Z",
  cameras: [
    {
      id: "patong-coast",
      label: "Patong coast",
      category: "beach",
      lat: 7.8964,
      lng: 98.2956,
      provider: "SCS Webcam",
      sourcePageUrl: "https://example.com/patong-coast",
      snapshotUrl: "/api/public-cameras/patong-coast/snapshot",
      status: "live",
      refreshSeconds: 180,
      lastCheckedAt: "2026-03-14T09:00:00.000Z",
    },
    {
      id: "kata-beach",
      label: "Kata beach",
      category: "beach",
      lat: 7.8207,
      lng: 98.2989,
      provider: "SSS Phuket",
      sourcePageUrl: "https://example.com/kata-beach",
      snapshotUrl: "/api/public-cameras/kata-beach/snapshot",
      status: "live",
      refreshSeconds: 180,
      lastCheckedAt: "2026-03-14T09:00:00.000Z",
    },
    {
      id: "bangla-road",
      label: "Bangla Road",
      category: "nightlife",
      lat: 7.8935,
      lng: 98.2968,
      provider: "SCS Webcam",
      sourcePageUrl: "https://example.com/bangla-road",
      snapshotUrl: "/api/public-cameras/bangla-road/snapshot",
      status: "live",
      refreshSeconds: 180,
      lastCheckedAt: "2026-03-14T09:00:00.000Z",
    },
  ],
};

const packageResponse = {
  generatedAt: "2026-03-14T09:00:00.000Z",
  mode: "live",
  sources: [],
  packages: [
    {
      id: "marine-weather",
      title: "Marine and Monsoon Conditions",
      headline: "West coast sea-state remains the lead operating pressure.",
      summary: "Weather-led operating picture",
      description: "Weather-led operating picture",
      priorities: [],
      dominantTags: ["marine", "weather"],
      sourceLabels: ["Phuket Express", "Open-Meteo"],
      updatedAt: "2026-03-14T08:55:00.000Z",
      status: "live",
      stats: {
        total: 2,
        elevated: 1,
        dominantTags: ["marine", "weather"],
        incidents: 0,
        markets: 0,
        weather: 2,
      },
      items: [
        {
          id: "marine-1",
          packageId: "marine-weather",
          title: "Pier advisories up on the west coast",
          summary:
            "High surf pressure is concentrating around Patong, Kata, and Karon, with intermittent pier advisories.",
          source: "Phuket Express",
          sourceUrl: "https://example.com/phuket-express",
          publishedAt: "2026-03-14T08:30:00.000Z",
          url: "https://example.com/marine-1",
          tags: ["marine"],
          score: 88,
          severity: "watch",
          kind: "weather",
        },
        {
          id: "marine-2",
          packageId: "marine-weather",
          title: "Rain cells rebuilding north of the bay",
          summary:
            "Short-duration rain bursts are likely to slow road transfers into town and the airport corridor.",
          source: "Open-Meteo",
          sourceUrl: "https://example.com/open-meteo",
          publishedAt: "2026-03-14T08:15:00.000Z",
          url: "https://example.com/marine-2",
          tags: ["rain"],
          score: 81,
          severity: "stable",
          kind: "weather",
        },
      ],
    },
    {
      id: "tourism-demand",
      title: "Tourism Demand and Transfers",
      headline: "Arrivals remain strong while inner Patong traffic is tightening.",
      summary: "Demand-led operating picture",
      description: "Demand-led operating picture",
      priorities: [],
      dominantTags: ["tourism", "mobility"],
      sourceLabels: ["Phuket monitor", "OpenSky"],
      updatedAt: "2026-03-14T08:50:00.000Z",
      status: "live",
      stats: {
        total: 2,
        elevated: 1,
        dominantTags: ["tourism", "mobility"],
        incidents: 1,
        markets: 0,
        weather: 0,
      },
      items: [
        {
          id: "tourism-1",
          packageId: "tourism-demand",
          title: "Airport transfer demand holding above baseline",
          summary:
            "Strong arrivals are sustaining airport-to-beach transfers and compressing turnaround windows into the afternoon.",
          source: "Phuket monitor",
          sourceUrl: "https://example.com/phuket-monitor",
          publishedAt: "2026-03-14T08:05:00.000Z",
          url: "https://example.com/tourism-1",
          tags: ["tourism"],
          score: 75,
          severity: "watch",
          kind: "movement",
        },
        {
          id: "tourism-2",
          packageId: "tourism-demand",
          title: "Bangla Road footfall rising ahead of night cycle",
          summary:
            "Hospitality demand is concentrating earlier in the evening, with Bangla Road camera conditions showing a faster pickup.",
          source: "Phuket monitor",
          sourceUrl: "https://example.com/phuket-monitor",
          publishedAt: "2026-03-14T07:50:00.000Z",
          url: "https://example.com/tourism-2",
          tags: ["nightlife"],
          score: 69,
          severity: "stable",
          kind: "news",
        },
      ],
    },
  ],
};

const sourceResponse = {
  generatedAt: "2026-03-14T09:00:00.000Z",
  sources: [
    {
      id: "source-1",
      label: "Phuket Express feed",
      url: "https://example.com/feed/phuket-express",
      kind: "rss",
      target: "Phuket Intelligence",
      health: "live",
    },
    {
      id: "source-2",
      label: "Open-Meteo weather",
      url: "https://example.com/feed/open-meteo",
      kind: "json",
      target: "Open-Meteo",
      health: "live",
    },
    {
      id: "source-3",
      label: "OpenSky air traffic",
      url: "https://example.com/feed/opensky",
      kind: "json",
      target: "OpenSky",
      health: "stale",
    },
  ],
};

const tickerResponse = {
  generatedAt: "2026-03-14T09:00:00.000Z",
  items: [
    { id: "1", label: "Packages", value: "4 live", delta: "live", tone: "up" },
    { id: "2", label: "Field signals", value: "5 active", delta: "weather", tone: "up" },
    { id: "3", label: "USD/THB", value: "35.7", delta: "-0.2", tone: "down" },
    { id: "4", label: "Theme", value: "marine", delta: "2 elevated", tone: "up" },
  ],
};

const environmentResponse = [
  { code: "HKT", location: "Phuket", temperature: 31, aqi: 44 },
];

const incidentsResponse = [
  {
    id: "INC-1",
    geometry: { coordinates: [98.2956, 7.8964] },
    properties: {
      title: "Patong marine pressure",
      type: "Marine advisory",
      fatalities: 0,
      notes: "Surf pressure elevated around Patong.",
      location: "Patong",
      eventDate: "2026-03-14T08:00:00.000Z",
    },
  },
];

const firesResponse = [
  {
    latitude: 7.86,
    longitude: 98.32,
    brightness: 300,
    confidence: "nominal",
    acq_date: "2026-03-14T08:00:00.000Z",
  },
];

const movementsResponse = [
  {
    source: [98.306, 8.113],
    target: [98.296, 7.896],
    count: 12000,
    label: "Airport -> Patong",
  },
];

const rainfallResponse = [
  { lat: 7.88, lng: 98.39, value: 24, label: "Phuket Town" },
];

const airQualityResponse = [
  {
    lat: 7.88,
    lng: 98.39,
    label: "Phuket Town",
    aqi: 44,
    pm25: 9,
    category: "Good",
  },
];

const flightsResponse = [
  {
    icao24: "abc123",
    callsign: "THA101",
    longitude: 98.305,
    latitude: 8.12,
    altitude: 2100,
    velocity: 230,
    heading: 180,
    origin_country: "Thailand",
    on_ground: false,
  },
];

const emptyFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function cameraSvg(label: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#0f766e" offset="0"/>
          <stop stop-color="#111827" offset="1"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bg)"/>
      <circle cx="520" cy="84" r="26" fill="#f59e0b" opacity="0.9"/>
      <text x="40" y="72" fill="#f8fafc" font-family="Arial" font-size="30" font-weight="700">${label}</text>
      <text x="40" y="120" fill="#bae6fd" font-family="Arial" font-size="18">Mock live camera snapshot</text>
      <rect x="40" y="250" width="200" height="44" rx="22" fill="#111827" opacity="0.8"/>
      <text x="68" y="278" fill="#f8fafc" font-family="Arial" font-size="18">Phuket conditions</text>
    </svg>
  `;
}

async function mockDashboardApis(page: Page) {
  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "operational",
        version: "4.3.0",
        signal_strength: 0.98,
        services: {
          basemap: "configured",
          intelligence_cache: "hybrid",
        },
      }),
    });
  });

  await page.route("**/api/environment", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(environmentResponse),
    });
  });

  await page.route("**/api/public-cameras", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(cameraResponse),
    });
  });

  await page.route("**/api/public-cameras/*/snapshot", async (route) => {
    if (route.request().url().includes("bangla-road")) {
      await route.fulfill({
        status: 502,
        contentType: "text/plain",
        body: "offline",
      });
      return;
    }

    const label = route.request().url().includes("kata-beach")
      ? "Kata Beach"
      : "Patong Coast";

    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: cameraSvg(label),
    });
  });

  await page.route("**/api/intelligence/packages", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageResponse),
    });
  });

  await page.route("**/api/sources", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sourceResponse),
    });
  });

  await page.route("**/api/ticker", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tickerResponse),
    });
  });

  await page.route("**/api/incidents", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(incidentsResponse),
    });
  });

  await page.route("**/api/fires", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(firesResponse),
    });
  });

  await page.route("**/api/movements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(movementsResponse),
    });
  });

  await page.route("**/api/rainfall", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rainfallResponse),
    });
  });

  await page.route("**/api/air-quality", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(airQualityResponse),
    });
  });

  await page.route("**/api/flights", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(flightsResponse),
    });
  });

  await page.route("**/api/live-tv**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ videoId: "dQw4w9WgXcQ" }),
    });
  });

  await page.route("**/data/region_borders.geojson", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyFeatureCollection),
    });
  });

  await page.route("**/data/conflict_zones.geojson", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyFeatureCollection),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockDashboardApis(page);
});

test("renders the Phuket bottom rail with live feeds, dossier, and context", async ({
  page,
}) => {
  await page.goto("/phuket");

  await expect(page.getByTestId("phuket-bottom-rail")).toBeVisible();
  await expect(page.getByTestId("live-feeds-zone")).toBeVisible();
  await expect(page.getByTestId("signal-dossier-zone")).toBeVisible();
  await expect(page.getByTestId("context-rail-zone")).toBeVisible();
  await expect(page.getByTestId("camera-card-patong-coast")).toBeVisible();
  await expect(page.getByTestId("tv-card-pbs")).toBeVisible();
  await expect(page.getByText("Local signal stream")).toHaveCount(0);
});

test("toggles satellite and layer controls and keeps opacity slider in sync", async ({
  page,
}) => {
  await page.goto("/phuket");
  await expect(page.getByTestId("camera-marker-patong-coast")).toBeVisible();

  const imageryFalseColor = page.getByTestId("imagery-modisFalseColor");
  await expect(imageryFalseColor).toBeVisible();
  await imageryFalseColor.click();
  await expect(imageryFalseColor).toHaveAttribute("aria-pressed", "true");

  const nasaOverlay = page.getByTestId("map-mode-satellite-overlay");
  const aerialBase = page.getByTestId("map-mode-aerial-base");
  const roadsBase = page.getByTestId("map-mode-roads-base");
  const opacitySlider = page.getByTestId("satellite-opacity-slider");

  await expect(opacitySlider).toBeEnabled();
  await nasaOverlay.click();
  await expect(nasaOverlay).toHaveAttribute("aria-pressed", "false");
  await expect(opacitySlider).toBeDisabled();
  await nasaOverlay.click();
  await expect(opacitySlider).toBeEnabled();

  for (const button of [aerialBase, roadsBase]) {
    const before = await button.getAttribute("aria-pressed");
    await button.click();
    await expect(button).toHaveAttribute(
      "aria-pressed",
      before === "true" ? "false" : "true",
    );
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", before ?? "false");
  }

  const layerButtons = page.locator('[data-testid^="map-layer-"]');
  const layerCount = await layerButtons.count();
  expect(layerCount).toBeGreaterThan(0);

  for (let index = 0; index < layerCount; index += 1) {
    const button = layerButtons.nth(index);
    await button.scrollIntoViewIfNeeded();
    const before = await button.getAttribute("aria-pressed");
    await button.click();
    await expect(button).toHaveAttribute(
      "aria-pressed",
      before === "true" ? "false" : "true",
    );
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", before ?? "false");
  }
});

test("renders camera markers, opens map detail, and degrades offline snapshots safely", async ({
  page,
}) => {
  await page.goto("/phuket");

  await expect(page.getByTestId("camera-marker-patong-coast")).toBeVisible();
  await page.getByTestId("camera-marker-patong-coast").click();
  await expect(page.getByTestId("camera-detail-card")).toBeVisible();
  await expect(page.getByTestId("camera-detail-card")).toContainText("Patong coast");

  await expect(page.getByTestId("camera-card-bangla-road")).toContainText("offline");
  await expect(page.getByTestId("camera-card-bangla-road")).toContainText(
    "Snapshot unavailable",
  );
});

test("shows the shared visible version badge on both dashboard variants", async ({
  page,
}) => {
  await page.goto("/phuket");
  await expect(page.getByTestId("dashboard-version-badge").first()).toHaveText("v4.3.0");

  await page.goto("/");
  await expect(page.getByTestId("dashboard-version-badge").first()).toHaveText("v4.3.0");
});
