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
MIGRATE_NEW_FLAG=false

filtered=()
args=("$@")
for item in "${args[@]}"; do
  if [ "$item" == '--force' ]; then
    FORCE_FLAG=true
  elif [ "$item" == '--new' ]; then
    MIGRATE_NEW_FLAG=true
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

resolve_mongorestore() {
  if command -v mongorestore >/dev/null 2>&1; then
    command -v mongorestore
    return
  fi

  if command -v mongorestore.exe >/dev/null 2>&1; then
    command -v mongorestore.exe
    return
  fi

  # Git Bash on Windows may not inherit the MongoDB Tools path.
  local windows_candidates=(
    "/c/Program Files/MongoDB/Tools/100/bin/mongorestore.exe"
    "/c/Program Files (x86)/MongoDB/Tools/100/bin/mongorestore.exe"
    "/c/ProgramData/chocolatey/bin/mongorestore.exe"
  )

  for candidate in "${windows_candidates[@]}"; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done

  return 1
}

MONGORESTORE_BIN="$(resolve_mongorestore || true)"
if [ -z "$MONGORESTORE_BIN" ]; then
  echo -e "\nError!${RED} mongorestore ${NC}command not found."
  echo "Install MongoDB Database Tools and ensure mongorestore is available in PATH."
  exit 127
fi

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
    "$MONGORESTORE_BIN" -h "$HOST" "${AUTH[@]}" "$blank_state_dir/uwazi_shared_db/" --db="$DB"
  else
    "$MONGORESTORE_BIN" -h "$HOST" "${AUTH[@]}" "$blank_state_dir/uwazi_development/" --db="$DB"
  fi

  echo 'PG'

  PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
  PG_PORT="${POSTGRES_PORT:-5432}"
  PG_USER="${POSTGRES_USER:-uwazi}"
  PG_DB="${POSTGRES_DB:-uwazi_development}"

  pg_is_ready_cmd() {
    if command -v pg_isready &>/dev/null; then
      pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q
      return $?
    fi

    if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q '^uwazi-postgres$'; then
      docker exec uwazi-postgres pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -q >/dev/null 2>&1
      return $?
    fi

    return 1
  }

  # runner.js resolves .js → .ts via tsx in dev; production has compiled .js files
  if pg_is_ready_cmd; then
    echo "Restoring PostgreSQL initial data..."
    local force_flag=""
    [ "$FORCE_FLAG" = true ] && force_flag="--force"
    INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/scripts/runner.js" "$repo_root/app/api/infrastructure/blank_state/runPgBlankState.js" "$DB" $force_flag
    INDEX_NAME="$DB" DATABASE_NAME="$DB" node "$repo_root/scripts/runner.js" "$repo_root/scripts/scripts.v2/applyPgSchemaMigrations.ts"
  else
    echo "PostgreSQL is not ready on $PG_HOST:$PG_PORT, skipping schema."
  fi

  if [ "$DB" != "uwazi_shared_db" ]; then
    if [ "$MIGRATE_NEW_FLAG" = true ]; then
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn migrate --new
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn reindex
    else
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn migrate
      INDEX_NAME="$DB" DATABASE_NAME="$DB" yarn reindex
    fi
  fi

  exit 0
}

recreate_database
