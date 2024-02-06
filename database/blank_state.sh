#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )
cd "$parent_path" || exit

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

DB=${filtered[0]:-${DATABASE_NAME:-uwazi_development}}
HOST=${filtered[1]:-${DBHOST:-127.0.0.1}}

recreate_database() {
    mongosh --quiet -host "$HOST" "$DB" --eval "db.dropDatabase()"
    mongorestore -h "$HOST" blank_state/uwazi_development/ --db="$DB"

    INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
    INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex

    exit 0
}

mongo_indexof_db=$(mongosh --quiet -host "$HOST" --eval "db.getMongo().getDBNames().indexOf('$DB')")

if [ "$mongo_indexof_db" -ne "-1" ]; then    
    if [ "$FORCE_FLAG" = false ]; then
        echo -e "\n$DB already database exists. It will not be deleted."
        exit 2    
    fi
fi
recreate_database

