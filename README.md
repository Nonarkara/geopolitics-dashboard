# Thailand Geopolitical Watch

> **Deployment (read first):** the live site is the `overhaul` branch, deployed to Cloudflare **Workers** via OpenNext — `npm run build:worker && npm run deploy` (config: `wrangler.jsonc` + `open-next.config.ts` on `overhaul`). Cloudflare Pages (`wrangler.toml`) and Vercel (`vercel.json`) are retired and their configs were removed — do not re-add them. Maps render on free tiles via MapLibre; there is no Mapbox dependency anywhere (account deleted 2026-07).

Tri-border command dashboard for Thailand's Myanmar, Cambodia, and southern frontier theatres. The product combines an operations-first map, live command surfaces, and Bangkok-day playback for archived intelligence review.

- `Supabase Postgres` is the single production data backbone (via Cloudflare Hyperdrive)
- Scheduled refreshes run from GitHub Actions (Cloudflare Workers has no native cron for Next.js routes)

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Deck.gl + react-map-gl
- Supabase Postgres
- Supabase Realtime / PostgREST where justified
- Playwright + Node test runner

## Product Shape

- `THAILAND GEOPOLITICAL WATCH` is the executive shell
- The map is intentionally theater-specific, not generic:
  - Myanmar frontier
  - Cambodia frontier
  - southern theatre
- Historical playback is canonicalized on Bangkok command days and propagated through the core command surfaces
- Unsupported live-only panels stay labeled as `live reference` during playback instead of faking archival truth

## Environment

Create a local `.env` from the example:

```bash
cp .env.example .env
```

Core variables:

- `DATABASE_URL`: Supabase Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `CRON_SECRET`: bearer secret required for Vercel cron routes in production

Optional upstreams and enrichers:

- `FIRMS_KEY`
- `ACLED_USERNAME`
- `ACLED_PASSWORD`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `OLLAMA_HOST`
- `OLLAMA_MODEL`
- `REFERENCE_DASHBOARD_URL`

Admin / diagnostics:

- `NEXT_PUBLIC_ENABLE_DATA_EXPLORER`
- `DATA_EXPLORER_ENABLED`
- `DATA_EXPLORER_TOKEN`
- `ALLOW_MOCK_INGESTION=false` in any real environment

## Local Run

Install dependencies:

```bash
npm install
```

Apply schema and migrations:

```bash
npm run db:schema
npm run db:migrate
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel Cron

The production scheduler is the grouped Vercel-cron layer defined in [vercel.json](/Users/non/Projects/dashboards/geopolitics-dashboard/vercel.json).

Current grouped jobs:

- `/api/cron/conflict-intel`
- `/api/cron/environment-thermal`
- `/api/cron/markets-macro`
- `/api/cron/movements-maritime`
- `/api/cron/daily-summary`
- `/api/cron/maintenance-cleanup`

These routes:

- require `Authorization: Bearer ${CRON_SECRET}` in production
- record run snapshots into `data_snapshots`
- record health into `feed_health`
- expose one operational response contract:
  - `startedAt`
  - `completedAt`
  - `ok`
  - `updatedSources`
  - `updatedTables`
  - `warnings`
  - `errors`

The schedules in `vercel.json` are intentionally `daily` and hobby-safe by default. If the linked Vercel project is on Pro, tighten the cadence there by editing the same cron entries rather than reintroducing a second scheduler system.

## Status and Runtime Truth

`/api/status` reports:

- app runtime posture
- database connectivity
- basemap readiness
- per-dataset freshness
- grouped cron freshness
- live vs hybrid vs fallback posture

This route is `no-store` and intended for operator diagnostics, architecture review, and deployment smoke tests.

## Database Backbone

Production data lives in Supabase Postgres. Core tables include:

- `events`
- `fire_events`
- `rainfall_data`
- `market_data`
- `macro_country_snapshots`
- `air_quality_snapshots`
- `country_economic_indicators`
- `intelligence_package_snapshots`
- `signal_archive`
- `feed_health`
- `data_snapshots`
- `vessel_positions`

This is the system of record for both live operational state and historical playback.

## Playback

Playback routes accept canonical Bangkok-day windows via `from` and `to`:

- `/api/border-command/brief`
- `/api/border-command/narrative`
- `/api/markets`
- `/api/border/news`
- `/api/border/ticker`
- `/api/research/sparklines`

Rules:

- `from` and `to` must be present together
- they must match one exact Bangkok command day window
- invalid playback params return `400`
- archive/store failures return `503`
- genuine no-data playback returns `200` with `mode: "historical-empty"`

## Quality Checks

Backend and build verification:

```bash
npm run test:backend
npm run build
```

Browser verification:

```bash
npm run test:ui -- tests/border-dashboard.spec.ts
```

Targeted lint:

```bash
npx eslint src/app/api/cron src/lib/cron-jobs.ts src/lib/runtime-status.ts
```

## Deployment

Recommended release path:

1. Push a feature branch
2. Open a PR
3. Verify the Vercel preview deployment
4. Smoke-check `/`, `/api/status`, playback routes, and `/api/cron/*`
5. Merge to production

## Legacy Render Note

`render.yaml` is retained only as legacy reference / migration scaffolding. It is not the primary production path anymore. Do not maintain parallel scheduler logic on Render and Vercel unless you are explicitly performing a migration rollback.
