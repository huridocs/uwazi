#!/bin/bash

set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# yarn hotter uses DATABASE_NAME=uwazi_development_<PORT>. Prefer explicit arg,
# then DATABASE_NAME, then PORT-derived name, then the classic default.
if [ -n "${1:-}" ]; then
  DB="$1"
elif [ -n "${DATABASE_NAME:-}" ]; then
  DB="$DATABASE_NAME"
elif [ -n "${PORT:-}" ]; then
  DB="uwazi_development_${PORT}"
else
  DB="uwazi_development"
fi

HOST="${2:-${DBHOST:-127.0.0.1}}"
# tenant_id in Postgres matches the Mongo database / hotter tenant name
TENANT_ID="$DB"

PGHOST="${POSTGRES_HOST:-127.0.0.1}"
PGPORT="${POSTGRES_PORT:-5432}"
PGDATABASE="${POSTGRES_DB:-uwazi_development}"
PGUSER="${POSTGRES_USER:-migrator_user}"
PGPASSWORD="${POSTGRES_PASSWORD:-migrator_user}"
export PGPASSWORD

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

warn_hotter_mismatch() {
  local hotter_dbs
  hotter_dbs="$(mongosh --quiet --host "$HOST" --eval "
    db.adminCommand('listDatabases').databases
      .map(d => d.name)
      .filter(n => /^uwazi_development_\\d+\$/.test(n))
      .sort()
      .join(', ')
  " 2>/dev/null || true)"

  if [ -z "$hotter_dbs" ]; then
    return
  fi

  if [ "$DB" = "uwazi_development" ]; then
    echo "WARNING: yarn hotter uses uwazi_development_<PORT>, not uwazi_development."
    echo "Found hotter Mongo DBs: $hotter_dbs"
    echo "Example for port 3000: yarn admin-user uwazi_development_3000"
    echo "Or: DATABASE_NAME=uwazi_development_3000 yarn admin-user"
  fi
}

mongo_available() {
  mongosh --quiet --host "$HOST" --eval "db.runCommand({ ping: 1 }).ok" >/dev/null 2>&1
}

reset_mongo_users() {
  local mongorestore_bin
  mongorestore_bin="$(resolve_mongorestore || true)"
  if [ -z "$mongorestore_bin" ]; then
    echo "mongorestore not found; skipping Mongo users reset."
    return 1
  fi

  if ! mongo_available; then
    echo "MongoDB not reachable at $HOST; skipping Mongo users reset."
    return 1
  fi

  warn_hotter_mismatch

  echo -e "\n\nResetting Mongo users collection in $DB on $HOST"
  mongosh --quiet --host "$HOST" "$DB" --eval "db.users.drop()"
  "$mongorestore_bin" -h "$HOST" blank_state/admin_user/ --db="$DB"
  return 0
}

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
    return
  fi

  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^uwazi-postgres$'; then
    docker exec -i -e PGPASSWORD="$PGPASSWORD" uwazi-postgres \
      psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
    return
  fi

  return 127
}

postgres_users_table_exists() {
  local result
  result="$(run_psql -At -c "SELECT to_regclass('public.users') IS NOT NULL;" 2>/dev/null || true)"
  [ "$result" = "t" ]
}

sql_quote() {
  printf "%s" "$1" | sed "s/'/''/g"
}

sync_postgres_users_from_mongo() {
  if ! command -v node >/dev/null 2>&1; then
    echo "node not found; skipping Postgres users sync."
    return 1
  fi

  if ! run_psql -c "SELECT 1" >/dev/null 2>&1; then
    echo "Postgres not reachable; skipping Postgres users sync."
    return 1
  fi

  if ! postgres_users_table_exists; then
    echo "Postgres users table not found in ${PGDATABASE}; skipping Postgres sync."
    return 0
  fi

  if ! mongo_available; then
    echo "MongoDB not reachable; cannot sync users into Postgres."
    return 1
  fi

  echo -e "\n\nSyncing Postgres users for tenant_id=${TENANT_ID} from Mongo DB ${DB}"

  local users_json_file sql_file
  users_json_file="$(mktemp)"
  sql_file="$(mktemp)"
  # shellcheck disable=SC2064
  trap "rm -f '$users_json_file' '$sql_file'" EXIT

  mongosh --quiet --host "$HOST" "$DB" --eval '
    JSON.stringify(
      db.users.find({}).toArray().map(u => ({
        _id: u._id ? u._id.toString() : null,
        username: u.username || null,
        password: u.password || null,
        email: u.email || null,
        role: u.role || null,
        failedLogins: typeof u.failedLogins === "number" ? u.failedLogins : null,
        accountLocked: typeof u.accountLocked === "boolean" ? u.accountLocked : null,
        accountUnlockCode: u.accountUnlockCode || null,
        using2fa: Boolean(u.using2fa),
        secret: u.secret || null,
        deletedAt: u.deletedAt ? new Date(u.deletedAt).toISOString() : null
      }))
    )
  ' >"$users_json_file"

  if [ ! -s "$users_json_file" ] || [ "$(cat "$users_json_file")" = "[]" ]; then
    echo "No Mongo users found to sync into Postgres."
    return 1
  fi

  node --input-type=module -e "
    import fs from 'fs';
    const tenant = process.argv[1];
    const users = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const out = process.argv[3];
    const q = v => {
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      if (typeof v === 'number') return String(v);
      return \"'\" + String(v).replace(/'/g, \"''\") + \"'\";
    };
    const lines = [
      'BEGIN;',
      \"SELECT set_config('app.current_tenant', \" + q(tenant) + \", true);\",
      'DELETE FROM users WHERE tenant_id = current_tenant();',
    ];
    for (const u of users) {
      if (!u._id || !u.username || !u.password || !u.email || !u.role) {
        throw new Error('Mongo user is missing required fields for Postgres sync');
      }
      lines.push(
        'INSERT INTO users (\"_id\", tenant_id, username, password, email, role, \"failedLogins\", \"accountLocked\", \"accountUnlockCode\", using2fa, secret, \"deletedAt\") VALUES (' +
          [q(u._id), q(tenant), q(u.username), q(u.password), q(u.email), q(u.role), q(u.failedLogins), q(u.accountLocked), q(u.accountUnlockCode), q(Boolean(u.using2fa)), q(u.secret), q(u.deletedAt)].join(', ') +
        ');'
      );
    }
    lines.push('COMMIT;');
    fs.writeFileSync(out, lines.join('\\n') + '\\n');
  " "$TENANT_ID" "$users_json_file" "$sql_file"

  run_psql <"$sql_file" >/dev/null
  echo "Postgres users synced for tenant_id=${TENANT_ID}."
  return 0
}

echo "admin-user target: Mongo DB / tenant '${DB}' (host ${HOST})"

MONGO_OK=0
if reset_mongo_users; then
  MONGO_OK=1
fi

PG_OK=0
if sync_postgres_users_from_mongo; then
  PG_OK=1
fi

if [ "$MONGO_OK" -eq 0 ] && [ "$PG_OK" -eq 0 ]; then
  echo "admin-user failed: neither Mongo nor Postgres users could be updated."
  exit 1
fi

echo -e "\nDone. Login should work with admin / admin on tenant/db: ${DB}"
