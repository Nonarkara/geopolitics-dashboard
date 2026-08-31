# Data Sources & Attribution

This project mixes **bundled static datasets**, **live API feeds**, and
**operator-edited data**. The MIT-licensed code in this repo carries
its own license; every third-party dataset and live source keeps its
own license and terms, summarized below.

If your use doesn't fit a dataset's license, **remove that dataset
or live source** — most are isolated to one GeoJSON file or one API
route and can be removed without breaking the rest of the app.

This file is a machine-readable credit registry mirrored in-app
through the layer toggles' `source` tooltip (see
`src/lib/tooltip-catalog.ts`).

---

## Bundled static datasets (committed under `ingestion/data/static/`)

| Dataset | Folder | License | Commercial use | Attribution |
|---|---|---|---|---|
| **Dams** (704 features worldwide) | `dams/` | **ODbL 1.0** (OpenStreetMap extract) | ✅ Yes (attribution + share-alike on the **derived database**; the MIT-licensed code in this repo is unaffected — same pattern Open Infrastructure Map ships) | "© OpenStreetMap contributors" — link `https://www.openstreetmap.org/copyright` |
| Reserved for future layers | `datacenters/`, `cables_osm/`, `natural_earth_regions/` | — | — | — |

### How bundled datasets are loaded

`ingestion/load_static_infrastructure.py` reads the GeoJSON file,
extracts `name` / `osm_id` / `properties`, and UPSERTs into the
`static_infrastructure` Postgres table keyed by `(kind, osm_id)`.
Idempotent — safe to re-run.

```bash
# 1. Apply the migration
npm run db:migrate

# 2. Load the bundle
.venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind dams
```

### TeleGeography submarine cables: **NOT bundled, by design**

The `gods-eye-view` repo ships TeleGeography submarine cable data
under **CC BY-NC-SA 3.0**. We do not import it. The
**NonCommercial** clause creates asymmetric lawsuit risk for
TKC PCL, which is a paying client. If we ever want cables for a
non-commercial demo, fetch `man_made=submarine_cable` from the
Overpass API (ODbL 1.0, commercial-clean) and ingest via the same
loader with `--kind cables_osm`.

---

## Live sources (per-route, see `src/app/api/`)

The full live-source audit lives in `context.md` ("Database — NOT
CONFIGURED" / "Localbase on this machine"). The relevant rules:

- **No cloud Postgres credential exists** in any environment.
  Production Worker has no DB; all DB-backed routes fail closed
  (`[]` + `X-Data-Source: unavailable`).
- **Local dev** uses Localbase (Supabase Postgres on Docker),
  reachable at `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
  `.env.local` carries this URL; `ingestion/` Python scripts
  load `.env` then `.env.local` (override).
- **Each route** must respect its own key semantics (e.g. ACLED and
  FIRMS remain zero in production because no key exists; this is
  honest degraded state, not a bug).

---

## In-app credit line

Layer-level credits are surfaced through the `DAM` / `THRM` / `AIR` /
`FLOW` / `ZONE` toggles' tooltip (`CommandTooltip`, bottom-positioned
on hover). The tooltip lists `source` and `sourceUrl` for the active
layer. No Google / Mapbox credit overlay exists in-app yet because
the active basemap is ESRI (free, no key required); if a Mapbox /
Google key is later wired in, the credit line should follow the
`#cesium-credits` pattern from `gods-eye-view` (always-visible
attribution bottom-left, including in clean-view / recording modes).
