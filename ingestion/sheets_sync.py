"""
Google Sheets signal archive sync.

Incrementally syncs signal_archive rows to a Google Sheet for long-term
retroactive analysis. Uses a cursor table to track the last synced timestamp,
then appends new rows in batches of 500.

Requires:
  - DATABASE_URL              — PostgreSQL connection string
  - GOOGLE_SHEETS_ID          — Spreadsheet ID from the Google Sheets URL
  - GOOGLE_SHEETS_CREDENTIALS — Base64-encoded service account JSON key
  - GOOGLE_SHEETS_TAB         — Sheet tab name (default: "Signal Archive")

Setup:
  1. Create a Google Cloud service account + enable Sheets API
  2. Download JSON key → base64 -i key.json → set as env var
  3. Create a Google Sheet and share with the service account email
  4. Set GOOGLE_SHEETS_ID from the sheet URL

Usage:
    python ingestion/sheets_sync.py
    python ingestion/sheets_sync.py --backfill 7   # sync last 7 days
"""

import base64
import json
import os
import sys
from datetime import datetime, timedelta

import psycopg2
from dotenv import load_dotenv

from common import exit_with_error, is_value_configured, skip_job

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID", "")
SHEETS_CREDENTIALS = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "")
SHEETS_TAB = os.getenv("GOOGLE_SHEETS_TAB", "Signal Archive")

BATCH_SIZE = 500
MAX_BATCHES = 20  # Safety limit: 10,000 rows per run

# Column headers for the first row (written once if sheet is empty)
HEADERS = [
    "Timestamp", "Ingested", "Type", "Provider", "Headline", "Summary",
    "Source URL", "Article URL", "Region", "Countries", "Severity", "Score",
    "Fatalities", "Keywords", "Latitude", "Longitude", "External ID",
    "Tags", "Payload Type", "Snapshot Key", "Dashboard Link",
]

SIGNAL_QUERY = """
    SELECT
        published_at,
        ingested_at,
        signal_type,
        source_provider,
        title,
        COALESCE(LEFT(summary, 500), '') AS summary,
        COALESCE(source_url, '') AS source_url,
        COALESCE(url, '') AS url,
        COALESCE(region, '') AS region,
        COALESCE(array_to_string(country_focus, ', '), '') AS country_focus,
        COALESCE(severity, '') AS severity,
        COALESCE(score::text, '') AS score,
        COALESCE(fatalities::text, '') AS fatalities,
        COALESCE(array_to_string(keywords, ', '), '') AS keywords,
        COALESCE(ST_Y(geom)::text, '') AS lat,
        COALESCE(ST_X(geom)::text, '') AS lng,
        COALESCE(external_id, '') AS external_id,
        COALESCE(tags::text, '[]') AS tags,
        COALESCE(payload->>'type', '') AS payload_type,
        COALESCE(payload->>'snapshotKey', '') AS snapshot_key
    FROM signal_archive
    WHERE ingested_at > %s
    ORDER BY ingested_at ASC
    LIMIT %s
"""


def ensure_cursor_table(cur):
    """Create the sync cursor table if it doesn't exist."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sheets_sync_cursor (
            id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
            last_synced_at TIMESTAMPTZ NOT NULL DEFAULT '2020-01-01T00:00:00Z',
            rows_synced BIGINT DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        INSERT INTO sheets_sync_cursor (last_synced_at)
        VALUES ('2020-01-01T00:00:00Z')
        ON CONFLICT DO NOTHING
    """)


def get_cursor(cur):
    """Read the last synced timestamp."""
    cur.execute("SELECT last_synced_at, rows_synced FROM sheets_sync_cursor WHERE id = 1")
    row = cur.fetchone()
    return row[0].isoformat() if row else "2020-01-01T00:00:00Z", row[1] if row else 0


def update_cursor(cur, last_synced_at, rows_added):
    """Advance the cursor after a successful sync."""
    cur.execute(
        """
        UPDATE sheets_sync_cursor
        SET last_synced_at = %s,
            rows_synced = rows_synced + %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        """,
        (last_synced_at, rows_added),
    )


def fetch_new_signals(cur, cursor_timestamp):
    """Fetch the next batch of signals after the cursor."""
    cur.execute(SIGNAL_QUERY, (cursor_timestamp, BATCH_SIZE))
    return cur.fetchall()


def row_to_sheets_values(row):
    """Convert a database row to a flat list for Sheets append."""
    published_at = row[0].isoformat() if row[0] else ""
    ingested_at = row[1].isoformat() if row[1] else ""

    # Build dashboard link for quick lookup
    date_part = published_at[:10] if published_at else ""
    dashboard_link = (
        f"/api/research/signals?from={date_part}&limit=50"
        if date_part
        else ""
    )

    return [
        published_at,       # A: Timestamp
        ingested_at,        # B: Ingested
        row[2] or "",       # C: Type
        row[3] or "",       # D: Provider
        row[4] or "",       # E: Headline
        row[5] or "",       # F: Summary
        row[6] or "",       # G: Source URL
        row[7] or "",       # H: Article URL
        row[8] or "",       # I: Region
        row[9] or "",       # J: Countries
        row[10] or "",      # K: Severity
        row[11] or "",      # L: Score
        row[12] or "",      # M: Fatalities
        row[13] or "",      # N: Keywords
        row[14] or "",      # O: Latitude
        row[15] or "",      # P: Longitude
        row[16] or "",      # Q: External ID
        row[17] or "",      # R: Tags
        row[18] or "",      # S: Payload Type
        row[19] or "",      # T: Snapshot Key
        dashboard_link,     # U: Dashboard Link
    ]


def get_sheets_service():
    """Build an authenticated Google Sheets API service."""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        print("google-api-python-client or google-auth not installed.")
        print("  pip install google-api-python-client google-auth")
        return None

    try:
        creds_json = base64.b64decode(SHEETS_CREDENTIALS)
        creds_dict = json.loads(creds_json)
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        return build("sheets", "v4", credentials=credentials)
    except Exception as e:
        print(f"  Failed to authenticate with Google Sheets: {e}")
        return None


def ensure_headers(service):
    """Write column headers if the sheet is empty."""
    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=SHEETS_ID,
            range=f"'{SHEETS_TAB}'!A1:U1",
        ).execute()

        existing = result.get("values", [])
        if not existing:
            service.spreadsheets().values().update(
                spreadsheetId=SHEETS_ID,
                range=f"'{SHEETS_TAB}'!A1:U1",
                valueInputOption="RAW",
                body={"values": [HEADERS]},
            ).execute()
            print("  Wrote column headers to sheet")
    except Exception as e:
        print(f"  Warning: Could not check/write headers: {e}")


def append_to_sheets(service, rows):
    """Append rows to the Google Sheet."""
    body = {"values": rows}
    service.spreadsheets().values().append(
        spreadsheetId=SHEETS_ID,
        range=f"'{SHEETS_TAB}'!A:U",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body=body,
    ).execute()


def main() -> int:
    # Check required config
    if not is_value_configured(SHEETS_ID):
        return skip_job("GOOGLE_SHEETS_ID not configured — skipping Sheets sync.")

    if not is_value_configured(SHEETS_CREDENTIALS):
        return skip_job("GOOGLE_SHEETS_CREDENTIALS not configured — skipping Sheets sync.")

    if not DB_URL:
        print("DATABASE_URL not configured — dry run mode.")
        print("  Would sync signal_archive → Google Sheet")
        print(f"  Sheet ID: {SHEETS_ID[:20]}...")
        print(f"  Tab: {SHEETS_TAB}")
        return 0

    # Handle --backfill flag
    backfill_days = None
    if "--backfill" in sys.argv:
        idx = sys.argv.index("--backfill")
        if idx + 1 < len(sys.argv):
            backfill_days = int(sys.argv[idx + 1])

    # Connect to database
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    ensure_cursor_table(cur)
    conn.commit()

    cursor_timestamp, total_synced = get_cursor(cur)

    if backfill_days:
        cursor_timestamp = (datetime.utcnow() - timedelta(days=backfill_days)).isoformat() + "Z"
        print(f"Backfilling last {backfill_days} days from {cursor_timestamp}")

    print(f"Sheets sync starting — cursor at {cursor_timestamp} ({total_synced} rows synced previously)")

    # Authenticate with Google Sheets
    service = get_sheets_service()
    if not service:
        cur.close()
        conn.close()
        return 1

    ensure_headers(service)

    # Sync in batches
    total_new = 0
    for batch_num in range(MAX_BATCHES):
        rows = fetch_new_signals(cur, cursor_timestamp)
        if not rows:
            break

        # Convert to Sheets format
        sheets_rows = [row_to_sheets_values(row) for row in rows]

        # Append to sheet
        try:
            append_to_sheets(service, sheets_rows)
        except Exception as e:
            print(f"  Sheets API error on batch {batch_num + 1}: {e}")
            break

        # Advance cursor to the last ingested_at in this batch
        last_ingested = rows[-1][1]  # ingested_at column
        cursor_timestamp = last_ingested.isoformat() if last_ingested else cursor_timestamp

        update_cursor(cur, cursor_timestamp, len(rows))
        conn.commit()

        total_new += len(rows)
        print(f"  Batch {batch_num + 1}: {len(rows)} rows appended (cursor → {cursor_timestamp})")

        if len(rows) < BATCH_SIZE:
            break  # No more rows to sync

    cur.close()
    conn.close()

    print(f"  → {total_new} new rows synced to Google Sheets ({total_synced + total_new} total)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        sys.exit(exit_with_error("Sheets sync", e))
