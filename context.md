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

## Database — NOT CONFIGURED (honest degraded state)

Production has no database. `/api/status` correctly reports
`"database": "not configured"`, and every DB-backed route now fails closed
(`[]` + `X-Data-Source: unavailable`) instead of serving mock data.

Facts discovered 2026-08-11:

- `DATABASE_URL` in `.env.local` and `shared/.secrets-backup/dashboards_geopolitics-dashboard_.env`
  is `postgresql://localhost:5432/geopolitics_db` — local dev only. **No cloud
  Postgres credential exists anywhere on disk.**
- The Supabase project referenced in `wrangler.jsonc`
  (`qbatksnulitgrhigzbta`) is alive, but it holds the **globalmonitor**
  schema (`gm_`-prefixed tables). The geopolitics schema (`events`,
  `market_data`, `rainfall_data`, …) does not exist there.
- `src/lib/db.ts` now accepts either an `env.HYPERDRIVE` binding or a
  `DATABASE_URL` Worker secret (`wrangler secret put DATABASE_URL`).

To connect a real database (in order):

1. Decide the target: a dedicated Supabase project for geopolitics, or a new
   schema in an existing project. (Needs Dr Non's call — cost/ownership.)
2. Apply schema: `npm run db:schema` then `npm run db:migrate` against it.
3. Either `wrangler hyperdrive create geopolitics-db --connection-string=...`
   plus a `hyperdrive` binding in `wrangler.jsonc`, **or** simply
   `wrangler secret put DATABASE_URL` (supported since 2026-08-11).
4. Populate via `npm run ingest:all` and the `/api/cron/*` refresh endpoints
   (GitHub Actions `cron-refresh.yml` already curls them on schedule).

## Data honesty invariant

No production route or panel may serve `src/lib/mock-data.ts` content. Mock
data is legitimate ONLY in the static GitHub Pages demo
(`NEXT_PUBLIC_STATIC_EXPORT=true`). Enforced by
`tests/fail-closed-routes.test.mts` and the fails-closed tests in
`tests/playback-backend.test.mts`.

## Tests

- `npm run test:backend` — node:test unit suite (14 tests).
- `npx playwright test tests/border-dashboard.spec.ts tests/phuket-dashboard.spec.ts`
  — browser suites (4 + 5). Note: a bare `npx playwright test` also collects the
  `.test.mts` node:test files and crashes on them; run the spec files explicitly.
