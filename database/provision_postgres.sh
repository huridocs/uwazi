#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app/api/core/infrastructure/postgresql/provisioning" && pwd)"

# Use standard PostgreSQL env vars, defaulting to local docker-like settings
export PGHOST=${POSTGRES_HOST:-127.0.0.1}
export PGPORT=${POSTGRES_PORT:-5432}
export PGUSER=${POSTGRES_USER:-admin}
export PGDATABASE=${POSTGRES_DB:-uwazi_development}

echo "Provisioning PostgreSQL roles on ${PGHOST}:${PGPORT}/${PGDATABASE}..."

SQL_STREAM() {
  for f in $(find "${SCRIPT_DIR}" -maxdepth 1 -name '*.sql' | sort -V); do
    cat "$f"
  done
}

if command -v psql >/dev/null 2>&1; then
  SQL_STREAM | psql
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^uwazi-postgres$'; then
  echo "Local psql not found, using psql inside Docker container uwazi-postgres."
  SQL_STREAM | docker exec -i uwazi-postgres psql -U "${PGUSER}" -d "${PGDATABASE}"
else
  echo "Error: psql command not found and Docker fallback unavailable."
  echo "Install PostgreSQL client tools or start container 'uwazi-postgres'."
  exit 127
fi

echo "Done."
