#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${filtered[0]:-${DATABASE_NAME:-uwazi_development}}
HOST=${filtered[1]:-${DBHOST:-127.0.0.1}}

echo -e "\n\nResetting users collection in $DB on $HOST"
mongosh --quiet -host "$HOST" "$DB" --eval "db.users.drop()"
mongorestore -h "$HOST" blank_state/admin_user/ --db="$DB"
