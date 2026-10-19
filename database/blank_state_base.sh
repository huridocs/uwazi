#!/bin/bash
set -e
set -o pipefail

parent_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$parent_path" || exit

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
