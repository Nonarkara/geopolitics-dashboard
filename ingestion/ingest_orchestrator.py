"""
Ingest Orchestrator — replaces 10 separate Render cron services with 1 always-on worker.

Saves ~$63/mo by consolidating 10 x $7/mo Starter cron jobs into 1 x $7/mo Starter worker.

Schedules (matching the original render.yaml cron definitions):
  - ACLED conflict events:     every 6 hours at :00
  - FIRMS fire hotspots:       every 3 hours at :20
  - Rainfall archive:          every 6 hours at :15
  - Air quality snapshots:     every 6 hours at :10
  - HDX market data:           daily at 02:45 UTC
  - Refugee/population data:   daily at 04:00 UTC
  - GDELT GKG signals:         every 15 minutes
  - Vessel AIS tracking:       every 10 minutes
  - IMF/DBnomics macro:        weekly Sunday at 05:30 UTC
  - Daily AI summary:          daily at 03:00 UTC
  - Cache cleanup:             daily at 04:30 UTC

Usage:
  python ingestion/ingest_orchestrator.py

Deploy as a Render Background Worker (Starter plan, $7/mo).
"""

import schedule
import subprocess
import sys
import time
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def run_script(name: str):
    """Run an ingestion script as a subprocess."""
    script_path = SCRIPT_DIR / name
    print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S UTC')}] Starting {name}")
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=SCRIPT_DIR.parent,
            timeout=600,  # 10 minute timeout per script
            check=False,
        )
        status = "OK" if result.returncode == 0 else f"FAILED (exit {result.returncode})"
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S UTC')}] {name}: {status}")
    except subprocess.TimeoutExpired:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S UTC')}] {name}: TIMEOUT (>600s)")
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S UTC')}] {name}: ERROR ({e})")


# Every 6 hours
schedule.every(6).hours.at(":00").do(run_script, "acled_ingest.py")
schedule.every(6).hours.at(":10").do(run_script, "air_quality_ingest.py")
schedule.every(6).hours.at(":15").do(run_script, "rainfall_ingest.py")

# Every 3 hours
schedule.every(3).hours.at(":20").do(run_script, "firms_ingest.py")

# Every 15 minutes
schedule.every(15).minutes.do(run_script, "gkg_ingest.py")

# Every 10 minutes
schedule.every(10).minutes.do(run_script, "vessel_ingest.py")

# Daily
schedule.every().day.at("02:45").do(run_script, "hdx_ingest.py")
schedule.every().day.at("03:00").do(run_script, "build_daily_summary.py")
schedule.every().day.at("04:00").do(run_script, "refugee_ingest.py")
schedule.every().day.at("04:30").do(run_script, "cleanup_caches.py")

# Weekly (Sunday)
schedule.every().sunday.at("05:30").do(run_script, "imf_dbnomics_ingest.py")


if __name__ == "__main__":
    print(f"Ingest Orchestrator started at {time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"Scheduled {len(schedule.get_jobs())} jobs")
    print(f"DATABASE_URL: {'set' if os.getenv('DATABASE_URL') else 'NOT SET'}")

    for job in schedule.get_jobs():
        print(f"  {job}")

    print("\nWaiting for scheduled jobs...")

    while True:
        schedule.run_pending()
        time.sleep(30)
