#!/usr/bin/env bash
# Safety-data ingest — operator-runnable end-to-end script.
#
# Refreshes the humanitarian-safety data layers that don't fit the
# scheduled-cron jobs in run_all.py. Designed to be safe to run by
# hand: no destructive operations, idempotent on the static_infrastructure
# table, all steps print what they did.
#
# What it does:
#   1. fetch_refugee_camps.py     — pulls UNHCR corridor total, distributes
#                                    across the 9 Thai-Burma border camps,
#                                    writes refugee_camps.geojson
#   2. load_static_infrastructure.py — loads both refugee_camps and dams
#                                       into Postgres (idempotent)
#
# After this runs, the data is live at:
#   GET /api/infrastructure?kind=refugee_camps&bbox=97,5,106,21
#   GET /api/infrastructure?kind=dams&bbox=97,5,106,21
#
# Usage:
#   bash ingestion/run_safety_ingest.sh                 # full refresh
#   bash ingestion/run_safety_ingest.sh --camps-only    # just the refugee camps
#   bash ingestion/run_safety_ingest.sh --skip-fetch   # skip the upstream fetch, just reload
#
# Exit codes:
#   0 = all steps succeeded
#   1 = at least one step failed (the others may have run)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PY="${REPO_ROOT}/.venv-ingestion/bin/python"

CAMP_SCRIPT="${REPO_ROOT}/ingestion/fetch_refugee_camps.py"
LOAD_SCRIPT="${REPO_ROOT}/ingestion/load_static_infrastructure.py"

CAMP_KINDS=("refugee_camps" "dams")
DO_FETCH=1

usage() {
    cat <<EOF
Usage: $0 [options]

Options:
    --camps-only    Only refresh refugee_camps, not dams.
    --skip-fetch    Skip the upstream fetch; just reload existing GeoJSON
                    files into Postgres.
    --dams-only     Only refresh dams.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --camps-only)
            CAMP_KINDS=("refugee_camps")
            shift
            ;;
        --dams-only)
            CAMP_KINDS=("dams")
            shift
            ;;
        --skip-fetch)
            DO_FETCH=0
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [[ ! -x "$VENV_PY" ]]; then
    echo "error: $VENV_PY not found. Run 'python3 -m venv .venv-ingestion && .venv-ingestion/bin/pip install -r ingestion/requirements.txt' first." >&2
    exit 1
fi

step() {
    echo ""
    echo "──── $* ────"
}

failed=0

if [[ "$DO_FETCH" -eq 1 ]]; then
    if [[ " ${CAMP_KINDS[*]} " == *" refugee_camps "* ]]; then
        step "fetch refugee_camps"
        if ! "$VENV_PY" "$CAMP_SCRIPT"; then
            echo "  ✗ fetch_refugee_camps.py failed" >&2
            failed=1
        fi
    fi
fi

step "load static_infrastructure: ${CAMP_KINDS[*]}"
for kind in "${CAMP_KINDS[@]}"; do
    if ! "$VENV_PY" "$LOAD_SCRIPT" --kind "$kind"; then
        echo "  ✗ load_static_infrastructure.py failed for $kind" >&2
        failed=1
    fi
done

echo ""
if [[ $failed -eq 0 ]]; then
    echo "✓ Safety ingest complete. Verify at:"
    for kind in "${CAMP_KINDS[@]}"; do
        echo "  curl 'http://localhost:3000/api/infrastructure?kind=$kind&bbox=97,5,106,21' | jq '.total'"
    done
    exit 0
else
    echo "✗ Safety ingest finished with errors (exit 1)." >&2
    exit 1
fi
