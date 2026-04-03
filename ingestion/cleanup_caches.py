"""
Daily cache cleanup — calls fn_cleanup_caches() and prunes old vessel_positions.

Runs as a Render cron job daily at 04:30 UTC.
Removes:
  - intelligence_items_cache rows older than 90 days
  - intelligence_package_snapshots older than 90 days
  - feed_health rows older than 30 days
  - data_snapshots older than 60 days
  - intelligence_source_health (keeps latest per source)
  - vessel_positions older than 90 days
"""

import os
import sys
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)


def run_cleanup():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # Run the existing cleanup function (if it exists)
    try:
        cur.execute("SELECT fn_cleanup_caches();")
        print("fn_cleanup_caches() executed successfully")
    except psycopg2.errors.UndefinedFunction:
        conn.rollback()
        print("fn_cleanup_caches() not found — running manual cleanup")

        # Manual cleanup matching the function's logic
        cleanup_queries = [
            ("intelligence_items_cache", "DELETE FROM intelligence_items_cache WHERE created_at < NOW() - INTERVAL '90 days'"),
            ("feed_health", "DELETE FROM feed_health WHERE checked_at < NOW() - INTERVAL '30 days'"),
            ("data_snapshots", "DELETE FROM data_snapshots WHERE captured_at < NOW() - INTERVAL '60 days'"),
        ]

        for table, query in cleanup_queries:
            try:
                cur.execute(query)
                print(f"  {table}: {cur.rowcount} rows deleted")
            except Exception as e:
                print(f"  {table}: skipped ({e})")
                conn.rollback()
                conn.autocommit = True

    # Prune vessel_positions older than 90 days (unbounded growth table)
    try:
        cur.execute("DELETE FROM vessel_positions WHERE observed_at < NOW() - INTERVAL '90 days'")
        print(f"vessel_positions: {cur.rowcount} rows older than 90 days deleted")
    except Exception as e:
        print(f"vessel_positions cleanup skipped ({e})")

    cur.close()
    conn.close()
    print("Cleanup complete")


if __name__ == "__main__":
    run_cleanup()
