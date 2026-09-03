"""
Build daily signal summaries from the signal_archive table.

Aggregates yesterday's signals into signal_daily_summary for fast trend queries.
Run daily via cron (e.g. 0 2 * * * — 2 AM local time).

Usage:
    python ingestion/build_daily_summary.py [YYYY-MM-DD]
    python ingestion/build_daily_summary.py --all

    If no date is provided, defaults to yesterday.
    `--all` backfills one summary per distinct day in signal_archive.
"""

import os
import sys
from datetime import date, timedelta

import psycopg2

import common  # noqa: F401 — loads .env then .env.local

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def build_summary(target_date: date) -> int:
    if not DATABASE_URL:
        print("DATABASE_URL not configured — skipping daily summary build")
        return 0

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    date_str = target_date.isoformat()
    next_date_str = (target_date + timedelta(days=1)).isoformat()

    # Pre-aggregate top_keywords and source_breakdown per (region, signal_type)
    # bucket in CTEs, then LEFT JOIN them onto the main aggregation. The
    # earlier single-query form (correlated subquery for top_keywords +
    # CROSS JOIN LATERAL for source_breakdown) failed with two errors:
    #   1. "column reference source_provider is ambiguous" inside
    #      jsonb_object_agg (the column is in both the outer sa and the
    #      LATERAL alias).
    #   2. "subquery uses ungrouped column sa.region from outer query" — the
    #      top_keywords subquery correlated on sa.region but the outer
    #      GROUP BY only had COALESCE(region, 'general').
    # Splitting the work into CTEs makes each piece correct on its own.
    cur.execute(
        """
        WITH bounds AS (
            SELECT %s::date AS summary_date,
                   %s::timestamptz AS start_at,
                   %s::timestamptz AS end_at
        ),
        buckets AS (
            SELECT
                COALESCE(sa.region, 'general') AS region,
                sa.signal_type,
                sa.severity,
                sa.fatalities,
                sa.source_provider,
                sa.keywords
            FROM signal_archive sa
            CROSS JOIN bounds
            WHERE sa.published_at >= bounds.start_at
              AND sa.published_at < bounds.end_at
        ),
        kw_counts AS (
            SELECT region, signal_type, kw, COUNT(*) AS cnt
            FROM buckets, unnest(buckets.keywords) AS kw
            GROUP BY region, signal_type, kw
        ),
        top_kw AS (
            SELECT region, signal_type,
                   ARRAY_AGG(kw ORDER BY cnt DESC) FILTER (WHERE rn <= 10) AS top_keywords
            FROM (
                SELECT region, signal_type, kw, cnt,
                       ROW_NUMBER() OVER (PARTITION BY region, signal_type ORDER BY cnt DESC) AS rn
                FROM kw_counts
            ) kc
            GROUP BY region, signal_type
        ),
        provider_counts AS (
            SELECT region, signal_type, source_provider, COUNT(*) AS provider_count
            FROM buckets
            GROUP BY region, signal_type, source_provider
        ),
        provider_bd AS (
            SELECT region, signal_type,
                   jsonb_object_agg(source_provider, provider_count) AS source_breakdown
            FROM provider_counts
            GROUP BY region, signal_type
        )
        INSERT INTO signal_daily_summary
            (summary_date, region, signal_type, signal_count, avg_severity,
             top_keywords, fatality_total, source_breakdown)
        SELECT
            bounds.summary_date,
            b.region,
            b.signal_type,
            COUNT(*) AS signal_count,
            AVG(CASE b.severity
                WHEN 'alert' THEN 3.0
                WHEN 'watch' THEN 2.0
                WHEN 'stable' THEN 1.0
                ELSE NULL
            END) AS avg_severity,
            COALESCE(tk.top_keywords, ARRAY[]::text[]) AS top_keywords,
            COALESCE(SUM(b.fatalities), 0) AS fatality_total,
            COALESCE(pb.source_breakdown, '{}'::jsonb) AS source_breakdown
        FROM buckets b
        CROSS JOIN bounds
        LEFT JOIN top_kw tk
            ON tk.region = b.region AND tk.signal_type = b.signal_type
        LEFT JOIN provider_bd pb
            ON pb.region = b.region AND pb.signal_type = b.signal_type
        GROUP BY bounds.summary_date, b.region, b.signal_type,
                 tk.top_keywords, pb.source_breakdown
        ON CONFLICT (summary_date, region, signal_type)
        DO UPDATE SET
            signal_count = EXCLUDED.signal_count,
            avg_severity = EXCLUDED.avg_severity,
            top_keywords = EXCLUDED.top_keywords,
            fatality_total = EXCLUDED.fatality_total,
            source_breakdown = EXCLUDED.source_breakdown,
            created_at = CURRENT_TIMESTAMP
        """,
        (date_str, date_str, next_date_str),
    )

    row_count = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return row_count


def backfill_all() -> int:
    """Rebuild one summary per (summary_date, region, signal_type) bucket
    from the entire signal_archive. Safe to re-run (idempotent on
    summary_date + region + signal_type)."""
    if not DATABASE_URL:
        print("DATABASE_URL not configured — skipping daily summary backfill")
        return 0

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute(
        """
        WITH buckets AS (
            SELECT
                sa.published_at::date AS summary_date,
                COALESCE(sa.region, 'general') AS region,
                sa.signal_type,
                sa.severity,
                sa.fatalities,
                sa.source_provider,
                sa.keywords
            FROM signal_archive sa
        ),
        kw_counts AS (
            SELECT summary_date, region, signal_type, kw, COUNT(*) AS cnt
            FROM buckets, unnest(buckets.keywords) AS kw
            GROUP BY summary_date, region, signal_type, kw
        ),
        top_kw AS (
            SELECT summary_date, region, signal_type,
                   ARRAY_AGG(kw ORDER BY cnt DESC) FILTER (WHERE rn <= 10) AS top_keywords
            FROM (
                SELECT summary_date, region, signal_type, kw, cnt,
                       ROW_NUMBER() OVER (
                         PARTITION BY summary_date, region, signal_type
                         ORDER BY cnt DESC
                       ) AS rn
                FROM kw_counts
            ) kc
            GROUP BY summary_date, region, signal_type
        ),
        provider_counts AS (
            SELECT summary_date, region, signal_type,
                   source_provider, COUNT(*) AS provider_count
            FROM buckets
            GROUP BY summary_date, region, signal_type, source_provider
        ),
        provider_bd AS (
            SELECT summary_date, region, signal_type,
                   jsonb_object_agg(source_provider, provider_count) AS source_breakdown
            FROM provider_counts
            GROUP BY summary_date, region, signal_type
        )
        INSERT INTO signal_daily_summary
            (summary_date, region, signal_type, signal_count, avg_severity,
             top_keywords, fatality_total, source_breakdown)
        SELECT
            b.summary_date,
            b.region,
            b.signal_type,
            COUNT(*) AS signal_count,
            AVG(CASE b.severity
                WHEN 'alert' THEN 3.0
                WHEN 'watch' THEN 2.0
                WHEN 'stable' THEN 1.0
                ELSE NULL
            END) AS avg_severity,
            COALESCE(tk.top_keywords, ARRAY[]::text[]) AS top_keywords,
            COALESCE(SUM(b.fatalities), 0) AS fatality_total,
            COALESCE(pb.source_breakdown, '{}'::jsonb) AS source_breakdown
        FROM buckets b
        LEFT JOIN top_kw tk
            ON tk.summary_date = b.summary_date
           AND tk.region = b.region
           AND tk.signal_type = b.signal_type
        LEFT JOIN provider_bd pb
            ON pb.summary_date = b.summary_date
           AND pb.region = b.region
           AND pb.signal_type = b.signal_type
        GROUP BY b.summary_date, b.region, b.signal_type,
                 tk.top_keywords, pb.source_breakdown
        ON CONFLICT (summary_date, region, signal_type)
        DO UPDATE SET
            signal_count = EXCLUDED.signal_count,
            avg_severity = EXCLUDED.avg_severity,
            top_keywords = EXCLUDED.top_keywords,
            fatality_total = EXCLUDED.fatality_total,
            source_breakdown = EXCLUDED.source_breakdown,
            created_at = CURRENT_TIMESTAMP
        """
    )
    row_count = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return row_count


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] in {"--all", "all"}:
        print("Backfilling daily summaries from signal_archive...")
        total = backfill_all()
        print(f"  → {total} summary rows upserted")
        return 0

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
