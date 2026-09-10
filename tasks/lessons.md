# Lessons

Corrections log (CLAUDE.md §13 Rule 10). Read at session start.

## 2026-09-10 · "Produced but never read" needs a consumer census before you delete it

- **What went wrong:** A defect report said `X-Data-Source` was set by ~15 routes
  and never read, so "wire it into the UI or delete it." Deleting it would have
  removed the enforcement of the project's own data honesty invariant — the
  consumer is `tests/fail-closed-routes.test.mts` (4 assertions), plus
  `docs/DATA_SOURCES.md` and `context.md`.
- **Correct behaviour:** Before calling a signal dead, grep for it across tests,
  docs, and CI config — not just `src/components`. A test suite is a legitimate
  consumer; a contract asserted in CI is load-bearing even when no pixel reads it.
  The same census found `X-Data-Age` on 5 routes, which the report had missed.
- **How to recognise:** Any finding phrased as "set but never read" or "dead
  code". Run the census in `tests/`, `docs/`, `.github/`, and config before the
  delete option is even on the table (CLAUDE.md §11.1 prohibition 5).

## 2026-09-10 · One field name carrying two facts is how drift starts

- **What went wrong:** `DATA_SOURCE_CATALOG.refreshInterval` meant "how often the
  provider publishes" in some entries and "how often we poll" in others. Result:
  the UI told users FIRMS "refreshes every 6 hr" while polling it every 15 min,
  and the same number was hand-copied into four places.
- **Correct behaviour:** When two facts share a field, split the field before
  fixing any individual value. Declare the machine-readable one once
  (`clientPollMs`) and derive every label from it; keep the human one separate
  (`upstreamCadence`).
- **How to recognise:** The same literal appearing in a `useFetch` interval, a
  component prop, and a display string. Also: a field whose values are a mix of
  units and vocabularies ("2 min", "Annual", "Continuous").

## 2026-09-10 · Two clocks measuring different things is not a bug to unify

- **What went wrong:** Nearly forced `FreshnessDot`'s thresholds to match
  `runtime-status.ts`'s per-dataset `staleAfterMinutes` because a green dot could
  coexist with a `stale` dataset in `/api/status`.
- **Correct behaviour:** They measure different quantities — payload build time
  vs. newest row in a Postgres table. A response built one second ago can be
  built entirely from three-day-old rows, so both readings are true at once.
  Unifying them would have invented an invariant that does not hold. Name both
  quantities in the labels instead.
- **How to recognise:** Two "staleness" numbers that never agree. Ask what each
  one is the age OF before assuming one is wrong.
