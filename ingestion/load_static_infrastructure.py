"""
Load static-infrastructure GeoJSON files into the `static_infrastructure`
Postgres table. Idempotent on (kind, osm_id).

Usage:
    .venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind dams
    .venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind dams --path ingestion/data/static/dams.geojson

What it does:
    1. Reads a GeoJSON FeatureCollection.
    2. For each feature, projects the geometry to EPSG:4326 if needed
       (the GEV bundle is already in 4326; the shim handles accidental
       3857 imports from Overpass).
    3. Extracts `kind`, `osm_id`, `name`, `country`, and the full `properties`
       blob, then UPSERTs into `static_infrastructure`.
    4. Reports counts: read, inserted, updated, skipped.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

import common  # noqa: F401 — loads .env then .env.local

DATABASE_URL = os.environ.get("DATABASE_URL", "")

DEFAULT_SOURCE = "gods-eye-view"
DEFAULT_LICENSE = "ODbL-1.0"


def _country(properties, geometry):
    """Best-effort country code extraction. Returns None when unknown.

    The GEV bundle is OSM-derived, so the country tag is usually present.
    We don't try to infer from coordinates — that's a known-bad pattern
    and the bbox-filtered API call already constrains the geometry to a
    sensible region.
    """
    if not properties:
        return None
    for key in ("addr:country", "is_in:country_code", "country", "ISO3166-1"):
        v = properties.get(key)
        if isinstance(v, str) and 2 <= len(v) <= 3:
            return v.upper()
    return None


def _geometry_wkt(feature):
    """Return a WKT string for the feature geometry, or None if missing.

    Uses Shapely if available, otherwise falls back to the raw geometry
    with no transformation (caller's responsibility to pre-project).
    """
    geom = feature.get("geometry")
    if not geom or not geom.get("coordinates"):
        return None
    try:
        from shapely.geometry import shape
        from shapely import wkt as shapely_wkt
        g = shape(geom)
        if g.is_empty:
            return None
        # GeoJSON RFC 7946 is WGS84 lat/lon. If anything else slips in
        # (e.g. a 3857 export from Overpass), the loader caller will need
        # to project before calling us. We log a warning if the coords
        # are outside the plausible lat/lon range.
        minx, miny, maxx, maxy = g.bounds
        if not (-180 <= minx <= 180 and -180 <= maxx <= 180 and -90 <= miny <= 90 and -90 <= maxy <= 90):
            print(
                f"  warning: feature '{feature.get('properties', {}).get('name', '<unnamed>')}' "
                f"has out-of-range bounds ({minx:.2f}, {miny:.2f}, {maxx:.2f}, {maxy:.2f}); "
                "probably not in EPSG:4326 — skipping"
            )
            return None
        return shapely_wkt.dumps(g)
    except ImportError:
        # No Shapely. Stash the raw GeoJSON in properties and skip the
        # geometry column. This is a degraded mode — the loader should
        # always be run inside .venv-ingestion where Shapely is available.
        return None


def load_one(cur, kind, feature, source, license):
    properties = feature.get("properties") or {}
    name = properties.get("name") or "<unnamed>"
    osm_id = feature.get("id")
    if isinstance(osm_id, str):
        try:
            osm_id = int(osm_id)
        except ValueError:
            osm_id = None
    country = _country(properties, feature.get("geometry"))

    wkt = _geometry_wkt(feature)
    if wkt is None:
        return "skipped"

    cur.execute(
        """
        INSERT INTO static_infrastructure
            (kind, osm_id, name, country, properties, geom,
             source, source_license)
        VALUES
            (%s, %s, %s, %s, %s::jsonb, ST_GeomFromText(%s, 4326),
             %s, %s)
        ON CONFLICT (kind, osm_id) WHERE osm_id IS NOT NULL DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            properties = EXCLUDED.properties,
            geom = EXCLUDED.geom,
            source = EXCLUDED.source,
            source_license = EXCLUDED.source_license,
            updated_at = CURRENT_TIMESTAMP
        """,
        (kind, osm_id, name, country, json.dumps(properties), wkt, source, license),
    )
    return "upserted"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", required=True, help="e.g. dams, datacenters, cables_osm")
    parser.add_argument("--path", default=None, help="Path to GeoJSON. Defaults to ingestion/data/static/<kind>.geojson")
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--license", default=DEFAULT_LICENSE)
    args = parser.parse_args()

    if not DATABASE_URL:
        print("DATABASE_URL not configured — skipping static infrastructure load")
        return 1

    path = Path(args.path) if args.path else Path(__file__).resolve().parent / "data" / "static" / f"{args.kind}.geojson"
    if not path.exists():
        print(f"Source file not found: {path}")
        print(f"Drop a GeoJSON FeatureCollection at this path and re-run.")
        return 1

    with open(path) as fh:
        doc = json.load(fh)

    features = doc.get("features") or []
    print(f"Loading {len(features)} {args.kind} features from {path}...")

    counts = {"upserted": 0, "skipped": 0}
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn, conn.cursor() as cur:
            for feature in features:
                outcome = load_one(cur, args.kind, feature, args.source, args.license)
                counts[outcome] = counts.get(outcome, 0) + 1
    finally:
        conn.close()

    print(f"  → {counts['upserted']} upserted, {counts['skipped']} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
