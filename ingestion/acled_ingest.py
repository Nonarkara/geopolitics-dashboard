import os
from datetime import datetime, timedelta

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise, skip_job

load_dotenv()

ACLED_EMAIL = os.getenv("ACLED_EMAIL", "").strip()
ACLED_KEY = os.getenv("ACLED_KEY", "").strip()
ACLED_USERNAME = os.getenv("ACLED_USERNAME", "").strip()
ACLED_PASSWORD = os.getenv("ACLED_PASSWORD", "").strip()
DB_URL = os.getenv("DATABASE_URL")

TOKEN_URL = "https://acleddata.com/oauth/token"
ACLED_READ_URL = "https://acleddata.com/api/acled/read"


def resolve_acled_credentials():
    username = ACLED_USERNAME or ACLED_EMAIL
    password = ACLED_PASSWORD or ACLED_KEY

    if not username or not password:
        return None

    using_legacy = not ACLED_PASSWORD and bool(ACLED_KEY)
    return username, password, using_legacy


def get_access_token(credentials):
    username, password, using_legacy = credentials
    response = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "username": username,
            "password": password,
            "grant_type": "password",
            "client_id": "acled",
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )

    if response.status_code == 200:
        payload = response.json()
        token = payload.get("access_token")
        if token:
            return token

        raise RuntimeError("ACLED token response did not include an access token.")

    if using_legacy and response.status_code in {400, 401, 403}:
        raise RuntimeError(
            "ACLED_EMAIL/ACLED_KEY were found, but ACLED now uses OAuth password login. "
            "Set ACLED_PASSWORD (or ACLED_USERNAME + ACLED_PASSWORD) from your myACLED account."
        )

    raise RuntimeError(
        f"Failed to get ACLED access token: {response.status_code} {response.text}"
    )


def fetch_acled_events(days=60):
    credentials = resolve_acled_credentials()
    if not credentials:
        raise RuntimeError(
            "No ACLED OAuth credentials are configured. Set ACLED_PASSWORD or ACLED_USERNAME + ACLED_PASSWORD to enable this optional feed."
        )

    token = get_access_token(credentials)
    since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    params = {
        "_format": "json",
        "country": "Thailand",
        "event_date": since,
        "event_date_where": ">=",
        "fields": "event_id_cnty|event_date|event_type|sub_event_type|actor1|admin1|location|latitude|longitude|fatalities|notes",
        "limit": "5000",
    }

    response = requests.get(
        ACLED_READ_URL,
        params=params,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    if not isinstance(payload, dict):
        raise RuntimeError("ACLED payload shape was invalid.")

    status = payload.get("status")
    if status not in {200, "200"}:
        raise RuntimeError(f"ACLED request failed: {payload}")

    data = payload.get("data")
    if not isinstance(data, list):
        raise RuntimeError("ACLED response did not include a data list.")

    return data


def mock_acled_data():
    return [
        {
            "event_id_cnty": "PHU-MOCK-001",
            "event_date": datetime.now().strftime("%Y-%m-%d"),
            "event_type": "Road safety alert",
            "sub_event_type": "Accident report",
            "actor1": "Local Traffic Authorities",
            "location": "Patong Hill",
            "latitude": 7.8804,
            "longitude": 98.3089,
            "fatalities": 1,
            "notes": "Motorbike crash risk reported on Patong Hill approach due to road surface conditions.",
        },
        {
            "event_id_cnty": "PHU-MOCK-002",
            "event_date": datetime.now().strftime("%Y-%m-%d"),
            "event_type": "Marine advisory",
            "sub_event_type": "Swell warning",
            "actor1": "Marine Department",
            "location": "Kamala Coast",
            "latitude": 7.9663,
            "longitude": 98.2785,
            "fatalities": 0,
            "notes": "Strong swell and gusts reported off Kamala. Small boats advised to exercise caution.",
        },
    ]


def ingest_to_db(data):
    if not data or not DB_URL:
        return

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for event in data:
            cur.execute(
                """
                INSERT INTO events (
                    external_id, event_date, event_type, sub_event_type,
                    actor1, location, fatalities, notes, geom
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_SetSRID(ST_Point(%s, %s), 4326))
                ON CONFLICT (external_id) DO UPDATE SET
                    event_date = EXCLUDED.event_date,
                    event_type = EXCLUDED.event_type,
                    sub_event_type = EXCLUDED.sub_event_type,
                    actor1 = EXCLUDED.actor1,
                    location = EXCLUDED.location,
                    fatalities = EXCLUDED.fatalities,
                    notes = EXCLUDED.notes,
                    geom = EXCLUDED.geom;
                """,
                (
                    event.get("event_id_cnty") or str(event.get("id")),
                    event.get("event_date") or event.get("date"),
                    event.get("event_type") or event.get("event_type_name"),
                    event.get("sub_event_type") or event.get("sub_event_type_name"),
                    event.get("actor1") or event.get("actor1_name"),
                    event.get("admin1") or event.get("admin1_name") or event.get("location"),
                    int(event.get("fatalities", 0) or 0),
                    event.get("notes"),
                    float(event.get("longitude")) if event.get("longitude") else 0,
                    float(event.get("latitude")) if event.get("latitude") else 0,
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(data)} ACLED events.")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        credentials = resolve_acled_credentials()
        if not credentials:
            return skip_job(
                "Skipping ACLED ingestion: no ACLED OAuth credentials are configured. This feed remains optional until ACLED_PASSWORD is set."
            )

        try:
            data = fetch_acled_events()
        except Exception as error:
            if not ACLED_PASSWORD and ACLED_KEY:
                return skip_job(f"Skipping ACLED ingestion: {error}")

            raise

        if not DB_URL:
            print(f"Dry run: fetched {len(data)} ACLED events but no DATABASE_URL found.")
            return 0

        ingest_to_db(data)
        return 0
    except Exception as error:
        if "ALLOW_MOCK_INGESTION=true" in str(error):
            data = fallback_or_raise("ACLED fetch failed.", mock_acled_data)
            ingest_to_db(data)
            return 0

        return exit_with_error("ACLED ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
