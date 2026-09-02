![Geopolitics Dashboard — manga illustration of an analyst at a desk, books open, with a holographic world map behind. HUD frames in the drawing are artistic, not the live UI.](docs/hero-banner.png)

*Illustration for this repository. The HUD frames, radar, charts, and inset panels in the drawing are artistic — they are not screenshots of the running app.*

# Geopolitics Dashboard

**Thailand Geopolitical Watch** — a public-interest **global watch** for Thailand’s frontiers.

This GitHub repo is [`Nonarkara/geopolitics-dashboard`](https://github.com/Nonarkara/geopolitics-dashboard). The default product matches that name. An older README on `main` was titled “Phuket Dashboard” and described a tourism / Andaman starter; that copy does not match this tree. A Phuket UI still exists as an **opt-in** surface — see [How to run / fork](#how-to-run--fork).

This branch is **Vercel-first**: Vercel hosts the Next.js app, Supabase Postgres is the data backbone, and Vercel Cron drives grouped refresh routes under `/api/cron/*`. `render.yaml` is legacy scaffolding, not a second scheduler.

---

## What this is

A map-first operator dashboard for watching Thailand’s land borders in one place: satellite and raster overlays, OSINT and news, coded conflict events, thermal hotspots, movements, markets, a command brief, and Bangkok-day playback for archived review.

The executive chrome is labeled **Thailand Geopolitical Watch**. The map is theater-specific, not a generic globe. On this branch the theaters are:

| Frontier | Code |
| --- | --- |
| Myanmar | `myanmar-frontier` |
| Cambodia | `cambodia-frontier` |
| Malaysia | `malaysia-frontier` |
| Deep South (Patani) | `deep-south` |

Unsupported live-only panels stay labeled as `live reference` during playback instead of faking archival truth.

**Stack:** Next.js 16 App Router, React 19, TypeScript, Deck.gl + Mapbox GL (`mapbox-gl` / `react-map-gl`), Supabase Postgres, Playwright + Node test runner.

---

## Philosophy

This is a **civic watch**, not a war room.

The thesis is the same one in the illustration: a human still has to read. Upstream feeds are cheap; judgment is not. The dashboard’s job is to put **measured** signals, **modelled** scores, and **news** in the same field of view so an operator can corroborate — not so a model can declare truth.

- **Every pixel should carry information.** If a panel cannot name its source or its age, it should look empty, not confident.
- **The map is the spatial argument.** Start there. Use the ticker last.
- **Fallback is honest.** `/api/status` reports live vs hybrid vs fallback.
- **Playback must not invent history.** Empty Bangkok-day windows return `200` with `mode: "historical-empty"`.

---

## Ethical use

This software is **not official intelligence**. It is not a government product, not a classified system, and not a substitute for MFA, RTARF, DDPM, TMD, UNHCR, a newsroom, or a human source. Institutional logos in the chrome credit partners as they appear in the UI; they do not confer authority.

Treat every number as one of two kinds:

| | **Measured** (as received from an upstream) | **Modelled** (computed here, or modelled by a provider) |
| --- | --- | --- |
| **What** | Observations and coded datasets copied into this system | Scores, narratives, forecasts, and stand-ins this app (or a model) produces |
| **Examples** | NASA FIRMS detections; ACLED coded events; UNHCR counts; market ticks; news items; camera snapshots | Frontier posture scores; AI summaries; Open-Meteo forecast/reanalysis; fused packages; **mock / fallback rows** |
| **How to read** | Check the source, the time, and `/api/status` freshness | Read the formula or the model name. Do not quote a posture band as a field report |

Rules of use:

1. **Do not brief from a modelled panel alone.** Confirm against the measured feed and an official channel.
2. **Do not treat mock fallback as live.** Keep `ALLOW_MOCK_INGESTION=false` in any real environment.
3. **Do not enable the data explorer on a public host** unless you intend to expose stored tables.
4. **Do not invent history in playback.** Invalid windows are `400`; store failures are `503`; genuine empty archives are `200` + `historical-empty`.
5. **Keys are yours.** This repo must not ship secrets. Respect each provider’s terms.

If this dashboard disagrees with an official warning, follow the official warning.

---

## How it works

```
upstream APIs / RSS / tiles
        │
        ▼
ingest + /api/cron/*  ──►  Supabase Postgres
        │                      │
        └────────►  Next.js /api/*  (envelope: { success, data, error? })
                               │
                               ▼
                      React operator shell
```

`/api/status` (`no-store`) reports runtime posture, database connectivity, basemap readiness, per-dataset freshness, grouped cron freshness, and live vs hybrid vs fallback.

Playback routes accept canonical Bangkok-day windows via `from` and `to` together (`/api/border-command/brief`, `/api/border-command/narrative`, `/api/markets`, `/api/border/news`, `/api/border/ticker`, `/api/research/sparklines`).

---

## How to run / fork

### Two surfaces

`src/app/page.tsx` chooses the root UI from `NEXT_PUBLIC_DASHBOARD_TYPE`:

| Value | What you get |
| --- | --- |
| unset / anything other than `PHUKET` | Border / global-watch dashboard (**default**) |
| `PHUKET` | Phuket / Andaman operating-center UI |

The Phuket surface is real code. It is **not** the default and **not** the name of this public repo.

To fork: clone, point ingest and map center at your geography, and put **your** keys in `.env`. Do not copy anyone else’s secrets.

### Prerequisites

- Node.js 20+
- npm
- Supabase Postgres (or compatible PostgreSQL + PostGIS) for persisted feeds

### Environment

```bash
cp .env.example .env
```

Fill in **your** values. Do not commit secrets. Names used on this branch:

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Supabase / Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase HTTP path |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox public token |
| `CRON_SECRET` | Bearer required for `/api/cron/*` in production |
| `FIRMS_KEY` | Optional NASA FIRMS |
| `ACLED_USERNAME` / `ACLED_PASSWORD` | Optional myACLED OAuth |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | Optional cloud AI |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | Optional local model |
| `REFERENCE_DASHBOARD_URL` | Optional external JSON feed |
| `NEXT_PUBLIC_ENABLE_DATA_EXPLORER` / `DATA_EXPLORER_ENABLED` / `DATA_EXPLORER_TOKEN` | Browser DB explorer; keep off unless intended |
| `ALLOW_MOCK_INGESTION` | Keep `false` in real environments |
| `NEXT_PUBLIC_DASHBOARD_TYPE` | Set to `PHUKET` only for the Phuket UI |

### Local run

```bash
npm install
npm run db:schema
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Vercel Cron

Grouped job **routes** on this branch:

- `/api/cron/conflict-intel`
- `/api/cron/environment-thermal`
- `/api/cron/markets-macro`
- `/api/cron/movements-maritime`
- `/api/cron/daily-summary`
- `/api/cron/maintenance-cleanup`
- `/api/cron/data-ingestion`
- `/api/cron/daily-ops`

These routes require `Authorization: Bearer ${CRON_SECRET}` in production and record snapshots into `data_snapshots` / `feed_health`.

[`vercel.json`](vercel.json) currently schedules `data-ingestion` and `daily-ops` (daily, hobby-safe). Tighten cadence in that file if the Vercel project is on Pro. Do not run a second scheduler on Render in parallel unless you are rolling back.

### Checks

```bash
npm run test:backend
npm run build
npm run test:ui -- tests/border-dashboard.spec.ts
```

### Deploy

1. Push a feature branch
2. Open a PR
3. Verify the Vercel preview
4. Smoke-check `/`, `/api/status`, playback routes, and `/api/cron/*`
5. Merge to production

`render.yaml` is retained only as legacy reference.

---

## License

MIT. See [LICENSE](LICENSE).

© 2026 [Dr Non Arkaraprasertkul](https://github.com/Nonarkara). Data remains the property of each upstream. This dashboard does not speak for them.
