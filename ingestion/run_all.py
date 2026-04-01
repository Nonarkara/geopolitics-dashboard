import argparse
import subprocess
import sys
import time
from collections import OrderedDict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

JOB_SCRIPTS = OrderedDict(
    [
        ("acled", "acled_ingest.py"),
        ("markets", "hdx_ingest.py"),
        ("fires", "firms_ingest.py"),
        ("rainfall", "rainfall_ingest.py"),
        ("air-quality", "air_quality_ingest.py"),
        ("refugees", "refugee_ingest.py"),
        ("gkg", "gkg_ingest.py"),
        ("vessels", "vessel_ingest.py"),
        ("imf-dbnomics", "imf_dbnomics_ingest.py"),
        ("daily-summary", "build_daily_summary.py"),
    ]
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run one or more ingestion jobs in sequence."
    )
    parser.add_argument(
        "jobs",
        nargs="*",
        help="Subset of jobs to run. Defaults to all jobs.",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Keep running later jobs even if one job fails.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available jobs and exit.",
    )
    return parser.parse_args()


def normalize_jobs(raw_jobs):
    if not raw_jobs:
        return list(JOB_SCRIPTS.keys())

    unknown = [job for job in raw_jobs if job not in JOB_SCRIPTS]
    if unknown:
        valid = ", ".join(JOB_SCRIPTS.keys())
        raise SystemExit(f"Unknown jobs: {', '.join(unknown)}. Valid jobs: {valid}")

    return raw_jobs


def run_job(job):
    script_name = JOB_SCRIPTS[job]
    script_path = SCRIPT_DIR / script_name
    started_at = time.perf_counter()

    print(f"\n==> Running {job}: {script_name}")
    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=SCRIPT_DIR.parent,
        check=False,
    )
    duration_seconds = time.perf_counter() - started_at

    print(
        f"<== {job} exited with code {result.returncode} in {duration_seconds:.1f}s"
    )

    return result.returncode, duration_seconds


def main():
    args = parse_args()

    if args.list:
        for job, script_name in JOB_SCRIPTS.items():
            print(f"{job}: {script_name}")
        return 0

    jobs = normalize_jobs(args.jobs)
    failures = []

    for job in jobs:
        exit_code, _ = run_job(job)
        if exit_code != 0:
            failures.append(job)
            if not args.continue_on_error:
                break

    print("\nSummary")
    print(f"Jobs requested: {', '.join(jobs)}")
    print(
        "Result: "
        + ("success" if not failures else f"failed ({', '.join(failures)})")
    )

    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
