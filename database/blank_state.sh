#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}
FORCE_FLAG=${3}

recreate_database() {
    mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
    mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

    INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
    INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex

    exit 0
}

echo -e "\nDB IS $DB"
echo -e "\nHOST IS $HOST"
echo -e "\nFORCE FLAG IS $FORCE_FLAG"

mongo_indexof_db=$(mongosh --quiet -host $HOST --eval 'db.getMongo().getDBNames().indexOf("'$DB'")')
# mongo_indexof_db="-1"

echo -e "\nResult db: $mongo_indexof_db"

if [ $mongo_indexof_db -ne "-1" ]; then
    echo -e "\n$DB database already exists."
    
    if [ -z "$FORCE_FLAG" ]; then
        echo -e "\nForce flag not set"
        echo -e "\n$DB already database exists. It will not be deleted."
        exit 2    
    else
        echo -e "\nForce flag set"
        recreate_database
    fi
else
    echo -e "\n$DB database does not exist"
    recreate_database
fi