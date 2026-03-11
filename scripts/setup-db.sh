#!/bin/bash

set -euo pipefail

# colors
GREEN='\033[0;32m'
NC='\033[0m'

DB_NAME="${1:-geopolitics_db}"

echo -e "${GREEN}Initializing Geopolitics Database...${NC}"

if psql -lqt | cut -d '|' -f 1 | grep -qw "${DB_NAME}"; then
    echo "Database ${DB_NAME} already exists. Applying schema updates..."
else
    createdb "${DB_NAME}"
fi

psql -d "${DB_NAME}" -f db/schema.sql

echo -e "${GREEN}Database setup complete.${NC}"
