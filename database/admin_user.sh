#!/bin/bash

set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB="${1:-${DATABASE_NAME:-uwazi_development}}"
HOST="${2:-${DBHOST:-127.0.0.1}}"

resolve_mongorestore() {
  if command -v mongorestore >/dev/null 2>&1; then
    command -v mongorestore
    return
  fi

  if command -v mongorestore.exe >/dev/null 2>&1; then
    command -v mongorestore.exe
    return
  fi

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
  echo "mongorestore command not found. Install MongoDB Database Tools."
  exit 127
fi

echo -e "\n\nResetting users collection in $DB on $HOST"
mongosh --quiet --host "$HOST" "$DB" --eval "db.users.drop()"
"$MONGORESTORE_BIN" -h "$HOST" blank_state/admin_user/ --db="$DB"
