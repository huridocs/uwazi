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

  exit 0
}

recreate_database
