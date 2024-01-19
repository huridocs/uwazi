#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"
cd ../database

DB="uwazi_development"
HOST="127.0.0.1"
FORCE_FLAG="false"

recreate_database() {
    mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
    mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

    INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
    INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex

    echo -e "\nExit code is 0"
}

operations_wrapper() {
    if [ $mongo_indexof_db -ne "-1" ]; then    
        if [ $FORCE_FLAG == "false" ]; then
            echo -e "\n$DB already database exists. It will not be deleted."
            echo -e "\nExit code is 2"
        else
            recreate_database
        fi
    else
        recreate_database
    fi
}

echo -e "\nTest blank state -> Database existing"
mongo_indexof_db=$(mongosh --quiet -host $HOST --eval 'db.getMongo().getDBNames().indexOf("'$DB'")')
operations_wrapper

echo -e "\nTest blank state -> Database existing with --force"
FORCE_FLAG="true"
operations_wrapper

echo -e "\nTest blank state -> Database non-existing"
mongo_indexof_db="-1"
operations_wrapper
