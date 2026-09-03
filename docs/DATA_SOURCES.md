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

### Keyless live sources (live on the Worker without any operator action)

| Source | Route | What it gives the operator |
|---|---|---|
| **NASA EONET** (32 source agencies) | `/api/border/eonet` | Aggregated satellite-event feed with per-event source attribution chips. CEMS, NASA_DISP, USGS_EHP, ReliefWeb, GLIDE, IDC, HDDS, SIVolcano, JTWC, IRWIN, FloodList, NASA_HURR, MRR (LANCE Rapid Response), and ~20 more. SE Asia bbox filter, 30-min cache. |
| **NASA FIRMS** (MODIS + VIIRS) | `/api/fires` | Active-fire hotspots for the border box. 15-min in-memory cache. Keyless CSV fallback when no `FIRMS_KEY`; keyed area API when the secret is set. |
| **NASA GIBS** | tiled via MapLibre in `BorderMap.tsx` | 16 toggleable satellite-derived raster overlays: true color (VIIRS + MODIS Aqua/Terra), false color (Bands721, M11-I2-I1), AOD, LST, CO, IMERG precipitation, EVI, Landsat WELD NDVI (30m), MODIS active-fire raster (1km), VIIRS active-fire raster (375m), Himawari-9, Geo Ring natural + IR + airmass, JRC surface water + change, EMODNET bathymetry, Blue Marble, VIIRS DayNightBand (nightlights). |
| **GDACS** (EU JRC + UN OCHA) | `/api/border/disasters` | Multi-hazard alerts (earthquakes, floods, cyclones, volcanoes, wildfires) for SE Asia, 10-min cache. |
| **ReliefWeb** (UN OCHA) | `/api/border/reliefweb` | Humanitarian reports for THA/MMR/KHM/MYS. |
| **OFAC SDN** (US Treasury) | `/api/border/sanctions` | Watchlist hits relevant to the theatre. |

### Live sources requiring a secret (degrade gracefully without it)

| Source | Env var | Behavior when unset |
|---|---|---|
| **ACLED** (Armed Conflict Location & Event Data) | `ACLED_KEY` + `ACLED_EMAIL` | Route returns `[]` + `X-Data-Source: unavailable`. Honest degraded state — the dashboard does not invent conflict events. |
| **NASA FIRMS** (area API — keyed) | `FIRMS_KEY` | Falls back to the keyless SE Asia CSV; same data, slightly older. |

---

## In-app credit line

Layer-level credits are surfaced through the `DAM` / `THRM` / `AIR` /
`FLOW` / `ZONE` toggles' tooltip (`CommandTooltip`, bottom-positioned
on hover). The tooltip lists `source` and `sourceUrl` for the active
layer. The EONET right-rail panel shows per-event source chips
(e.g. `NASA_DISP`, `CEMS`, `ReliefWeb`) so the operator always sees
which agency reported what. No Google / Mapbox credit overlay exists
in-app yet because the active basemap is ESRI (free, no key required);
if a Mapbox / Google key is later wired in, the credit line should
follow the `#cesium-credits` pattern from `gods-eye-view` (always-
visible attribution bottom-left, including in clean-view / recording
modes).
