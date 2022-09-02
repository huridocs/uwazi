#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

if [ -n "${MONGO_CONTAINER+set}" ]
then
    docker_prefix="docker exec $MONGO_CONTAINER"
else
    docker_prefix=""
fi

echo -e "\n\nDeleting $DB database on $HOST"
$docker_prefix mongo -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex
