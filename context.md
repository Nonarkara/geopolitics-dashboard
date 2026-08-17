# Geopolitics Dashboard — Live Context

Updated 2026-08-11.

## Deployment

- Worker: `geopolitics-dashboard` on account `74ad6bf8dfaaccf82de6f0847f7d2d54` (nonsmartcity@gmail.com).
- Live URL: https://geopolitics-dashboard.drnon.workers.dev/ (HTTP 200).
- Deploy branch: `overhaul`. Deploy is manual: `npm run deploy` (build:worker + wrangler deploy). No CI deploy pipeline.
- GitHub Pages (`github-pages.yml`) builds the **static mock demo** from `main` — unrelated to the Worker.

## Custom domain — FIXED 2026-08-11

`geo.nonarkara.org` now serves the Worker directly (HTTP 200, no redirect).
The prior 302 to workers.dev was a stale CNAME (`geo → geopolitics-dashboard.pages.dev`,
an old Cloudflare Pages project) left in the `nonarkara.org` zone; deleted via
the Cloudflare dashboard, then `wrangler.jsonc` got both
`"workers_dev": true` and the `geo.nonarkara.org` custom-domain route, and
`wrangler deploy` attached it. Both hostnames are live:
https://geo.nonarkara.org and https://geopolitics-dashboard.drnon.workers.dev.

## Database — Localbase on this machine (2026-08-13)

Production Worker still has no cloud Postgres. Local work now uses **Localbase**,
the existing Docker Postgres on this Mac — not a second database.

```
Postgres:  postgresql://postgres:postgres@127.0.0.1:54322/postgres
API:       http://127.0.0.1:54321
Studio:    http://127.0.0.1:54323
```

Boot after reboot:

```bash
colima start
cd /Users/nonarkara/Projects/_infra/localbase && supabase start
```

Then from this repo: `npm run db:schema` and `npm run db:migrate`
(both now read `.env.local`). Core tables are on Localbase: `events`,
`market_data`, `fire_events`, `air_quality_snapshots`, plus the existing
geowatch `signal_archive` / `data_snapshots`. Migrations 003–005 applied.
001 and 002 stay pending (`CREATE POLICY IF NOT EXISTS` is invalid on this
Postgres).

`.env.local` points `DATABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` at Localbase.
Ingestion (`python3 ingestion/run_all.py`) reads `.env` then `.env.local`.

Local yield (2026-08-13, after SSDIY ingest):

| table | rows |
|---|---|
| signal_archive | 2076 |
| signal_daily_summary | 183 (2019-06-16 → 2026-04-05) |
| country_economic_indicators | 50 |
| macro_country_snapshots | 10 |
| air_quality_snapshots | 12 |
| rainfall_data | 9 |
| market_data | 4 |
| events / fire_events | 0 (no ACLED / FIRMS keys) |

Rebuild summaries: `.venv-ingestion/bin/python ingestion/build_daily_summary.py --all`
World Bank cash-balance series `GC.BAL.CASH.GD.ZS` is archived; profiles skip unknown indicators.

Do not put that localhost URL in Worker secrets or `wrangler.jsonc` — the
OpenNext scrub step blanks bundled `DATABASE_URL`, and Hyperdrive is the
only path that can reach a database from Cloudflare.

To attach the live Worker later: expose Localbase via `db.nonarkara.org`
(see `_infra/localbase/context.md`) or put a real cloud connection string
in `wrangler secret put DATABASE_URL`. Until then production DB routes
stay fail-closed.

## Data honesty invariant

No production route or panel may serve `src/lib/mock-data.ts` content. Mock
data is legitimate ONLY in the static GitHub Pages demo
(`NEXT_PUBLIC_STATIC_EXPORT=true`). Enforced by
`tests/fail-closed-routes.test.mts` and the fails-closed tests in
`tests/playback-backend.test.mts`.

`/api/air-quality` fails closed (`[]` + `X-Data-Source: unavailable`).
`/api/border/insights` waits for Open-Meteo/World Bank, then caches 15 minutes
in-process and `s-maxage=900` at the edge. Do not wrap those upstreams in a
short `AbortSignal.timeout` or `settleWithin` budget — cold GloFAS from
Workers often exceeds 12s.

Desktop ROW 3 is Insight Lab + news only. Markets and cameras stay in the
Intel drawer.

## Tests

- `npm run test:backend` — node:test unit suite (16 tests).
- `npx playwright test tests/border-dashboard.spec.ts tests/phuket-dashboard.spec.ts`
  — browser suites (4 + 5). Note: a bare `npx playwright test` also collects the
  `.test.mts` node:test files and crashes on them; run the spec files explicitly.
