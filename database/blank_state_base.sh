#!/bin/bash
set -e
set -o pipefail

parent_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$parent_path" || exit
repo_root=$(cd "$parent_path/.." && pwd -P)

FORCE_FLAG=false

filtered=()
args=("$@")
for item in "${args[@]}"; do
  if [ "$item" == '--force' ]; then
    FORCE_FLAG=true
  else
    filtered+=("$item")
  fi
done

DB="${filtered[0]:-${DATABASE_NAME:-uwazi_development}}"
HOST="${filtered[1]:-${DBHOST:-127.0.0.1}}"

AUTH=()
[[ -n "$DBUSER" ]] && AUTH+=("--authenticationDatabase" "admin" "-u" "$DBUSER")
[[ -n "$DBPASS" ]] && AUTH+=("-p" "$DBPASS")

mongo_indexof_db=$(mongosh --quiet "${AUTH[@]}" --host "$HOST" --eval "JSON.stringify(db.getMongo().getDBNames().indexOf('$DB'))" | tr -d '\r\n')

RED='\033[0;31m'
NC='\033[0m'

if [[ "$mongo_indexof_db" =~ ^[0-9]+$ && "$mongo_indexof_db" -ne -1 ]]; then
  if [ "$FORCE_FLAG" = false ]; then
    echo -e "\nError!${RED} $DB ${NC}database already exists. It will not be deleted.\nPlease use --force flag if you want to override\n"
    exit 2
  fi
fi

recreate_database() {
  mongosh --quiet "${AUTH[@]}" --host "$HOST" "$DB" --eval "db.dropDatabase()"

  if [ "$DB" = "uwazi_shared_db" ]; then
    mongorestore -h "$HOST" "${AUTH[@]}" blank_state/uwazi_shared_db/ --db="$DB"
  else
    mongorestore -h "$HOST" "${AUTH[@]}" blank_state/uwazi_development/ --db="$DB"
    if [ "$TRANSPILED" = true ]; then
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/prod/scripts/run.js" ./migrate.js
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/prod/scripts/run.js" ../database/reindex_elastic.js
    else
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn migrate
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn reindex
    fi
  fi

  PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
  PG_PORT="${POSTGRES_PORT:-5432}"
  PG_USER="${POSTGRES_USER:-uwazi}"
  PG_DB="${POSTGRES_DB:-uwazi_development}"

  if command -v pg_isready &>/dev/null && pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q 2>/dev/null; then
    echo "Cleaning existing PostgreSQL data..."
    PGPASSWORD="${POSTGRES_PASSWORD:-uwazi}" psql \
      -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
      -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" \
      && echo "Existing data cleaned." \
      || echo "WARNING: PostgreSQL cleanup failed, skipping."

    echo "Applying PostgreSQL schema..."
    for schema_file in "$repo_root/app/api/core/infrastructure/postgresql/schema/"*.sql; do
      [ -f "$schema_file" ] || continue
      PGPASSWORD="${POSTGRES_PASSWORD:-uwazi}" psql \
        -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        -f "$schema_file" \
        && echo "Applied: $(basename "$schema_file")" \
        || echo "WARNING: Failed to apply $(basename "$schema_file"), skipping."
    done
  else
    echo "PostgreSQL not available on $PG_HOST:$PG_PORT, skipping schema."
  fi

  exit 0
}

recreate_database
