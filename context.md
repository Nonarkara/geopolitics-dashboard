# Geopolitics Dashboard — Live Context

Updated 2026-10-25.

## Multi-agent reconciliation and typography

See `docs/RECONCILIATION-2026-10-25.md` for all six PRs, branch/stash dispositions,
preserved candidates and outstanding audit work. The parked stash is untouched.
Main's missing keyless basemap repair is incorporated without restoring obsolete
deployment docs. Design Read: geographic instrument first, readable evidence desk
second; Braun ET66 control restraint / Reuters attribution hierarchy. Jost now
supplies body and display roles; JetBrains Mono remains numeric. This intentional
two-family change follows the owner's request and Palette's contextual type rules.

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
`/api/border/sentiment` fails closed the same way (2026-09-10). Its
`generateFallbackTimeline` is `Math.sin`/`Math.random` output and now renders
only under `NEXT_PUBLIC_STATIC_EXPORT=true`; in production it previously drew a
fabricated tone curve that was pixel-identical to real GDELT tone.

The client now reads the honesty headers instead of dropping them:
`useFetch` exposes `dataSource` (`X-Data-Source`) and `dataAge` (`X-Data-Age`),
and a `Metric` whose route declared `unavailable` renders `--` + "no live data"
rather than a confident `0`. Client poll cadence is declared once per feed as
`clientPollMs` in `DATA_SOURCE_CATALOG` — `upstreamCadence` is the provider's
own publishing rhythm and is a different fact (FIRMS: 6 hr upstream, 15 min
poll). Payload age (`FreshnessDot`) and dataset age (`/api/status`,
`runtime-status.ts`) remain deliberately separate quantities.
`/api/border/insights` waits for Open-Meteo/World Bank, then caches 15 minutes
in-process and `s-maxage=900` at the edge. Do not wrap those upstreams in a
short `AbortSignal.timeout` or `settleWithin` budget — cold GloFAS from
Workers often exceeds 12s.

Desktop ROW 3 is Insight Lab + news only. Markets and cameras stay in the
Intel drawer.

## Research geometry — 2026-10-21

Design read: read the evidence first; controls occupy the space needed to choose
the next report. Reference: the contents and article hierarchy of a Reuters
news terminal. The report title dominates each result, while filters stay in one
group above results. A 2px view boundary separates navigation from the 1px report
separators. The dialog follows content height up to the viewport cap.

The 21 October release retained the three-family stack. The owner-requested
25 October update supersedes that exception with Jost + JetBrains Mono.

`node scripts/research-layout-gate.mjs` checks rendered geometry and hit targets
across intermediate widths using controlled short evidence, with captures at
1440/1024/390. It mutates the dialog back to 94dvh and requires rejection. Set
`LAYOUT_URL` to exercise the same layout against a production preview or live URL.

## Existing regression suites

- `npm run test:backend` — node:test unit suite (31 tests).
- `npx playwright test tests/border-dashboard.spec.ts tests/phuket-dashboard.spec.ts`
  — browser suites (4 + 5). Playwright now collects only `.spec.ts` files;
  backend `.test.mts` files stay in the Node runner.
- `npm run test:map-layout` — real rendered first-screen geometry, final selector
  hit target and unbounded-selector mutation; actual-source screenshots require review.

## Security runtime update — 2026-10-25

Next 16.4.3 + OpenNext 1.20.13 replaces the former compatibility pin. The adapter
now includes `preview-props.json`; packaged Worker dynamic status and cron-auth
routes must pass before deploy. `follow-redirects` is patched to 1.16.1.
Production npm audit: zero reported vulnerabilities. Full development-tool audit
still reports seven findings (five high/two moderate); do not force its suggested
adapter/CLI downgrades, which would undo the verified runtime repair.
