import os
import requests
import psycopg2
from dotenv import load_dotenv
from common import (
    REQUEST_TIMEOUT_SECONDS,
    exit_with_error,
    is_value_configured,
    skip_job,
)

load_dotenv()

DB_URL = os.getenv('DATABASE_URL')
# NASA FIRMS API requires a map_key for the area API. Without a key, the
# live /api/fires route falls back to the keyless SE Asia CSV — the same
# approach this script would take, but via the live route on the Worker.
# The script below is the historical batch-ingest path; keep it as a
# one-time operator tool for when a future Postgres is wired to the
# production Worker.
FIRMS_KEY = os.getenv('FIRMS_KEY', 'your_firms_key_here')

CSV_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv"


def fetch_firms_csv():
    """Fetch the keyless SE Asia VIIRS CSV. Public, no key required."""
    response = requests.get(CSV_URL, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    import csv
    from io import StringIO
    f = StringIO(response.text)
    reader = csv.DictReader(f)
    return list(reader)


def ingest_firms_data(data):
    if not data or not DB_URL:
        return

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in data:
            lat = float(item.get('latitude'))
            lng = float(item.get('longitude'))
            cur.execute("""
                INSERT INTO fire_events (
                    latitude, longitude, brightness, confidence, acq_date, geom
                ) VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_Point(%s, %s), 4326))
                ON CONFLICT (latitude, longitude, brightness, confidence, acq_date) DO NOTHING
            """, (
                lat, lng,
                float(item.get('bright_ti4', 0)),
                item.get('confidence'),
                item.get('acq_date'),
                lng, lat
            ))

        conn.commit()
        print(f"Successfully ingested {len(data)} fire events.")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        # Note: this script now exclusively uses the keyless public CSV.
        # The area API path (FIRMS_KEY-gated) lives in /api/fires on the
        # Worker where it can also serve the 15-min cached response to
        # the dashboard. The CSV path is the universal fallback and is
        # the same data source the live route uses when no key is set.
        if not is_value_configured(DB_URL, ''):
            return skip_job(
                "Skipping FIRMS ingestion: DATABASE_URL is not configured. "
                "Live /api/fires route on the Worker continues to serve the "
                "keyless SE Asia VIIRS CSV directly to the dashboard."
            )

        data = fetch_firms_csv()
        ingest_firms_data(data)
        return 0
    except Exception as error:
        return exit_with_error("FIRMS ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
