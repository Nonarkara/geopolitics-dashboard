import os
from datetime import datetime, timedelta

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

RAINFALL_LOCATIONS = [
    {"label": "Phuket Town", "lat": 7.8804, "lng": 98.3923},
    {"label": "Patong", "lat": 7.8964, "lng": 98.2965},
    {"label": "Phuket Airport", "lat": 8.1132, "lng": 98.3069},
    {"label": "Phang Nga", "lat": 8.4501, "lng": 98.5311},
    {"label": "Khao Lak", "lat": 8.6367, "lng": 98.2487},
    {"label": "Krabi", "lat": 8.0863, "lng": 98.9126},
    {"label": "Surat Thani", "lat": 9.1397, "lng": 99.3331},
    {"label": "Trang", "lat": 7.5594, "lng": 99.6114},
    {"label": "Ranong", "lat": 9.9626, "lng": 98.6388},
]


def fetch_open_meteo_rainfall():
    """Fetch yesterday's precipitation totals via Open-Meteo archive."""
    target_date = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    rows = []

    for location in RAINFALL_LOCATIONS:
        response = requests.get(
            OPEN_METEO_ARCHIVE_URL,
            params={
                "latitude": location["lat"],
                "longitude": location["lng"],
                "start_date": target_date,
                "end_date": target_date,
                "daily": "precipitation_sum",
                "timezone": "Asia/Bangkok",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        payload = response.json()
        daily = payload.get("daily")

        if not isinstance(daily, dict):
            continue

        totals = daily.get("precipitation_sum")
        dates = daily.get("time")

        if not isinstance(totals, list) or not totals or not isinstance(dates, list) or not dates:
            continue

        value = totals[0]
        if not isinstance(value, (int, float)):
            continue

        rows.append(
            {
                "location_name": location["label"],
                "value": float(value),
                "unit": "mm",
                "date": dates[0],
            }
        )

    if rows:
        return rows

    return fallback_or_raise(
        "Open-Meteo rainfall archive did not return usable daily precipitation rows.",
        mock_rainfall_data,
    )


def mock_rainfall_data():
    return [
        {"location_name": "Phuket Town", "value": 12.5, "unit": "mm", "date": datetime.now().strftime("%Y-%m-%d")},
        {"location_name": "Kathu", "value": 18.2, "unit": "mm", "date": datetime.now().strftime("%Y-%m-%d")},
        {"location_name": "Patong", "value": 25.0, "unit": "mm", "date": datetime.now().strftime("%Y-%m-%d")},
        {"location_name": "Thalang", "value": 8.4, "unit": "mm", "date": datetime.now().strftime("%Y-%m-%d")},
    ]


def ingest_rainfall_data(data):
    if not data or not DB_URL:
        return

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in data:
            cur.execute(
                """
                INSERT INTO rainfall_data (
                    location, value, unit, ref_date
                ) VALUES (%s, %s, %s, %s)
                ON CONFLICT (location, ref_date, unit) DO UPDATE SET
                    value = EXCLUDED.value
                """,
                (
                    item.get("location_name") or item.get("admin1_name"),
                    float(item.get("value") or item.get("rainfall", 0)),
                    item.get("unit"),
                    item.get("date") or item.get("reference_period_start"),
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(data)} rainfall records.")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        data = fetch_open_meteo_rainfall()
        if not DB_URL:
            print(f"Dry run: fetched {len(data)} rainfall records but no DATABASE_URL found.")
            return 0

        ingest_rainfall_data(data)
        return 0
    except Exception as error:
        return exit_with_error("Rainfall ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
