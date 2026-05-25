## 2026-05-20 · Fly.io deploy requires standalone output mode
- **What went wrong:** `flyctl deploy` failed because the Dockerfile copies `.next/standalone/` but `next.config.mjs` doesn't set `output: "standalone"`. The cached build layers had no standalone output.
- **Correct behaviour:** When deploying to Fly.io with a multi-stage Dockerfile, `next.config.mjs` must include `output: "standalone"`. Alternatively, adjust the Dockerfile to copy the full `.next` directory.
- **How to recognise:** Any Dockerfile with `COPY --from=builder /app/.next/standalone` requires the Next.js config to produce standalone output.

## 2026-05-20 · Coordinate order in border-regions.ts
- **What went wrong:** Cambodia and Malaysia centers were stored as `[lat, lon]` instead of `[lon, lat]` (GeoJSON convention). Fly-to shortcuts flew to the wrong location.
- **Correct behaviour:** The `Coordinates` type in this codebase is `[longitude, latitude]`. Always longitude first.
- **How to recognise:** Any time writing coordinate arrays, check whether the type or context expects GeoJSON order (lon, lat) or Google Maps order (lat, lon).

## 2026-05-26 · npm audit fix blocked by deck.gl peer dependency lock

- **What went wrong:** `npm audit fix` fails with ERESOLVE — `@luma.gl/core@9.2.6` in project conflicts with peer requirement `@luma.gl/core@~9.3.3` from `@deck.gl/extensions@9.3.2`.
- **Correct behaviour:** Do NOT run `npm audit fix --force` here — it would break deck.gl. The 14 vulnerabilities (4 high) are all transitive and locked by the deck.gl version pin. Only fix by upgrading the entire deck.gl stack to 9.3.x, which is a separate planned upgrade task. Security risk is acceptable in the meantime.
- **How to recognise:** `npm audit fix` fails with peer dependency ERESOLVE in this project = expected, not a bug.
