# Geopolitics Dashboard

Map-first **Thailand border intelligence** dashboard. The default UI is labeled **Thailand Geopolitical Watch** and focuses on the Myanmar, Cambodia, and Malaysia frontiers: satellite and raster overlays, OSINT/news, coded conflict events, fires, movements, markets, and a command brief.

This GitHub repo is [`Nonarkara/geopolitics-dashboard`](https://github.com/Nonarkara/geopolitics-dashboard). The previous README was titled “Phuket Dashboard” and described a tourism/Andaman starter cloned from this system. That copy does not match this tree’s default product. See [Two surfaces](#two-surfaces) for the Phuket UI that still exists as an opt-in.

The app can render without a populated database (API routes fall back to static or on-demand sources). Live conflict, fire, rainfall, and similar tables stay fresh only after PostgreSQL is configured and ingestion has run.

## Two surfaces

`src/app/page.tsx` chooses the root UI from `NEXT_PUBLIC_DASHBOARD_TYPE`:

| Value | What you get | Entry |
| --- | --- | --- |
| unset / anything other than `PHUKET` | Border command dashboard (this repo’s default) | `src/app/BorderDashboard.tsx` |
| `PHUKET` | Phuket / Andaman operating-center UI | `src/app/PhuketDashboard.tsx` |

The Phuket surface is real code (`src/components/Phuket/`), not a leftover filename. It is **not** the default. This public repo does not need renaming: the default product matches the name `geopolitics-dashboard`. If you only want Phuket, set the flag; if you only want geopolitics, leave it unset and ignore the Phuket tree.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Deck.gl 9 + Mapbox GL (`mapbox-gl` / `react-map-gl`) plus free raster bases (ESRI, OSM, Carto, NASA GIBS, EOX Sentinel-2)
- PostgreSQL / PostGIS (`pg`), optional Supabase HTTP client
- Python ingestion scripts under `ingestion/`

There is no MapLibre or Cloudflare Workers/OpenNext config in this tree. Production-shaped deploy files here are Fly.io (`Dockerfile`, `fly.toml`) and Render (`render.yaml`).

## What the default dashboard covers

From the code, not from marketing copy:

- **Map:** Thailand-centered view clamped to the regional bounding box; Deck.gl layers for incidents, heatmaps, NASA FIRMS hotspots, flights, vessels, AQI/PM2.5, and NASA GIBS / other raster overlays (`src/lib/map-overlays.ts`, `src/components/Map/BorderMap.tsx`).
- **Frontiers:** Myanmar, Cambodia, Malaysia command areas (`src/lib/border-regions.ts`).
- **OSINT / news:** GDELT, Google News, BBC, CNA, and related routes under `src/app/api/border/` and `src/app/api/news/`.
- **Conflict & humanitarian:** ACLED ingest (optional credentials), UNHCR population API, HDX-related market/profile warming.
- **Environment:** NASA FIRMS, Open-Meteo rainfall and air quality.
- **Economics:** FX, Binance spot ticker, World Bank WDI, IMF/DBnomics ingest.
- **Operator chrome:** ASEAN/world clocks, signal ticker, live YouTube news embeds (Thai outlets in the current channel list), time-window playback (`src/lib/time-window.ts`), optional AI summaries.

Optional AI uses **OpenAI** and/or local **Ollama** (`src/lib/ai-config.ts`). There is no Claude briefing client in this tree.

## Prerequisites

- Node.js 20+ (see `package.json` `engines`)
- npm
- PostgreSQL with PostGIS for persisted feeds
- Python 3.9+ only if you run ingestion

## Environment

```bash
cp .env.example .env
```

`.env.example` lists variable **names** only. Put your own values in `.env` (gitignored). Do not commit secrets.

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | PostgreSQL + PostGIS connection string |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox public token for Mapbox styles (`MAPBOX_ACCESS_TOKEN` is accepted as an alias). The map also has non-Mapbox raster bases. |
| `NEXT_PUBLIC_DASHBOARD_TYPE` | Set to `PHUKET` to boot the Phuket UI; omit for geopolitics |
| `FIRMS_KEY` | NASA FIRMS key; ingest skips if unset |
| `ACLED_USERNAME` / `ACLED_PASSWORD` | myACLED OAuth for conflict ingest; job skips if unset |
| `ACLED_EMAIL` / `ACLED_KEY` | Legacy ACLED names; OAuth password login is preferred |
| `AISSTREAM_API_KEY` | Optional AIS vessel ingest |
| `OPENAI_API_KEY` | Optional cloud AI summaries |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | Optional local model (defaults exist in code) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Optional Supabase HTTP path |
| `REFERENCE_DASHBOARD_URL` | Optional external dashboard JSON feed |
| `NEXT_PUBLIC_ENABLE_DATA_EXPLORER` / `DATA_EXPLORER_ENABLED` / `DATA_EXPLORER_TOKEN` | Browser DB explorer; keep off unless you intend to expose it |
| `ALLOW_MOCK_INGESTION` | Keep `false` in real environments so failed jobs do not write demo rows |

## Setup

```bash
npm install
```

Initialize the schema (creates `geopolitics_db` by default):

```bash
./scripts/setup-db.sh
```

If `psql` is not local, run `db/schema.sql` against your PostGIS instance, or `npm run db:schema` when `DATABASE_URL` is set.

Ingestion venv (optional):

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r ingestion/requirements.txt
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default is the border dashboard.

## Ingestion

```bash
python3 ingestion/run_all.py --list
python3 ingestion/run_all.py
# or
npm run ingest:all
```

Jobs currently wired in `ingestion/run_all.py`: `acled`, `markets`, `fires`, `rainfall`, `air-quality`, `refugees`, `gkg`, `vessels`, `imf-dbnomics`, `daily-summary`. Several skip cleanly when optional keys are missing.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Playwright specs live in `tests/` (`npm run test:ui`).

## Deploy

- **Fly.io:** `Dockerfile` (standalone Next.js) + `fly.toml` (`app = geopolitics-dashboard`, region `sin`). Typical hostname: `geopolitics-dashboard.fly.dev` — confirm in your Fly account; this README does not claim uptime.
- **Render:** `render.yaml` Blueprint (Node web service, managed Postgres, Python cron ingest). Set Mapbox / FIRMS / ACLED / OpenAI in the dashboard; explorer flags default off.

Warm a configured `DATABASE_URL` once:

```bash
npm run bootstrap:production
```

That applies `db/schema.sql` and runs the ingest sequence.

## Data flow

1. Python jobs write normalized rows to Postgres (when `DATABASE_URL` is set).
2. Next.js `/api/*` routes combine Postgres, RSS/search, and on-demand APIs. Responses are enveloped as `{ success, data, error? }` on the routes that follow that contract.
3. React panels fetch those routes for the map, ticker, briefs, and charts.

`/api/status` reports dataset freshness so you can see live snapshots vs fallback.

## License

MIT. See [LICENSE](LICENSE).
