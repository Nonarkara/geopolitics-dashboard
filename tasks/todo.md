# Honest-envelope repair — 2026-09-10

Three defects found via `/how`, plus one found while reading. All §16.1 Law 3.

## Diagnosis

One shared cause: **the client infers freshness from when it fetched, not from what
the server said.** Each defect is a different face of it.

## Plan

- [x] 1. `X-Data-Source` reaches the UI
      `useFetch` reads the header and exposes `dataSource`. `Metric` renders `--` +
      "no live data" instead of a confident `0` when the server declares
      `unavailable`. Concrete lie killed: `FIRMS 0 hotspots` when `/api/fires`
      just said it has nothing.
      Header stays produced + tested (it is the honesty invariant's enforcement);
      the gap was consumption only.

- [x] 2. `useLiveResource.__meta` branch deleted
      No route emits `__meta`; no consumer reads `lastUpdated`. Drop the dead
      branch, rename `lastUpdated` -> `fetchedAt` so the hook stops claiming
      upstream data age it cannot know.

- [x] 3. Poll interval declared once
      `useFetch(url, N)` + `FeedDot expectedIntervalMs={N}` + catalog
      `refreshInterval: "N min"` + `Sidebar useFetch(url, N)` = four copies of one
      number per feed. Catalog gains `refreshIntervalMs`; the label is derived
      from it; all call sites read the catalog.
      `FreshnessDot` keeps its own thresholds -- it measures payload age, which is
      a genuinely different quantity from `runtime-status.ts`'s dataset age. Fix is
      to name the quantity, not to fake a unification.

- [x] 4. `/api/border/sentiment` fails closed
      Stop serving `Math.sin`/`Math.random` synthetic tone in production. Empty
      timeline + `X-Data-Source: unavailable`, matching its 15 sibling routes.
      The chart's existing `timeline.length < 3` guard already renders
      "Awaiting sentiment data" -- no component change needed.

- [x] 5. Tests: sentiment fail-closed; catalog label/ms conservation
- [x] 6. `tsc --noEmit` + `npm run lint` + `npm run test:backend`
- [ ] 7. CDPT

## Review

Shipped:
- `useFetch` reads `X-Data-Source` AND `X-Data-Age`. Both were produced by ~15
  routes and dropped by the client. `X-Data-Age` was not in the original report.
- `Metric` renders `--` + "no live data" (`var(--dim)`) when its route declared
  `unavailable`. Verified in a browser by making `/api/fires` answer the way it
  does with no FIRMS key: `FIRMS 72 hotspots` -> `FIRMS -- no live data`.
  Before this change that state printed `FIRMS 0 hotspots`.
- `FeedDot` goes amber, never green, on a declared `unavailable`, and its
  tooltip reports the server's own payload-build stamp.
- `useLiveResource`: dead `__meta` branch removed; `lastUpdated` -> `fetchedAt`.
  No consumer read `lastUpdated`, so no call sites changed.
- `DATA_SOURCE_CATALOG`: `refreshInterval` split into `upstreamCadence`
  (provider rhythm) and `clientPollMs` (this dashboard's poll). One field was
  carrying two facts, which is why the catalog advertised "6 hr" for FIRMS
  while the client polled every 15 min. Poll cadence is now declared once and
  read by `useFetch`, `FeedDot`, and the tooltip.
- `/api/border/sentiment` fails closed instead of serving synthetic tone.
- `FreshnessDot` titles name the quantity they measure.

Tests: 17 -> 22 passing. `tsc --noEmit` clean. Lint problem count unchanged at
23 (all pre-existing).

Corrections to the original report:
1. `X-Data-Source` was NOT unconsumed — `tests/fail-closed-routes.test.mts`
   asserts it 4x and it is the documented enforcement of the honesty invariant.
   Deleting it was never the right option; the gap was client consumption.
2. `useLiveResource` has two consumers, not one. `LiveIntelligenceFeed` renders
   its `isStale` as a user-visible STALE badge.
3. The `refreshInterval` drift was live, not hypothetical.

Not done, deliberately:
- Did not retrofit `X-Data-Source` onto the 5 routes that lack it
  (traffic, earthquakes, flood-risk, disasters, commodities). Consumption was
  the defect; adding producers is separate work with its own per-route
  judgment about what "live" means for each upstream.
- Did not unify `FreshnessDot`'s thresholds with `runtime-status.ts`'s
  `staleAfterMinutes`. They measure different things (payload age vs. newest
  row in a table); a response built one second ago can be built from rows three
  days old. Forcing one number would have invented an invariant that is not
  true. Named both quantities instead.
