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

RED='\033[0;31m'
NC='\033[0m'

mongo_indexof_db=$(mongosh --quiet "${AUTH[@]}" --host "$HOST" --eval "JSON.stringify(db.getMongo().getDBNames().indexOf('$DB'))" | tr -d '\r\n')

if [[ "$mongo_indexof_db" =~ ^[0-9]+$ && "$mongo_indexof_db" -ne -1 ]]; then
  if [ "$FORCE_FLAG" = false ]; then
    echo -e "\nError!${RED} $DB ${NC}database already exists. It will not be deleted.\nPlease use --force flag if you want to override\n"
    exit 2
  fi
fi

blank_state_dir="${BLANK_STATE_DIR:-$parent_path/blank_state}"

recreate_database() {
  mongosh --quiet "${AUTH[@]}" --host "$HOST" "$DB" --eval "db.dropDatabase()"

  if [ "$DB" = "uwazi_shared_db" ]; then
    mongorestore -h "$HOST" "${AUTH[@]}" "$blank_state_dir/uwazi_shared_db/" --db="$DB"
  else
    mongorestore -h "$HOST" "${AUTH[@]}" "$blank_state_dir/uwazi_development/" --db="$DB"
    if [ "$TRANSPILED" = true ]; then
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/prod/scripts/run.js" ./migrate.js
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/prod/scripts/run.js" ../database/reindex_elastic.js
    else
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn migrate
      echo 'before reindexing'
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn reindex
      echo 'after reindexing'
    fi
  fi

  echo 'PG'

  PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
  PG_PORT="${POSTGRES_PORT:-5432}"
  PG_USER="${POSTGRES_USER:-uwazi}"
  PG_DB="${POSTGRES_DB:-uwazi_development}"

  if command -v pg_isready &>/dev/null && pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q 2>/dev/null; then
    echo "Applying PostgreSQL migrations..."
    if [ "$TRANSPILED" = true ]; then
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/prod/scripts/run.js" "$repo_root/app/api/core/infrastructure/postgresql/runPgMigrations.js"
    else
      INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/scripts/runner.js" "$repo_root/app/api/core/infrastructure/postgresql/runPgMigrations.js"
    fi

    echo "Restoring PostgreSQL initial data..."
    local force_flag=""
    [ "$FORCE_FLAG" = true ] && force_flag="--force"
    node "$repo_root/scripts/runner.js" "$repo_root/app/api/infrastructure/blank_state/runPgBlankState.ts" "$DB" $force_flag
  else
    echo "PostgreSQL not available on $PG_HOST:$PG_PORT, skipping schema."
  fi

  exit 0
}

recreate_database
