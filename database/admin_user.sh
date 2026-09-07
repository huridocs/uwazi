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
export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD

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

# Prefer host TCP via node/pg (works without local psql or docker socket access).
# Falls back to psql / docker exec when node+pg is unavailable.
postgres_reachable_via_node() {
  node --input-type=module -e "
    import pg from 'pg';
    const client = new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      process.exit(0);
    } catch {
      process.exit(1);
    } finally {
      await client.end().catch(() => {});
    }
  " >/dev/null 2>&1
}

resolve_docker() {
  if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    echo docker
    return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n docker ps >/dev/null 2>&1; then
    echo "sudo -n docker"
    return 0
  fi
  return 1
}

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null 2>&1; then
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
      return
    fi
  fi

  local docker_bin
  docker_bin="$(resolve_docker || true)"
  if [ -n "$docker_bin" ] && $docker_bin ps --format '{{.Names}}' | grep -q '^uwazi-postgres$'; then
    $docker_bin exec -i -e PGPASSWORD="$PGPASSWORD" uwazi-postgres \
      psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
    return
  fi

  return 127
}

sync_postgres_users_from_mongo() {
  if ! command -v node >/dev/null 2>&1; then
    echo "node not found; skipping Postgres users sync."
    return 1
  fi

  if ! postgres_reachable_via_node && ! run_psql -c "SELECT 1" >/dev/null 2>&1; then
    echo "Postgres not reachable; skipping Postgres users sync."
    return 1
  fi

  if ! mongo_available; then
    echo "MongoDB not reachable; cannot sync users into Postgres."
    return 1
  fi

  echo -e "\n\nChecking Postgres users table in ${PGDATABASE} for tenant_id=${TENANT_ID}"

  local users_json_file
  users_json_file="$(mktemp)"
  # shellcheck disable=SC2064
  trap "rm -f '$users_json_file'" EXIT

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

  # Sync through node/pg over TCP so we do not depend on local psql or docker.sock perms.
  node --input-type=module -e "
    import fs from 'fs';
    import pg from 'pg';

    const tenant = process.argv[1];
    const users = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const client = new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });

    await client.connect();
    try {
      const table = await client.query(\"SELECT to_regclass('public.users') AS reg\");
      if (!table.rows[0]?.reg) {
        console.log('Postgres users table not found in ' + process.env.PGDATABASE + '; skipping Postgres sync.');
        process.exit(0);
      }

      console.log('Syncing Postgres users for tenant_id=' + tenant + ' from Mongo');
      await client.query('BEGIN');
      await client.query(\"SELECT set_config('app.current_tenant', \$1, true)\", [tenant]);
      await client.query('DELETE FROM users WHERE tenant_id = current_tenant()');

      let synced = 0;
      for (const u of users) {
        if (!u._id || !u.username || !u.password || !u.role) {
          console.log('Skipping incomplete Mongo user: ' + JSON.stringify({ username: u.username, _id: u._id }));
          continue;
        }
        // blank_state/admin_user editor historically has no email; satisfy NOT NULL.
        const email = u.email || (u.username + '@local');
        await client.query(
          'INSERT INTO users (\"_id\", tenant_id, username, password, email, role, \"failedLogins\", \"accountLocked\", \"accountUnlockCode\", using2fa, secret, \"deletedAt\") VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9,\$10,\$11,\$12)',
          [
            u._id,
            tenant,
            u.username,
            u.password,
            email,
            u.role,
            u.failedLogins,
            u.accountLocked,
            u.accountUnlockCode,
            Boolean(u.using2fa),
            u.secret,
            u.deletedAt,
          ]
        );
        synced += 1;
      }

      await client.query('COMMIT');
      console.log('Postgres users synced for tenant_id=' + tenant + ' (' + synced + ' rows).');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await client.end();
    }
  " "$TENANT_ID" "$users_json_file" || return 1
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
