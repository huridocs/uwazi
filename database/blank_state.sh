#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

recreate_database() {
    mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
    mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

    INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
    INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex
}

for arg in "${@}"; do
    if [ $arg == "--force" ]; then
        FORCE_FLAG=$arg
    fi
done

mongo_indexof_db=$(mongosh --quiet -host $HOST --eval 'db.getMongo().getDBNames().indexOf("'$DB'")')

if [ $mongo_indexof_db -ne "-1" ]; then    
    if [ -z "$FORCE_FLAG" ]; then
        echo -e "\n$DB database already exists. It will not be deleted, use --force flag to recreate it"
        exit 2    
    else
        recreate_database
    fi
else
    recreate_database
fi
