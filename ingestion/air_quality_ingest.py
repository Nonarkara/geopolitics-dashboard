import os
from datetime import datetime, timezone

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

AIR_QUALITY_LOCATIONS = [
    {"label": "Phuket Town", "lat": 7.8804, "lng": 98.3923},
    {"label": "Patong", "lat": 7.8964, "lng": 98.2965},
    {"label": "Bangkok", "lat": 13.7563, "lng": 100.5018},
    {"label": "Jakarta", "lat": -6.2088, "lng": 106.8456},
    {"label": "Singapore", "lat": 1.3521, "lng": 103.8198},
    {"label": "Kuala Lumpur", "lat": 3.1390, "lng": 101.6869},
    {"label": "Manila", "lat": 14.5995, "lng": 120.9842},
    {"label": "Hanoi", "lat": 21.0285, "lng": 105.8542},
    {"label": "Phnom Penh", "lat": 11.5564, "lng": 104.9282},
    {"label": "Vientiane", "lat": 17.9757, "lng": 102.6331},
    {"label": "Naypyidaw", "lat": 19.7633, "lng": 96.0785},
    {"label": "BSB (Brunei)", "lat": 4.8902, "lng": 114.9404},
]


def get_category(aqi):
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def fetch_point(location):
    aq_url = (
        "https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={location['lat']}&longitude={location['lng']}&current=us_aqi,pm2_5"
    )

    response = requests.get(
        aq_url,
        timeout=REQUEST_TIMEOUT_SECONDS,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    payload = response.json()
    current = payload.get("current") or {}

    aqi = current.get("us_aqi")
    pm25 = current.get("pm2_5")

    if not isinstance(aqi, (int, float)) or not isinstance(pm25, (int, float)):
        return None

    return {
        "location": location["label"],
        "latitude": location["lat"],
        "longitude": location["lng"],
        "aqi": int(round(aqi)),
        "pm25": float(pm25),
        "category": get_category(aqi),
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "source": "Open-Meteo Precision Core",
    }


def fetch_air_quality_snapshots():
    rows = []
    for location in AIR_QUALITY_LOCATIONS:
        row = fetch_point(location)
        if row:
            rows.append(row)
    return rows


def ingest_air_quality(data):
    if not data or not DB_URL:
        return

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in data:
            cur.execute(
                """
                INSERT INTO air_quality_snapshots (
                    location,
                    latitude,
                    longitude,
                    aqi,
                    pm25,
                    category,
                    observed_at,
                    source
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::timestamptz, %s)
                ON CONFLICT (source, location, observed_at) DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    aqi = EXCLUDED.aqi,
                    pm25 = EXCLUDED.pm25,
                    category = EXCLUDED.category
                """,
                (
                    item["location"],
                    item["latitude"],
                    item["longitude"],
                    item["aqi"],
                    item["pm25"],
                    item["category"],
                    item["observed_at"],
                    item["source"],
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(data)} air-quality snapshots.")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        data = fetch_air_quality_snapshots()
        if not DB_URL:
            print(f"Dry run: fetched {len(data)} air-quality snapshots but no DATABASE_URL found.")
            return 0

        ingest_air_quality(data)
        return 0
    except Exception as error:
        return exit_with_error("Air-quality ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
