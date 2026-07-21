# Phuket Dashboard

> **Deployment (read first):** the live site is the `overhaul` branch, deployed to Cloudflare **Workers** via OpenNext — `npm run build:worker && npm run deploy` (config: `wrangler.jsonc` + `open-next.config.ts` on `overhaul`). Cloudflare Pages (`wrangler.toml`) and Vercel (`vercel.json`) are retired and their configs were removed — do not re-add them. Maps render on free tiles via MapLibre; there is no Mapbox dependency anywhere (account deleted 2026-07).

Map-first monitoring dashboard for Phuket and nearby provinces, focused on tourism demand, road safety, rainfall, monsoon pressure, air quality, mobility, and local economy. The frontend is a Next.js app; the data layer is PostgreSQL/PostGIS plus Python ingestion scripts. This repo was cloned from the Geopolitics Dashboard system and retargeted as a Phuket-focused starter.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Deck.gl + react-map-gl
- PostgreSQL + PostGIS
- Python ingestion for market, fire, rainfall, mobility, and reference datasets

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL with PostGIS installed
- Python 3.9+ if you want to run ingestion

## Environment

To set up your local environment, create a `.env` file from the example:

```bash
cp .env.example .env
```

### Required Configuration

> [!IMPORTANT]
> You must provide your own API keys in the `.env` file. These are **not included** in the repository for security.

- `DATABASE_URL`: Your PostgreSQL + PostGIS connection string
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: [Mapbox](https://www.mapbox.com/) public token for the map engine
- `FIRMS_KEY`: (Optional but recommended) [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/config/realtime/) key for live fire ingestion
- `ACLED_USERNAME` and `ACLED_PASSWORD`: (Optional) current myACLED OAuth credentials for coded conflict-event ingestion
- `ACLED_EMAIL` and `ACLED_KEY`: legacy ACLED variables kept only for compatibility checks; they are no longer the preferred API auth path
- `OPENAI_API_KEY`: [OpenAI](https://platform.openai.com/) key for automated intelligence summaries
- `REFERENCE_DASHBOARD_URL`: (Optional) URL to an external data feed
- `NEXT_PUBLIC_ENABLE_DATA_EXPLORER`: (Optional) `true` only if you explicitly want the browser-facing database explorer/export tools visible in the UI
- `DATA_EXPLORER_ENABLED`: (Optional) `true` only if you explicitly want the `/api/data/*` routes enabled on the server
- `DATA_EXPLORER_TOKEN`: (Recommended when the explorer is enabled) bearer token required for `/api/data/*` access
- `ALLOW_MOCK_INGESTION`: Keep this `false` in any real environment so failed ingest jobs do not write demo rows into your database
- `INGEST_REQUEST_TIMEOUT_SECONDS`: Optional request timeout for Python ingestion jobs; defaults to `30`

## Setup

Install frontend dependencies:

```bash
npm install
```

Initialize the database schema:

```bash
./scripts/setup-db.sh
```

If `psql` is not installed locally, run `db/schema.sql` in your managed PostgreSQL/PostGIS console instead.

Install ingestion dependencies if needed:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r ingestion/requirements.txt
```

## Run

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI can still render with fallback data if the database is not populated yet, and it can also pull incidents, package sources, and market cards from the external reference dashboard.

## Ingestion

Run whichever scripts you need:

```bash
python ingestion/acled_ingest.py
python ingestion/hdx_ingest.py
python ingestion/firms_ingest.py
python ingestion/rainfall_ingest.py
```

Or warm the full pipeline in one shot:

```bash
python3 ingestion/run_all.py
```

List the available one-shot jobs:

```bash
npm run ingest:list
```

Current source posture for the one-shot bootstrap:

- `ingestion/hdx_ingest.py` now warms reference markets, ASEAN GDP snapshots, and best-effort country profile caches from ExchangeRate API, Binance, and World Bank
- `ingestion/rainfall_ingest.py` now uses Open-Meteo archive data instead of the blocked HDX rainfall endpoint
- `ingestion/air_quality_ingest.py` warms the stored Open-Meteo air-quality cache so `/api/status` can track that table honestly
- `ingestion/refugee_ingest.py` now uses the public UNHCR population API instead of the blocked HDX refugee endpoint
- `ingestion/acled_ingest.py` expects current ACLED OAuth credentials; without `ACLED_PASSWORD`, it skips cleanly as an optional feed
- `ingestion/firms_ingest.py` skips cleanly when `FIRMS_KEY` is absent, because thermal hotspots are optional

## Quality Checks

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## Render Deployment

This repo now includes a production-shaped `render.yaml` Blueprint:

- one Node web service
- one managed Postgres database
- five Python cron jobs for conflict, fires, rainfall, market, and refugee ingestion

Default production posture in the Blueprint:

- `ALLOW_MOCK_INGESTION=false`, so failed jobs fail loudly instead of polluting the database with demo data
- ACLED is treated as an optional feed unless valid OAuth credentials are configured
- `NEXT_PUBLIC_ENABLE_DATA_EXPLORER=false` and `DATA_EXPLORER_ENABLED=false`, so admin-ish DB routes stay off unless you explicitly enable them
- `DATA_EXPLORER_TOKEN` is generated automatically even when the explorer remains off

What you still need to set in Render:

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for a real basemap
- `OPENAI_API_KEY` if you want AI summaries
- `FIRMS_KEY` for live NASA FIRMS ingestion
- `ACLED_USERNAME` and `ACLED_PASSWORD` if you want ACLED-backed conflict ingestion

Blueprint notes:

- The web and cron services are pinned to `starter` plans and the database to `basic-256mb` so the app does not sleep like a demo. Change those if you want a cheaper test posture.
- Market and World Bank endpoints can still fetch live on demand even before the database is warm, but conflict, fire, and rainfall surfaces need the cron jobs and database to stay truly fresh.
- During bootstrap, country profile cache warming is best-effort; the app can still fetch those World Bank metrics on demand.
- `/api/status` now reports dataset freshness so operators can see when the system is on live snapshots, on-demand fetches, or fallback posture.

To deploy with the Blueprint flow, push the repo to GitHub, GitLab, or Bitbucket, then create the Render Blueprint from that repo.

If you want the database warm immediately after setup instead of waiting for the first cron cycle, run:

```bash
npm run bootstrap:production
```

That applies `db/schema.sql` to `DATABASE_URL` and then runs the full ingestion sequence once.

## Data Flow

1. Python scripts fetch external data and write normalized rows to Postgres.
2. Next.js API routes combine Postgres data, RSS/search feeds, and reference APIs into cached intelligence packages.
3. React components fetch those routes and render map overlays, charts, package panels, and live signal cards.

## Database Notes

- Core longitudinal tables: `events`, `market_data`, `fire_events`, `rainfall_data`, `population_movements` as a legacy movement cache
- Live snapshot tables: `air_quality_snapshots`, `macro_country_snapshots`
- `/api/markets` now persists live FX/BTC reference indicators plus ASEAN GDP snapshots when `DATABASE_URL` is configured
- `/api/air-quality` now persists live AQI/PM2.5 station observations and falls back to the latest stored snapshots before using static defaults
# V5.1.0 — Thailand Geopolitical Watch
