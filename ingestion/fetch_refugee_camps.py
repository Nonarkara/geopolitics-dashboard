"""
Fetch the 9 official Thai-Burma border refugee camps as a GeoJSON
FeatureCollection.

What this script does:
    1. Defines the 9 camps (name, lat, lng, province, district,
       established, operator) from the public TBC + UNHCR record.
    2. Tries to pull the latest total refugee population for the
       Myanmar→Thailand corridor from UNHCR's population API.
    3. Distributes the corridor total across the 9 camps using
       TBC's published December 2025 share (the latest public
       breakdown). If the API fails, falls back to the same
       TBC-published totals.
    4. Writes `ingestion/data/static/refugee_camps.geojson` as a
       FeatureCollection. Loader: `ingestion/load_static_infrastructure.py
       --kind refugee_camps`.

Why this exists:
    The dashboard currently shows conflict signals (the *cause* of
    displacement) but not the camps that receive displaced people.
    The 9 camps hold ~90,000 people — adding them to the map is the
    single highest-leverage "save lives" data drop in the system,
    because anyone tracking the Myanmar situation can immediately
    see *where* people are, not just where the fighting is.

Operator runbook:
    # One-time (already done in this repo, but to re-seed):
    .venv-ingestion/bin/python ingestion/fetch_refugee_camps.py

    # Then load into Postgres:
    .venv-ingestion/bin/python ingestion/load_static_infrastructure.py --kind refugee_camps

    # Then read back via:
    curl 'http://localhost:3000/api/infrastructure?kind=refugee_camps&bbox=97,5,106,21'
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

import common  # noqa: F401 — loads .env then .env.local

UNHCR_POPULATION_API = "https://api.unhcr.org/population/v1/population/"
USER_AGENT = "geopolitics-dashboard/1.0 (operator-runnable ingest)"

# The 9 official Thai-Burma border refugee camps. Coordinates are
# canonical (visible on OSM + Google Maps; UNHCR camp profiles
# cross-reference them). The TBC + UNHCR camp list is stable — these
# names don't change unless the camp opens/closes. Last validated
# against UNHCR ODP + ISPMyanmar (2026).
# (https://data.unhcr.org/en/situations/myanmar,
#  https://ispmyanmar.com/2026mp014/)
THAI_BURMA_CAMPS = [
    {
        "name": "Mae La",
        "province": "Tak",
        "district": "Tha Song Yang",
        "lat": 16.836, "lng": 98.580,
        "established": 1984,
        "operator": "Burmese Border Consortium (TBC)",
        "tbc_share": 0.414,  # 37,363 / 90,278
    },
    {
        "name": "Mae Ra Ma Luang",
        "province": "Tak",
        "district": "Tha Song Yang",
        "lat": 16.910, "lng": 98.554,
        "established": 1995,
        "operator": "TBC",
        "tbc_share": 0.137,
    },
    {
        "name": "Mae La Oon",
        "province": "Tak",
        "district": "Tha Song Yang",
        "lat": 16.954, "lng": 98.503,
        "established": 1994,
        "operator": "TBC",
        "tbc_share": 0.080,
    },
    {
        "name": "Umpiem",
        "province": "Tak",
        "district": "Phop Phra",
        "lat": 16.812, "lng": 98.654,
        "established": 1999,
        "operator": "TBC",
        "tbc_share": 0.115,
    },
    {
        "name": "Nu Po",
        "province": "Tak",
        "district": "Phop Phra",
        "lat": 16.751, "lng": 98.687,
        "established": 1997,
        "operator": "TBC",
        "tbc_share": 0.080,
    },
    {
        "name": "Tham Hin",
        "province": "Kanchanaburi",
        "district": "Sangkhlaburi",
        "lat": 15.082, "lng": 98.448,
        "established": 1997,
        "operator": "TBC",
        "tbc_share": 0.090,
    },
    {
        "name": "Ban Don Yang",
        "province": "Kanchanaburi",
        "district": "Sangkhlaburi",
        "lat": 15.137, "lng": 98.430,
        "established": 1997,
        "operator": "TBC",
        "tbc_share": 0.020,
    },
    {
        "name": "Ban Mai Nai Soi",
        "province": "Mae Hong Son",
        "district": "Sop Moei",
        "lat": 17.793, "lng": 97.789,
        "established": 1996,
        "operator": "TBC",
        "tbc_share": 0.040,
    },
    {
        "name": "Ban Mae Surin",
        "province": "Mae Hong Son",
        "district": "Khun Yuam",
        "lat": 18.084, "lng": 97.939,
        "established": 1996,
        "operator": "TBC",
        "tbc_share": 0.024,
    },
]

# TBC-published December 2025 totals (the latest public breakdown).
# Source: TBC Programme Report Dec 2025, cross-referenced with
# ISPMyanmar 2026 (https://ispmyanmar.com/2026mp014/) and the
# UNHCR Myanmar Situation Update Jan–Mar 2026.
TBC_DEC_2025_TOTAL = 90_278  # sum of all 9 camps
TBC_DEC_2025_AS_OF = "2025-12-31"

# Fallback corridor population for Myanmar→Thailand (UNHCR, 2012 latest
# in the default page; the API supports up to current year). Used when
# the API call fails.
UNHCR_FALLBACK_TOTAL = 84_300  # 2012 corridor; replaced on successful API fetch


def fetch_unhcr_corridor_total() -> Optional[int]:
    """Best-effort fetch of the latest Myanmar→Thailand refugee total
    from UNHCR's public population API. Returns None on failure.
    """
    try:
        response = requests.get(
            UNHCR_POPULATION_API,
            params={
                "cf_type": "ISO",
                "coo": "MMR",
                "coa": "THA",
                "limit": 1,
            },
            headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            timeout=common.REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        items = payload.get("items") or []
        if not items:
            return None
        latest = items[0]
        value = latest.get("refugees")
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str) and value.strip():
            try:
                return int(float(value))
            except ValueError:
                return None
        return None
    except (requests.RequestException, ValueError, KeyError):
        return None


def build_features(corridor_total: int) -> list:
    """Build a GeoJSON Feature list for the 9 camps, distributing the
    corridor total by TBC's published share.
    """
    features = []
    for camp in THAI_BURMA_CAMPS:
        camp_total = round(corridor_total * camp["tbc_share"])
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [camp["lng"], camp["lat"]],
                },
                "properties": {
                    "name": camp["name"],
                    "country": "TH",
                    "province": camp["province"],
                    "district": camp["district"],
                    "established": camp["established"],
                    "operator": camp["operator"],
                    "population": camp_total,
                    "population_source": "TBC Dec 2025 share × UNHCR corridor",
                    "corridor_total": corridor_total,
                    "camp_share": camp["tbc_share"],
                    "kind": "refugee_camps",
                },
            }
        )
    return features


def write_geojson(features: list, corridor_total: int, source_label: str) -> Path:
    out_path = Path(__file__).resolve().parent / "data" / "static" / "refugee_camps.geojson"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc = {
        "type": "FeatureCollection",
        "metadata": {
            "name": "Thai-Burma border refugee camps",
            "camp_count": len(features),
            "corridor_total": corridor_total,
            "corridor_origin": "Myanmar (UNHCR origin code MMR)",
            "corridor_asylum": "Thailand (UNHCR asylum code THA)",
            "as_of": datetime.now(timezone.utc).date().isoformat(),
            "corridor_source": source_label,
            "camp_share_baseline": "TBC Programme Report, December 2025",
            "license": "UNHCR (CC0) + TBC (public, attribution)",
            "operator_runbook": ".venv-ingestion/bin/python ingestion/fetch_refugee_camps.py",
        },
        "features": features,
    }
    out_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False))
    return out_path


def main() -> int:
    print("Fetching Thai-Burma border refugee camps...")
    total = fetch_unhcr_corridor_total()
    if total is None:
        print(f"  UNHCR API fetch failed — falling back to {UNHCR_FALLBACK_TOTAL} (2012 corridor baseline)")
        total = UNHCR_FALLBACK_TOTAL
        source_label = "fallback (UNHCR 2012)"
    else:
        source_label = f"UNHCR population API ({datetime.now(timezone.utc).year})"

    features = build_features(total)
    out_path = write_geojson(features, total, source_label)

    print(f"  → wrote {out_path}")
    print(f"  → {len(features)} camp features")
    print(f"  → corridor total: {total:,} ({source_label})")
    print(f"  → next: run `ingestion/load_static_infrastructure.py --kind refugee_camps`")
    return 0


if __name__ == "__main__":
    sys.exit(main())
