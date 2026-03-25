"""
Build daily signal summaries from the signal_archive table.

Aggregates yesterday's signals into signal_daily_summary for fast trend queries.
Run daily via cron (e.g. 0 2 * * * — 2 AM local time).

Usage:
    python ingestion/build_daily_summary.py [YYYY-MM-DD]

If no date is provided, defaults to yesterday.
"""

import os
import sys
from datetime import date, timedelta

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def build_summary(target_date: date) -> int:
    if not DATABASE_URL:
        print("DATABASE_URL not configured — skipping daily summary build")
        return 0

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    date_str = target_date.isoformat()
    next_date_str = (target_date + timedelta(days=1)).isoformat()

    # Aggregate by region × signal_type
    cur.execute(
        """
        INSERT INTO signal_daily_summary
            (summary_date, region, signal_type, signal_count, avg_severity,
             top_keywords, fatality_total, source_breakdown)
        SELECT
            $1::date AS summary_date,
            COALESCE(region, 'general') AS region,
            signal_type,
            COUNT(*) AS signal_count,
            AVG(CASE severity
                WHEN 'alert' THEN 3.0
                WHEN 'watch' THEN 2.0
                WHEN 'stable' THEN 1.0
                ELSE NULL
            END) AS avg_severity,
            -- Top 10 keywords by frequency
            (SELECT ARRAY_AGG(kw ORDER BY cnt DESC)
             FROM (
                SELECT unnest(keywords) AS kw, COUNT(*) AS cnt
                FROM signal_archive sub
                WHERE sub.published_at >= $1::timestamptz
                  AND sub.published_at < $2::timestamptz
                  AND COALESCE(sub.region, 'general') = COALESCE(sa.region, 'general')
                  AND sub.signal_type = sa.signal_type
                GROUP BY kw
                ORDER BY cnt DESC
                LIMIT 10
             ) top_kw
            ) AS top_keywords,
            COALESCE(SUM(fatalities), 0) AS fatality_total,
            jsonb_object_agg(source_provider, provider_count) AS source_breakdown
        FROM signal_archive sa
        CROSS JOIN LATERAL (
            SELECT sa.source_provider, COUNT(*) AS provider_count
            FROM signal_archive sp
            WHERE sp.published_at >= $1::timestamptz
              AND sp.published_at < $2::timestamptz
              AND COALESCE(sp.region, 'general') = COALESCE(sa.region, 'general')
              AND sp.signal_type = sa.signal_type
              AND sp.source_provider = sa.source_provider
            GROUP BY sp.source_provider
        ) provider_counts
        WHERE sa.published_at >= $1::timestamptz
          AND sa.published_at < $2::timestamptz
        GROUP BY COALESCE(region, 'general'), signal_type
        ON CONFLICT (summary_date, region, signal_type)
        DO UPDATE SET
            signal_count = EXCLUDED.signal_count,
            avg_severity = EXCLUDED.avg_severity,
            top_keywords = EXCLUDED.top_keywords,
            fatality_total = EXCLUDED.fatality_total,
            source_breakdown = EXCLUDED.source_breakdown,
            created_at = CURRENT_TIMESTAMP
        """,
        (date_str, next_date_str),
    )

    row_count = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return row_count


def main() -> int:
    if len(sys.argv) > 1:
        target = date.fromisoformat(sys.argv[1])
    else:
        target = date.today() - timedelta(days=1)

    print(f"Building daily summary for {target.isoformat()}...")
    rows = build_summary(target)
    print(f"  → {rows} summary rows upserted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
