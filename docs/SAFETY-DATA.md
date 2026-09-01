# Safety data — operator runbook

This page covers the data layers whose **primary purpose is life-safety**, not
operator situational awareness. The dividing line:

| Use case | What data | Where it surfaces today |
|---|---|---|
| **Operator situational awareness** | Border incidents, market data, news ticker, traffic, flights, vessels, fires, weather | The main `BorderDashboard.tsx` panels |
| **Public safety / life-safety** | Refugee camps, satellite-event warnings (32 agencies), disaster alerts, hospital locations, future: nightlights, road closures, alert webhooks | `/api/infrastructure?kind=refugee_camps`, `/api/border/disasters`, `/api/border/eonet` — no public surface yet, see `Initiative #1: public safety page` in the audit trail |

The operator-runnable scripts that refresh this data live in `ingestion/`.

## What runs automatically (no keys, no operator action)

| Layer | Source | Route | Refresh |
|---|---|---|---|
| GDACS multi-hazard (earthquakes, floods, cyclones, volcanoes, wildfires) | [GDACS API](https://www.gdacs.org/) — keyless | `/api/border/disasters` | 10 min (revalidate = 600), filtered to SE Asia bbox |
| NASA FIRMS thermal hotspots (MODIS + VIIRS, 24h SE Asia) | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — keyless CSV; keyed area API when `FIRMS_KEY` set | `/api/fires` | 15 min in-memory cache, bbox-filtered to the border box |
| NASA EONET satellite-event tracker (32 source agencies) | [NASA EONET v3](https://eonet.gsfc.nasa.gov/) — keyless | `/api/border/eonet` | 30 min (revalidate = 1800), bbox-filtered to the border box |

All three routes are already live on `geo.nonarkara.org`. **No ingest script
needed on the operator's side** — the Worker calls each upstream at request
time. Verified data is also archived to `signal_archive` via each route's own
`archiveSignalBatch` call.

### NASA EONET — what it actually gives you

EONET is the JSON aggregator that links every natural event to its source
agency. One feed, 32 source agencies including:

- **CEMS** — Copernicus Emergency Management Service (damage assessments)
- **NASA_DISP** — NASA Earth Science Disasters Program
- **NASA_ESRS** — NASA Earth Science and Remote Sensing Unit
- **NASA_HURR** — NASA Hurricane and Typhoon Updates
- **MRR** — NASA LANCE Rapid Response (rapid satellite response)
- **HDDS** — USGS Hazards Data Distribution System
- **USGS_EHP** — USGS Earthquake Hazards Program
- **IDC** — International Charter on Space and Major Disasters
- **GLIDE** — Global Identifier for disaster events
- **ReliefWeb** — UN OCHA humanitarian reporting
- **SIVolcano** — Smithsonian Global Volcanism Program
- **PDC** — Pacific Disaster Center
- **NOAA_NHC** / **NOAA_CPC** — US official
- **FEMA** — US Federal Emergency Management
- **IRWIN** — USFS wildfire reporting
- **JTWC** — Joint Typhoon Warning Center
- **FloodList** — global flood news
- Plus regional wildfire feeds (CALFIRE, BCWILDFIRE, ABFIRE, MBFIRE, DFES_WA)

The route is filtered to the SE Asia bbox (4°N-24°N, 92°E-110°E) on the
client side, since EONET's server-side bbox returns sparse results for our
region. Categories surfaced: droughts, dust, earthquakes, floods, icebergs,
landslides, man-made, sea/lake ice, severe storms, snow, temperature
extremes, volcanoes, water color, wildfires.

**Query knobs** (all optional):
- `?days=90` — lookback window (default 90, max 365)
- `?status=open|closed|all` — default open
- `?source=CEMS` — single source ID filter
- `?category=wildfires` — single category filter
- `?bbox=92,4,110,24` — SE Asia default; client-side filter

The Operator view shows the top 6 events as cards with category chip + source
attribution chips + lat/lon + date. The BorderStatusStrip shows the total
event count with the top 1-2 category breakdown in the sub-line.

## What needs operator action (one command, no keys)

### Refugee camps (9 official Thai-Burma border camps)

```bash
.venv-ingestion/bin/python ingestion/fetch_refugee_camps.py
.venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind refugee_camps
```

Or as one command (recommended for cron use too):

```bash
bash ingestion/run_safety_ingest.sh
```

This pulls the current Myanmar→Thailand corridor total from UNHCR's
keyless population API and distributes it across the 9 camps using
TBC's published December 2025 share. The output is a GeoJSON
FeatureCollection at `ingestion/data/static/refugee_camps.geojson`.
Loading it into Postgres is idempotent on `(kind, osm_id)`.

**Verify in Postgres**:
```sql
SELECT name, properties->>'province' AS province, properties->>'population' AS population
FROM static_infrastructure
WHERE kind = 'refugee_camps'
ORDER BY (properties->>'population')::int DESC;
```

**Read back via the API** (once the dev server is running):
```bash
curl 'http://localhost:3000/api/infrastructure?kind=refugee_camps&bbox=97,5,106,21' | jq '.total'
```

### Dams (already in production; just re-running the loader is a no-op)

`bash ingestion/run_safety_ingest.sh --dams-only`

## Sources, licenses, attribution

| Source | License | Commercial use | Attribution |
|---|---|---|---|
| **UNHCR Operational Data Portal** (corridor totals) | CC0 (public domain) | ✅ Yes | "Source: UNHCR Operational Data Portal" |
| **The Border Consortium** (TBC Programme Report, Dec 2025) | Public, attribution required | ✅ Yes | "Source: The Border Consortium (TBC)" |
| **GDACS** (Global Disaster Alert and Coordination System) | Free for non-commercial use; commercial use permitted with attribution | ✅ Yes (attribution) | "Data: GDACS / European Commission JRC" |
| **NASA EONET** (Earth Observatory Natural Event Tracker) | Public, free for all uses, attribution requested | ✅ Yes | "Data: NASA EONET — 32 source agencies" |
| **NASA FIRMS** (Fire Information for Resource Management System) | Public, free, attribution required | ✅ Yes | "Data: NASA FIRMS / EOSDIS" |
| **NASA GIBS** (Global Imagery Browse Services) | Public, free, attribution required | ✅ Yes | "Imagery: NASA EOSDIS GIBS" |
| **MIMU** (Myanmar Information Management Unit, UN) | Free for humanitarian use | ✅ Yes | "Source: Myanmar Information Management Unit (MIMU)" |
| **Deep South Watch** (Prince of Songkla U, Pattani) | Free, attribution | ✅ Yes | "Source: Deep South Watch, Prince of Songkla University" |
| **ReliefWeb** (UN OCHA) | Free, attribution | ✅ Yes | "Source: ReliefWeb" |

## What's NOT here (and where it would come from)

| Missing | Why it matters | What to do |
|---|---|---|
| Hospital/clinic layer (Overpass `amenity=hospital`, `clinic`) | "Where's the nearest functional hospital" is the second question after "what's happening" | `ingestion/fetch_osm_health.py` — pull via Overpass, ODbL 1.0, keyless |
| VIIRS nighttime lights (mass displacement detection) | A village losing 60% of radiance is mass evacuation, often visible before ground reports | Pre-computed daily tiles from NASA LAADS or Google Earth Engine; build a tile-fetching script |
| Alert webhooks (SMS, push, email) | The system is a screen today. A webhook + OpenEWS would let it act | OpenEWS (MIT) integration — not yet a script |
| Public read-only safety page | Civilians need access to this data without a console | Initiative #1 from the audit — separate cpdt |
| Multilingual surface (Burmese/Karen/Khmer/Malay/Thai-Yawi) | The displaced populations don't read English | Translation pipeline — separate cpdt |

## Limits and what this data does NOT do

This is a **read-only data pipeline**. It does not:

- **Send alerts** to anyone. The webhooks integration is a separate initiative.
- **Verify camp-level populations** in real time. The numbers are distributed from
  the UNHCR corridor total × TBC's published Dec 2025 share. Treat them as
  directional, not authoritative.
- **Predict** displacement. The system shows what's happening now and where
  displaced people are; it does not forecast new displacement (VIEWS / WFP
  PREDICT are separate, expensive, ML-based systems — see the audit trail).
- **Replace** the authoritative bodies (UNHCR, TBC, Deep South Watch, ACLED).
  This is a *read* layer, not a *write* layer.

## What to do if a script fails

1. The fetch script writes the partial output before failing — check
   `ingestion/data/static/*.geojson` to see what landed.
2. The loader is idempotent — running it on stale data is safe; it
   just upserts the same rows.
3. The shell script's `--skip-fetch` flag skips the upstream call
   entirely, which is useful when debugging the loader in isolation.
4. Every script prints what it did, with row counts. If you see
   `0 upserted, 0 skipped`, the source file is empty — the upstream
   call failed silently and the fallback path wasn't taken (file a bug).
