![Geopolitics Dashboard — manga illustration of an analyst at a desk, books open, with a holographic world map behind. HUD frames in the drawing are artistic, not the live UI.](docs/hero-banner.png)

*Illustration for this repository. The HUD frames, radar, charts, and inset panels in the drawing are artistic — they are not screenshots of the running app.*

# Geopolitics Dashboard

**Thailand Geopolitical Watch** — a public-interest **global watch** for Thailand’s Myanmar, Cambodia, and Malaysia frontiers.

This GitHub repo is [`Nonarkara/geopolitics-dashboard`](https://github.com/Nonarkara/geopolitics-dashboard). The default product matches that name. An older README on `main` was titled “Phuket Dashboard” and described a tourism / Andaman starter; that copy does not match this tree. A Phuket UI still exists as an **opt-in** surface — see [How to run / fork](#how-to-run--fork).

The app can render without a populated database (API routes fall back to static or on-demand sources). Conflict, fire, rainfall, and similar tables stay fresh only after PostgreSQL is configured and ingestion has run.

---

## What this is

A map-first operator dashboard for watching Thailand’s land borders in one place: satellite and raster overlays, OSINT and news, coded conflict events, thermal hotspots, movements, markets, and a command brief.

The executive chrome in the default UI is labeled **Thailand Geopolitical Watch**. The map is theater-specific, not a generic globe:

| Frontier | Code | What the dashboard is watching |
| --- | --- | --- |
| Myanmar | `myanmar-frontier` | Conflict spillover, humanitarian pressure, western-gate trade |
| Cambodia | `cambodia-frontier` | Crossing visibility, passenger/customs surges, eastern narrative |
| Malaysia | `malaysia-frontier` | Southern corridor flow, freight, and proxy visibility south of Hat Yai |

From the code, not from marketing copy:

- **Map** — Thailand-centered view; Deck.gl layers for incidents, heatmaps, NASA FIRMS hotspots, flights, vessels, AQI/PM2.5, and NASA GIBS / other raster overlays (`src/lib/map-overlays.ts`, `src/components/Map/BorderMap.tsx`).
- **OSINT / news** — GDELT, Google News, BBC, CNA, and related routes under `src/app/api/border/` and `src/app/api/news/`.
- **Conflict & humanitarian** — ACLED ingest (optional credentials), UNHCR population API, HDX-related market/profile warming.
- **Environment** — NASA FIRMS, Open-Meteo rainfall and air quality.
- **Economics** — FX, Binance spot ticker, World Bank WDI, IMF/DBnomics ingest.
- **Operator chrome** — regional clocks, signal ticker, YouTube news embeds (Thai outlets in the current channel list), time-window playback (`src/lib/time-window.ts`), optional AI summaries.

Optional AI uses **OpenAI** and/or local **Ollama** (`src/lib/ai-config.ts`). There is no Claude briefing client in this tree.

**Stack:** Next.js 16 App Router, React 19, TypeScript, Deck.gl 9 + Mapbox GL (`mapbox-gl` / `react-map-gl`) plus free raster bases (ESRI, OSM, Carto, NASA GIBS, EOX Sentinel-2), PostgreSQL / PostGIS (`pg`), optional Supabase HTTP client, Python ingestion under `ingestion/`.

There is no MapLibre or Cloudflare Workers / OpenNext config in this tree. Production-shaped deploy files here are Fly.io (`Dockerfile`, `fly.toml`) and Render (`render.yaml`).

---

## Philosophy

This is a **civic watch**, not a war room.

The thesis is the same one in the illustration: a human still has to read. Books, notes, and a map on one desk. Upstream feeds are cheap; judgment is not. The dashboard’s job is to put **measured** signals, **modelled** scores, and **news** in the same field of view so an operator can corroborate — not so a model can declare truth.

Design rules visible in the UI:

- **Every pixel should carry information.** Sharp corners, connected grid, no decorative chrome. If a panel cannot name its source or its age, it should look empty, not confident.
- **The map is the spatial argument.** Start there. Use the ticker last, as a pulse, not as the first source of truth (`src/lib/dashboard-manual.ts`).
- **Fallback is honest.** The screen still renders when a key or a database is missing. `/api/status` reports live vs hybrid vs fallback so you can see which.
- **Provenance over drama.** Source labels and timestamps travel with signals (`src/components/Common/ProvenanceBadge.tsx`). A fused brief is weaker than the weakest feed that built it.

Fork it, retarget the geography, turn layers off. The public value is a reviewable watch — not a proprietary oracle.

---

## Ethical use

This software is **not official intelligence**. It is not a government product, not a classified system, and not a substitute for MFA, RTARF, DDPM, TMD, UNHCR, a newsroom, or a human source. Institutional logos in the chrome credit partners as they appear in the UI; they do not confer authority.

Treat every number as one of two kinds:

| | **Measured** (as received from an upstream) | **Modelled** (computed here, or modelled by a provider) |
| --- | --- | --- |
| **What** | Observations and coded datasets copied into this system | Scores, narratives, forecasts, and stand-ins this app (or a model) produces |
| **Examples in this tree** | NASA FIRMS thermal detections; ACLED coded events; UNHCR registered counts; FX / Binance ticks; World Bank WDI series; news items and YouTube embeds; public camera snapshots | Frontier **posture scores** (`baseScore` plus weighted incidents, fatalities, OSINT, humanitarian, cameras — `src/lib/border-command.ts`); AI package summaries; Open-Meteo forecast/reanalysis fields; fused “intelligence packages”; **mock / fallback rows** when ingest fails |
| **How to read** | Check the source, the time, and whether `/api/status` says the table is fresh | Read the formula or the model name. Do not quote a posture band or an AI headline as if it were a field report |

Rules of use:

1. **Do not brief a minister, a newsdesk, or the public from a modelled panel alone.** Confirm against the measured feed and against an official channel.
2. **Do not treat mock fallback as live.** Keep `ALLOW_MOCK_INGESTION=false` in any real environment so failed jobs do not write demo rows into the database.
3. **Do not enable the data explorer on a public host** unless you intend to expose stored tables. `NEXT_PUBLIC_ENABLE_DATA_EXPLORER` and `DATA_EXPLORER_ENABLED` default off in the Render blueprint.
4. **Playback must not invent history.** Historical time-window routes in this family return empty-but-honest payloads when a Bangkok-day window has no archive — they should not 404, and they should not backfill fiction.
5. **ACLED, FIRMS, Mapbox, OpenAI, AIS, and similar keys are yours.** This repo ships names only. Do not commit secrets. Respect each provider’s terms; several feeds are licensed, rate-limited, or humanitarian.

If this dashboard disagrees with an official warning, follow the official warning.

---

## How it works

```
upstream APIs / RSS / tiles
        │
        ▼
Python ingest  ──►  PostgreSQL + PostGIS
        │                 │
        └──────►  Next.js /api/*  (envelope: { success, data, error? })
                          │
                          ▼
                 React operator shell
                 (map, ticker, brief, charts)
```

1. **Ingest.** Jobs under `ingestion/` fetch ACLED, markets, FIRMS, rainfall, air quality, UNHCR, GKG, vessels, IMF/DBnomics, and a daily summary, then write normalized rows when `DATABASE_URL` is set. Several jobs skip cleanly if optional keys are missing.
2. **Serve.** Next.js routes combine Postgres, RSS/search, and on-demand APIs. `/api/status` reports dataset freshness so you can see snapshots vs fallback.
3. **Render.** `src/app/page.tsx` mounts `BorderDashboard` unless `NEXT_PUBLIC_DASHBOARD_TYPE=PHUKET`. Panels fetch the enveloped routes independently; a failed panel should not take down the shell.

The command brief is a **derived** object: each frontier starts from a documented `baseScore`, then adds weighted contributions from matched incidents, fatalities, OSINT narratives, humanitarian counts, and cameras. That is a prioritisation heuristic, not a battlefield assessment.

---

## How to run / fork

### Two surfaces

`src/app/page.tsx` chooses the root UI from `NEXT_PUBLIC_DASHBOARD_TYPE`:

| Value | What you get | Entry |
| --- | --- | --- |
| unset / anything other than `PHUKET` | Border / global-watch dashboard (**default**) | `src/app/BorderDashboard.tsx` |
| `PHUKET` | Phuket / Andaman operating-center UI | `src/app/PhuketDashboard.tsx` |

The Phuket surface is real code (`src/components/Phuket/`), not a leftover filename. It is **not** the default and **not** the name of this public repo. Leave the flag unset for geopolitics / global watch.

To fork a different watch: clone, keep or drop the Phuket tree, point ingest and map center at your geography, and put **your** keys in `.env`. Do not copy anyone else’s secrets.

### Prerequisites

- Node.js 20+ (see `package.json` `engines`)
- npm
- PostgreSQL with PostGIS for persisted feeds
- Python 3.9+ only if you run ingestion

### Environment

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

### Setup

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

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default is the border / global-watch dashboard.

### Ingestion

```bash
python3 ingestion/run_all.py --list
python3 ingestion/run_all.py
# or
npm run ingest:all
```

Jobs currently wired in `ingestion/run_all.py`: `acled`, `markets`, `fires`, `rainfall`, `air-quality`, `refugees`, `gkg`, `vessels`, `imf-dbnomics`, `daily-summary`.

### Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Playwright specs live in `tests/` (`npm run test:ui`).

### Deploy

- **Fly.io:** `Dockerfile` (standalone Next.js) + `fly.toml` (`app = geopolitics-dashboard`, region `sin`). Typical hostname: `geopolitics-dashboard.fly.dev` — confirm in your Fly account; this README does not claim uptime.
- **Render:** `render.yaml` Blueprint (Node web service, managed Postgres, Python cron ingest). Set Mapbox / FIRMS / ACLED / OpenAI in the dashboard; explorer flags default off.

Warm a configured `DATABASE_URL` once:

```bash
npm run bootstrap:production
```

That applies `db/schema.sql` and runs the ingest sequence.

---

## License

MIT. See [LICENSE](LICENSE).

© 2026 [Dr Non Arkaraprasertkul](https://github.com/Nonarkara). Data remains the property of each upstream (ACLED, NASA, UNHCR, World Bank, newsrooms, and others). This dashboard does not speak for them.
