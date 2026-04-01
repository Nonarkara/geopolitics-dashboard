"""
AISstream maritime vessel position ingestion.

Connects to AISstream.io WebSocket, collects vessel positions in the Thailand
maritime region (Andaman Sea + Gulf of Thailand) for a collection window,
then snapshots the data to vessel_positions table.

Requires AISSTREAM_API_KEY env var (free at aisstream.io).

Usage:
    python ingestion/vessel_ingest.py
"""

import json
import os
import sys
import time
from datetime import datetime

import psycopg2
from dotenv import load_dotenv

from common import exit_with_error, is_value_configured, skip_job

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
API_KEY = os.getenv("AISSTREAM_API_KEY", "")

COLLECTION_SECONDS = int(os.getenv("VESSEL_COLLECTION_SECONDS", "120"))

# Bounding boxes: [[lat_min, lng_min], [lat_max, lng_max]]
BOUNDING_BOXES = [
    [[5.0, 92.0], [16.0, 101.0]],   # Andaman Sea
    [[6.0, 99.0], [14.0, 106.0]],   # Gulf of Thailand + Malacca approach
]


def collect_vessel_positions():
    """Connect to AISstream WebSocket and collect vessel positions."""
    try:
        import websocket
    except ImportError:
        print("websocket-client not installed. Install with: pip install websocket-client")
        return []

    vessels = {}  # mmsi → latest position
    deadline = time.time() + COLLECTION_SECONDS

    subscribe_message = json.dumps({
        "APIKey": API_KEY,
        "BoundingBoxes": BOUNDING_BOXES,
        "FilterMessageTypes": ["PositionReport", "StandardClassBPositionReport"],
    })

    ws = None
    try:
        ws = websocket.create_connection(
            "wss://stream.aisstream.io/v0/stream",
            timeout=15,
        )
        ws.send(subscribe_message)
        print(f"  Connected to AISstream — collecting for {COLLECTION_SECONDS}s...")

        while time.time() < deadline:
            ws.settimeout(max(1, deadline - time.time()))
            try:
                raw = ws.recv()
            except websocket.WebSocketTimeoutException:
                break

            if not raw:
                continue

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            meta = msg.get("MetaData", {})
            position = msg.get("Message", {}).get("PositionReport", {})

            if not position and "StandardClassBPositionReport" in msg.get("Message", {}):
                position = msg["Message"]["StandardClassBPositionReport"]

            if not position:
                continue

            mmsi = str(meta.get("MMSI", ""))
            if not mmsi:
                continue

            lat = position.get("Latitude")
            lng = position.get("Longitude")
            if lat is None or lng is None:
                continue
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue

            vessels[mmsi] = {
                "mmsi": mmsi,
                "vessel_name": (meta.get("ShipName") or "").strip() or None,
                "ship_type": meta.get("ShipType"),
                "latitude": lat,
                "longitude": lng,
                "speed": position.get("Sog"),
                "course": position.get("Cog"),
                "heading": position.get("TrueHeading"),
                "destination": (meta.get("Destination") or "").strip() or None,
                "flag_country": meta.get("country") or meta.get("flag") or None,
            }

    except Exception as e:
        print(f"  WebSocket error: {e}")
    finally:
        if ws:
            try:
                ws.close()
            except Exception:
                pass

    return list(vessels.values())


def mock_vessel_data():
    return [
        {"mmsi": "567000100", "vessel_name": "THAI SPIRIT", "ship_type": 70, "latitude": 7.85, "longitude": 98.35, "speed": 12.5, "course": 180.0, "heading": 178, "destination": "SINGAPORE", "flag_country": "TH"},
        {"mmsi": "533130000", "vessel_name": "ANDAMAN PEARL", "ship_type": 60, "latitude": 9.12, "longitude": 98.10, "speed": 0.0, "course": 0.0, "heading": 270, "destination": "PHUKET", "flag_country": "TH"},
        {"mmsi": "636092000", "vessel_name": "STRAIT RUNNER", "ship_type": 70, "latitude": 6.50, "longitude": 100.20, "speed": 14.2, "course": 315.0, "heading": 312, "destination": "PENANG", "flag_country": "LR"},
    ]


def ingest_vessel_positions(positions, observed_at):
    if not DB_URL:
        print("DATABASE_URL not configured — dry run:")
        for v in positions[:5]:
            print(f"  {v['mmsi']} {v.get('vessel_name', '?'):20s} ({v['latitude']:.3f}, {v['longitude']:.3f}) → {v.get('destination', '?')}")
        print(f"  ... {len(positions)} total vessels")
        return len(positions)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    count = 0

    for v in positions:
        cur.execute(
            """
            INSERT INTO vessel_positions
                (mmsi, vessel_name, ship_type, latitude, longitude, speed, course,
                 heading, destination, flag_country, geom, observed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
            ON CONFLICT (mmsi, observed_at)
            DO UPDATE SET
                vessel_name = COALESCE(EXCLUDED.vessel_name, vessel_positions.vessel_name),
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                speed = EXCLUDED.speed,
                course = EXCLUDED.course,
                heading = EXCLUDED.heading,
                destination = COALESCE(EXCLUDED.destination, vessel_positions.destination),
                flag_country = COALESCE(EXCLUDED.flag_country, vessel_positions.flag_country),
                geom = EXCLUDED.geom
            """,
            (
                v["mmsi"],
                v.get("vessel_name"),
                v.get("ship_type"),
                v["latitude"],
                v["longitude"],
                v.get("speed"),
                v.get("course"),
                v.get("heading"),
                v.get("destination"),
                v.get("flag_country"),
                v["longitude"],  # MakePoint(lng, lat)
                v["latitude"],
                observed_at,
            ),
        )
        count += 1

    conn.commit()
    cur.close()
    conn.close()
    return count


def main() -> int:
    if not is_value_configured(API_KEY):
        return skip_job("AISSTREAM_API_KEY not configured — skipping vessel ingestion.")

    print("Collecting maritime vessel positions via AISstream...")
    try:
        positions = collect_vessel_positions()
    except Exception as e:
        print(f"  Collection failed: {e}")
        positions = mock_vessel_data() if os.getenv("ALLOW_MOCK_INGESTION") == "true" else []

    if not positions:
        print("  No vessel positions collected.")
        return 0

    print(f"  Collected {len(positions)} unique vessel positions")

    observed_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:00Z")  # Round to minute
    count = ingest_vessel_positions(positions, observed_at)
    print(f"  → {count} rows upserted into vessel_positions")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        sys.exit(exit_with_error("Vessel ingest", e))
