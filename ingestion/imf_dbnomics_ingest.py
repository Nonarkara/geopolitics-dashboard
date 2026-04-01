"""
IMF + DBnomics economic indicators ingestion.

Fetches quarterly macroeconomic indicators (inflation, debt, trade, current account)
for ASEAN countries from the IMF World Economic Outlook datamapper API.
Stores into the existing country_economic_indicators table alongside World Bank data.

Usage:
    python ingestion/imf_dbnomics_ingest.py
"""

import os
import sys
from datetime import datetime

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

IMF_DATAMAPPER_URL = "https://www.imf.org/external/datamapper/api/v1"

ASEAN_COUNTRIES = [
    ("BRN", "Brunei"),
    ("KHM", "Cambodia"),
    ("IDN", "Indonesia"),
    ("LAO", "Laos"),
    ("MYS", "Malaysia"),
    ("MMR", "Myanmar"),
    ("PHL", "Philippines"),
    ("SGP", "Singapore"),
    ("THA", "Thailand"),
    ("VNM", "Vietnam"),
]

# IMF WEO indicator codes → (label, unit)
IMF_INDICATORS = [
    ("PCPIPCH", "Inflation (CPI)", "%"),
    ("BCA_NGDPD", "Current account balance", "% of GDP"),
    ("GGXWDG_NGDP", "Government debt", "% of GDP"),
    ("TXG_RPCH", "Export growth", "%"),
    ("TMG_RPCH", "Import growth", "%"),
]


def request_json(url, params=None):
    headers = {
        "Accept": "application/json",
        "User-Agent": "geopolitics-dashboard/6.1",
    }
    for attempt in range(3):
        try:
            response = requests.get(
                url, params=params, timeout=REQUEST_TIMEOUT_SECONDS, headers=headers
            )
            if response.ok:
                return response.json()
            if attempt < 2 and response.status_code in {429, 500, 502, 503, 504}:
                import time
                time.sleep(2 + attempt * 2)
                continue
            response.raise_for_status()
        except requests.exceptions.Timeout:
            if attempt < 2:
                continue
            raise
    raise RuntimeError(f"Request failed after retries: {url}")


def fetch_imf_indicators():
    """Fetch all IMF WEO indicators for ASEAN countries."""
    entries = []
    country_codes = [c[0] for c in ASEAN_COUNTRIES]
    country_names = {c[0]: c[1] for c in ASEAN_COUNTRIES}

    for indicator_code, label, unit in IMF_INDICATORS:
        try:
            url = f"{IMF_DATAMAPPER_URL}/{indicator_code}"
            data = request_json(url)

            # IMF datamapper returns: {values: {INDICATOR: {COUNTRY: {YEAR: VALUE}}}}
            values = data.get("values", {}).get(indicator_code, {})

            for country_code in country_codes:
                country_data = values.get(country_code, {})
                if not country_data:
                    continue

                # Get the most recent year with data
                years = sorted(country_data.keys(), reverse=True)
                for year_str in years:
                    value = country_data[year_str]
                    if isinstance(value, (int, float)):
                        entries.append({
                            "country_code": country_code,
                            "country": country_names[country_code],
                            "indicator_code": indicator_code,
                            "indicator_label": label,
                            "value": round(float(value), 4),
                            "unit": unit,
                            "ref_year": int(year_str),
                            "source": "IMF WEO",
                        })
                        break  # Only latest year

        except Exception as e:
            print(f"  Warning: Failed to fetch {indicator_code}: {e}")
            continue

    return entries


def mock_imf_data():
    return [
        {
            "country_code": "THA",
            "country": "Thailand",
            "indicator_code": "PCPIPCH",
            "indicator_label": "Inflation (CPI)",
            "value": 1.2,
            "unit": "%",
            "ref_year": 2025,
            "source": "IMF WEO (mock)",
        },
    ]


def ingest_indicators(entries, captured_at):
    if not DB_URL:
        print("DATABASE_URL not configured — dry run, printing entries:")
        for e in entries[:5]:
            print(f"  {e['country']} / {e['indicator_label']}: {e['value']} {e['unit']} ({e['ref_year']})")
        print(f"  ... {len(entries)} total entries")
        return len(entries)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    count = 0

    for entry in entries:
        cur.execute(
            """
            INSERT INTO country_economic_indicators
                (country_code, country, indicator_code, indicator_label, value, unit, ref_year, source, captured_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (country_code, indicator_code, ref_year, source)
            DO UPDATE SET
                value = EXCLUDED.value,
                indicator_label = EXCLUDED.indicator_label,
                captured_at = EXCLUDED.captured_at
            """,
            (
                entry["country_code"],
                entry["country"],
                entry["indicator_code"],
                entry["indicator_label"],
                entry["value"],
                entry["unit"],
                entry["ref_year"],
                entry["source"],
                captured_at,
            ),
        )
        count += 1

    conn.commit()
    cur.close()
    conn.close()
    return count


def main() -> int:
    print("Fetching IMF WEO indicators for ASEAN countries...")
    try:
        entries = fetch_imf_indicators()
    except Exception as e:
        entries = fallback_or_raise(f"IMF fetch failed: {e}", mock_imf_data)

    if not entries:
        print("  No indicators fetched.")
        return 0

    print(f"  Fetched {len(entries)} indicators across {len(set(e['country_code'] for e in entries))} countries")

    captured_at = datetime.utcnow().isoformat() + "Z"
    count = ingest_indicators(entries, captured_at)
    print(f"  → {count} rows upserted into country_economic_indicators")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        sys.exit(exit_with_error("IMF/DBnomics ingest", e))
