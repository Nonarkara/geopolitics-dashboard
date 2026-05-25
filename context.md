# Geopolitics Dashboard — ASEAN Command Center

## Live URLs
- https://geo.nonarkara.org → Cloudflare Pages  ⚠️ BUILD FAILING
- Backup: https://geopolitics-dashboard.pages.dev
- Render fallback: https://dr-non-operating-systems.onrender.com (suspended)
- Fly.io: Singapore region (app: `geopolitics-dashboard`)

## Repo
GitHub: Nonarkara/geopolitics-dashboard (exact name TBC — check gh repo list)

## Stack
Next.js 16.2.1 + React 19.2.3 + TypeScript
Deck.gl 9.2.11 + Mapbox GL JS 3.19.1 + react-map-gl 8.1.0
Supabase (Thailand Geopolitical Watch, project: qbatksnulitgrhigzbta, Singapore)
PostgreSQL (direct) + Redis
Python ingestion (10 cron jobs)
Tailwind CSS v4
**Node.js 20.x required** (`engines.node: "20.x"`)

## Dev
```bash
npm run dev          # localhost:3000, webpack mode
npm run build        # Production build
tsc --noEmit         # Type-check before every build
```

## Deploy — Cloudflare Pages (primary — currently broken)
```bash
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name geopolitics-dashboard

# Or trigger CI:
gh workflow run "Deploy to Cloudflare Pages" -R Nonarkara/geopolitics-dashboard
```
⚠️ Build failing — investigate with `tsc --noEmit` + `npm run build` locally first.
Check for OpenNext adapter mismatch (wrangler.toml points to `.vercel/output/static`).

## Deploy — Render (web service + 10 cron jobs)
render.yaml defines full stack. Cron jobs on free tier (suspend/unsuspend as needed):
acled (6h), firms (3h), rainfall (6h), air-quality (6h), market (daily),
refugee (daily), gkg (15min), vessel (10min), imf-dbnomics (weekly), daily-summary (3am).

## Deploy — Fly.io (live Node server, Singapore)
```bash
fly deploy           # 512MB, auto-scale to 0, region: sin
```

## Database
```bash
npm run db:schema         # Apply schema
npm run db:migrate        # Apply migrations
npm run db:migrate:status # Check migration state
npm run db:summary        # Build daily intelligence summary
```

## Ingestion
```bash
npm run ingest:all   # Run all Python ingestion scripts
npm run ingest:list  # List available jobs
```

## Env Vars
File: `shared/.secrets-backup/dashboards_geopolitics-dashboard_.env`
- `DATABASE_URL` — PostgreSQL+PostGIS
- `REDIS_URL` — Redis caching
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never expose to client)
- `ACLED_USERNAME` + `ACLED_PASSWORD` — ACLED OAuth
- `FIRMS_KEY` — NASA FIRMS
- `OPENAI_API_KEY` + `OPENAI_MODEL`
- `DATA_EXPLORER_TOKEN` — if data explorer enabled

## Design System (globals.css — do not change)
- Base: 1920×1080, CSS transform scale to any screen
- Palette: `--bg: #f2f2f0`, `--accent: #ff3b30` (alert red), `--hazard: #ff9500`, `--tech: #007aff`
- Fonts: Inter (UI), IBM Plex Mono (data)
- Zero border-radius everywhere. Connected grid (1.5px on --line bg).
- Dual-dashboard: BorderDashboard (ASEAN) + PhuketDashboard — switch via
  `NEXT_PUBLIC_DASHBOARD_TYPE=PHUKET`

## Notes
- vercel.json present but Vercel was deleted 2026-05-08. Ignore it.
- Dependency overrides: fast-xml-parser@5.5.9, flatted@3.4.2 (security pins).
- Dockerfile present — can also run as Docker container (node:22-alpine, port 3000).
