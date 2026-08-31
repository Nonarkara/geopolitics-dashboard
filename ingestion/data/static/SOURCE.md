# Static infrastructure — Dams

## What this is

The `dams.geojson` in this folder is the seed data for the
`static_infrastructure` Postgres table (kind = `dams`). It is consumed by
`ingestion/load_static_infrastructure.py`, exposed via
`GET /api/infrastructure?kind=dams&bbox=...`, and rendered as a Mapbox
`fill` + `line` layer in `src/components/Map/BorderMap.tsx`.

## Source

| Field | Value |
|---|---|
| Upstream | https://github.com/bilawalsidhu/gods-eye-view |
| Path | `src/data/local_data/dams/dams.geojson` |
| License | **ODbL 1.0** (Open Database License) — OpenStreetMap extract |
| Commercial use | ✅ Yes (attribution + share-alike on the **derived database**; the MIT-licensed code in this repo is unaffected — same pattern Open Infrastructure Map ships) |
| Attribution | "© OpenStreetMap contributors" |
| Link | https://www.openstreetmap.org/copyright |
| Retrieved | 2026-08-31 |
| Feature count | 704 |
| File size | ~730 KB |
| Geometry types | Polygon, MultiPolygon, Point, LineString (mixed — dam footprints + pumping-station points + pipeline segments) |

## What's NOT in this file

- The Mekong-subregion focus that the geopolitics dashboard wants is
  achieved by the **bbox filter** on `/api/infrastructure`, not by trimming
  the source. The full 704-feature global set is loaded once; the API only
  returns the bbox slice the map is showing. ~40 features are relevant to
  the Thailand–Cambodia–Myanmar–Laos border theatres.

- The GEV bundle strips contact-oriented tags (email, phone) and any note
  value containing an email or phone identifier. We ship the same file
  unchanged. The ODbL-derived database you build on top remains ODbL
  regardless.

## How to refresh

```bash
# 1. Pull a fresh copy
curl -sL --max-time 60 \
  "https://raw.githubusercontent.com/bilawalsidhu/gods-eye-view/main/src/data/local_data/dams/dams.geojson" \
  -o ingestion/data/static/dams.geojson

# 2. Re-load (idempotent on (kind, osm_id))
.venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind dams
```

## Future layers (same shape, same loader, different `--kind`)

- `datacenters` — ODbL 1.0, ~4.3K features, global
- `natural_earth_regions` — public domain, ~1.3K named land/marine polygons
- `cables_osm` — pull from Overpass with `man_made=submarine_cable`,
  ODbL 1.0. **Do not** import TeleGeography's CC BY-NC-SA bundle — see the
  Top-level `docs/DATA_SOURCES.md` note on the asymmetric lawsuit risk
  with TKC PCL.
