import os
import time
from datetime import datetime

import psycopg2
import requests
from dotenv import load_dotenv

from common import REQUEST_TIMEOUT_SECONDS, exit_with_error, fallback_or_raise

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

FX_RATES_URL = "https://open.er-api.com/v6/latest/USD"
BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
WORLD_BANK_API_URL = "https://api.worldbank.org/v2"
GDP_INDICATOR_ID = "NY.GDP.MKTP.CD"
GDP_PER_CAPITA_INDICATOR_ID = "NY.GDP.PCAP.CD"

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

PROFILE_INDICATORS = [
    ("NY.GDP.MKTP.KD.ZG", "GDP growth", "%"),
    ("NY.GDP.PCAP.CD", "GDP per person", "USD"),
    ("NY.GDP.PCAP.PP.CD", "GDP per person (PPP)", "int$"),
    ("FP.CPI.TOTL.ZG", "Inflation", "%"),
    ("GC.BAL.CASH.GD.ZS", "Budget balance", "% of GDP"),
    ("SP.POP.TOTL", "Population", "people"),
]


def request_json(url, params=None):
    headers = {
        "Accept": "application/json",
        "User-Agent": "geopolitics-dashboard-bootstrap/1.0",
    }

    for attempt in range(3):
        response = requests.get(
            url,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers=headers,
        )

        if response.ok:
            return response.json()

        is_world_bank = "api.worldbank.org" in url
        body = response.text[:200]
        should_retry = is_world_bank and response.status_code in {400, 429, 500, 502, 503, 504}

        if should_retry and attempt < 2:
            time.sleep(1 + attempt)
            continue

        response.raise_for_status()

    raise RuntimeError(f"Request failed after retries: {url}")


def fetch_reference_market_data():
    fx_payload = request_json(FX_RATES_URL)
    ticker_payload = request_json(BINANCE_TICKER_URL)

    if fx_payload.get("result") != "success":
        return fallback_or_raise(
            "FX reference payload was incomplete.",
            mock_reference_market_data,
        )

    rates = fx_payload.get("rates") or {}
    thb_per_usd = rates.get("THB")
    sgd_per_usd = rates.get("SGD")
    myr_per_usd = rates.get("MYR")

    if not isinstance(thb_per_usd, (int, float)) or not isinstance(sgd_per_usd, (int, float)) or not isinstance(myr_per_usd, (int, float)):
        return fallback_or_raise(
            "FX reference payload was missing THB, SGD, or MYR.",
            mock_reference_market_data,
        )

    btc_price = float(ticker_payload.get("lastPrice"))
    btc_change = float(ticker_payload.get("priceChangePercent"))

    return [
        {
            "category": "FX",
            "indicator": "USD/THB",
            "value": round(thb_per_usd, 2),
            "unit": None,
            "province": None,
            "source": "ExchangeRate API (open.er-api.com)",
        },
        {
            "category": "FX",
            "indicator": "SGD/THB",
            "value": round(thb_per_usd / sgd_per_usd, 2),
            "unit": None,
            "province": None,
            "source": "ExchangeRate API (open.er-api.com)",
        },
        {
            "category": "FX",
            "indicator": "MYR/THB",
            "value": round(thb_per_usd / myr_per_usd, 2),
            "unit": None,
            "province": None,
            "source": "ExchangeRate API (open.er-api.com)",
        },
        {
            "category": "Crypto",
            "indicator": "BTC/USD",
            "value": round(btc_price, 0),
            "unit": None,
            "province": None,
            "source": "Binance BTCUSDT",
        },
    ]


def build_world_bank_indicator_url(indicator_id):
    countries = ";".join(code for code, _ in ASEAN_COUNTRIES)
    return f"{WORLD_BANK_API_URL}/country/{countries}/indicator/{indicator_id}"


def fetch_world_bank_series(indicator_id, max_rows="200"):
    payload = request_json(
        build_world_bank_indicator_url(indicator_id),
        params={
            "format": "json",
            "per_page": max_rows,
            "date": "2018:2024",
        },
    )

    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        # An indicator the World Bank has archived (e.g. GC.BAL.CASH.GD.ZS)
        # or rate-limited will return a non-list / single-element payload.
        # Skip per indicator rather than aborting the whole profile build,
        # so other indicators in PROFILE_INDICATORS still land.
        print(f"World Bank payload not recognized for {indicator_id}; skipping indicator.")
        return []

    return payload[1]


def latest_world_bank_values(indicator_id, max_rows="100"):
    rows = fetch_world_bank_series(indicator_id, max_rows=max_rows)
    latest = {}

    for row in rows:
        if not isinstance(row, dict):
            continue
        value = row.get("value")
        country_code = row.get("countryiso3code")
        country = (row.get("country") or {}).get("value") if isinstance(row.get("country"), dict) else None
        year = row.get("date")

        if (
            not country_code
            or
            value is None
            or country_code in latest
        ):
            continue

        try:
            latest[country_code] = {
                "country_code": country_code,
                "country": country,
                "value": float(value),
                "year": int(year),
            }
        except (TypeError, ValueError):
            continue

    return latest


def fetch_asean_gdp_snapshot():
    gdp_values = latest_world_bank_values(GDP_INDICATOR_ID)
    per_capita_values = latest_world_bank_values(GDP_PER_CAPITA_INDICATOR_ID)
    snapshot = []

    for country_code, country_name in ASEAN_COUNTRIES:
        gdp = gdp_values.get(country_code)
        per_capita = per_capita_values.get(country_code)
        if not gdp or not per_capita:
            continue

        snapshot.append(
            {
                "country_code": country_code,
                "country": country_name,
                "gdp_usd": gdp["value"],
                "gdp_per_capita_usd": per_capita["value"],
                "gdp_year": gdp["year"],
                "gdp_per_capita_year": per_capita["year"],
                "source": "World Bank WDI",
            }
        )

    if snapshot:
        return snapshot

    return fallback_or_raise(
        "World Bank GDP snapshot was empty.",
        mock_macro_snapshot,
    )


def fetch_country_profile_snapshots():
    captured = []

    for indicator_code, indicator_label, unit in PROFILE_INDICATORS:
        latest = latest_world_bank_values(indicator_code)
        for country_code, country_name in ASEAN_COUNTRIES:
            entry = latest.get(country_code)
            if not entry:
                continue

            captured.append(
                {
                    "country_code": country_code,
                    "country": country_name,
                    "indicator_code": indicator_code,
                    "indicator_label": indicator_label,
                    "value": entry["value"],
                    "unit": unit,
                    "ref_year": entry["year"],
                    "source": "World Bank WDI",
                }
            )

    return captured


def mock_reference_market_data():
    return [
        {"category": "FX", "indicator": "USD/THB", "value": 34.2, "unit": None, "province": None, "source": "Fallback markets"},
        {"category": "FX", "indicator": "SGD/THB", "value": 25.2, "unit": None, "province": None, "source": "Fallback markets"},
        {"category": "FX", "indicator": "MYR/THB", "value": 7.2, "unit": None, "province": None, "source": "Fallback markets"},
        {"category": "Crypto", "indicator": "BTC/USD", "value": 82000, "unit": None, "province": None, "source": "Fallback markets"},
    ]


def mock_macro_snapshot():
    return []


def ingest_market_data(data, ref_date):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in data:
            cur.execute(
                """
                DELETE FROM market_data
                WHERE category IS NOT DISTINCT FROM %s
                  AND indicator = %s
                  AND unit IS NOT DISTINCT FROM %s
                  AND province IS NOT DISTINCT FROM %s
                  AND source IS NOT DISTINCT FROM %s
                  AND ref_date = %s::date
                """,
                (
                    item.get("category"),
                    item.get("indicator"),
                    item.get("unit"),
                    item.get("province"),
                    item.get("source"),
                    ref_date,
                ),
            )

            cur.execute(
                """
                INSERT INTO market_data (
                    category, indicator, value, unit, province, source, ref_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    item.get("category"),
                    item.get("indicator"),
                    item.get("value"),
                    item.get("unit"),
                    item.get("province"),
                    item.get("source"),
                    ref_date,
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(data)} reference market indicators.")
    finally:
        cur.close()
        conn.close()


def ingest_macro_snapshot(snapshot, captured_at):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in snapshot:
            cur.execute(
                """
                INSERT INTO macro_country_snapshots (
                    country_code,
                    country,
                    gdp_usd,
                    gdp_per_capita_usd,
                    gdp_year,
                    gdp_per_capita_year,
                    source,
                    captured_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::timestamptz)
                ON CONFLICT (country_code, gdp_year, gdp_per_capita_year, source) DO UPDATE SET
                    country = EXCLUDED.country,
                    gdp_usd = EXCLUDED.gdp_usd,
                    gdp_per_capita_usd = EXCLUDED.gdp_per_capita_usd,
                    captured_at = EXCLUDED.captured_at
                """,
                (
                    item["country_code"],
                    item["country"],
                    item["gdp_usd"],
                    item["gdp_per_capita_usd"],
                    item["gdp_year"],
                    item["gdp_per_capita_year"],
                    item["source"],
                    captured_at,
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(snapshot)} ASEAN macro snapshots.")
    finally:
        cur.close()
        conn.close()


def ingest_country_profiles(entries, captured_at):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        for item in entries:
            cur.execute(
                """
                INSERT INTO country_economic_indicators (
                    country_code,
                    country,
                    indicator_code,
                    indicator_label,
                    value,
                    unit,
                    ref_year,
                    source,
                    captured_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::timestamptz)
                ON CONFLICT (country_code, indicator_code, ref_year, source) DO UPDATE SET
                    country = EXCLUDED.country,
                    indicator_label = EXCLUDED.indicator_label,
                    value = EXCLUDED.value,
                    unit = EXCLUDED.unit,
                    captured_at = EXCLUDED.captured_at
                """,
                (
                    item["country_code"],
                    item["country"],
                    item["indicator_code"],
                    item["indicator_label"],
                    item["value"],
                    item["unit"],
                    item["ref_year"],
                    item["source"],
                    captured_at,
                ),
            )

        conn.commit()
        print(f"Successfully ingested {len(entries)} country economic indicator snapshots.")
    finally:
        cur.close()
        conn.close()


def main():
    try:
        markets = fetch_reference_market_data()
        macro_snapshot = fetch_asean_gdp_snapshot()
        ref_date = datetime.utcnow().strftime("%Y-%m-%d")
        captured_at = datetime.utcnow().isoformat()

        if not DB_URL:
            print(f"Dry run: fetched {len(markets)} markets and {len(macro_snapshot)} macro rows but no DATABASE_URL.")
            return 0

        ingest_market_data(markets, ref_date)
        ingest_macro_snapshot(macro_snapshot, captured_at)

        try:
            country_profiles = fetch_country_profile_snapshots()
        except Exception as error:
            print(f"Skipping country profile warm-up: {error}")
            country_profiles = []

        if country_profiles:
            ingest_country_profiles(country_profiles, captured_at)

        return 0
    except Exception as error:
        return exit_with_error("Reference market ingestion failed", error)


if __name__ == "__main__":
    raise SystemExit(main())
