#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INGEST_VENV_DIR="${ROOT_DIR}/.venv-ingestion"
INGEST_PYTHON="${INGEST_VENV_DIR}/bin/python"

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to run ingestion."
    exit 1
fi

cd "${ROOT_DIR}"

if [[ ! -x "${INGEST_PYTHON}" ]]; then
    echo "Creating ingestion virtualenv..."
    python3 -m venv "${INGEST_VENV_DIR}"
fi

echo "Installing ingestion dependencies..."
"${INGEST_PYTHON}" -m pip install -r ingestion/requirements.txt

echo "Applying database schema..."
node scripts/apply-schema.mjs

echo "Running one-shot ingestion warm-up..."
"${INGEST_PYTHON}" ingestion/run_all.py --continue-on-error

echo "Production bootstrap complete."
