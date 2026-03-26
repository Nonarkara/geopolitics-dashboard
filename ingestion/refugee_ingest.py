import os
from datetime import datetime

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
UNHCR_POPULATION_URL = "https://api.unhcr.org/population/v1/population/"
ORIGIN_COUNTRIES = {
    "MMR": "Myanmar",
    "KHM": "Cambodia",
    "LAO": "Laos",
}


def get_number(record, key):
    value = record.get(key)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str) and value.strip():
        try:
            return int(float(value))
        except ValueError:
            return None
    return None


def fetch_unhcr_refugees():
    """Fetch refugee data via the public UNHCR population API."""
    current_year = datetime.utcnow().year
    rows = []

    for origin_code, origin_name in ORIGIN_COUNTRIES.items():
        response = requests.get(
            UNHCR_POPULATION_URL,
            params={
                "cf_type": "ISO",
                "coo": origin_code,
                "coa": "THA",
                "yearFrom": current_year - 2,
                "yearTo": current_year,
                "limit": 10,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        payload = response.json()
        items = payload.get("items")

        if not isinstance(items, list) or not items:
            continue

        latest = sorted(
            (item for item in items if isinstance(item, dict)),
            key=lambda item: get_number(item, "year") or 0,
            reverse=True,
        )[0]
        population = get_number(latest, "refugees")
        year = get_number(latest, "year")

        if not population or not year:
            continue

        rows.append(
            {
                "origin_country_name": origin_name,
                "asylum_country_name": "Thailand",
                "population": population,
                "year": year,
            }
        )

    if rows:
        return rows

    return fallback_or_raise(
        "UNHCR population API did not return current refugee rows.",
        mock_hdx_refugees_data,
    )


def mock_hdx_refugees_data():
    return [
        {"origin_country_name": "Myanmar", "asylum_country_name": "Thailand", "population": 92000, "year": 2025},
        {"origin_country_name": "Cambodia", "asylum_country_name": "Thailand", "population": 5000, "year": 2025},
    ]


def ingest_refugee_data(data):
    if not data or not DB_URL:
        return

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in data:
            cur.execute(
                """
                INSERT INTO population_movements (
                    origin_country, asylum_country, population_type, count, ref_year
                ) VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (origin_country, asylum_country, population_type, ref_year) DO UPDATE SET
                    count = EXCLUDED.count
                """,
                (
                    item.get("origin_country_name"),
                    item.get("asylum_country_name"),
                    "Refugees",
                    item.get("population"),
                    item.get("year"),
                ),
            )

        # Also write to visitor_movements for research tracking
        origin_to_crossing = {
            "Myanmar": ("Mae Sot", "myanmar-frontier"),
            "Cambodia": ("Aranyaprathet", "cambodia-frontier"),
            "Laos": ("Nong Khai", "myanmar-frontier"),
        }
        for item in data:
            origin = item.get("origin_country_name", "")
            crossing, region = origin_to_crossing.get(origin, (origin, "general"))
            cur.execute(
                """
                INSERT INTO visitor_movements (
                    crossing_point, region, direction, movement_type,
                    count, source_provider, ref_date, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (
                    crossing,
                    region,
                    "inbound",
                    "refugee",
                    item.get("population"),
                    "unhcr",
                    f"{item.get('year')}-01-01",
                    f"{origin} refugees in Thailand ({item.get('year')})",
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(data)} refugee records (+ visitor_movements).")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        data = fetch_unhcr_refugees()
        if not DB_URL:
            print(f"Dry run: fetched {len(data)} refugee records but no DATABASE_URL found.")
            return 0

        ingest_refugee_data(data)
        return 0
    except Exception as error:
        return exit_with_error("Refugee ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
