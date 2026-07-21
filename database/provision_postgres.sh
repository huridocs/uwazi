#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app/api/core/infrastructure/postgresql/provisioning" && pwd)"

# Use standard PostgreSQL env vars, defaulting to local docker-like settings
export PGHOST=${PGHOST:-127.0.0.1}
export PGPORT=${PGPORT:-5432}
export PGUSER=${PGUSER:-admin}
export PGDATABASE=${PGDATABASE:-uwazi_development}

echo "Provisioning PostgreSQL roles on ${PGHOST}:${PGPORT}/${PGDATABASE}..."

(
  for f in $(find "${SCRIPT_DIR}" -maxdepth 1 -name '*.sql' | sort -V); do
    cat "$f"
  done
) | psql

echo "Done."
