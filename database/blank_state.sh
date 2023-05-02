#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

echo -e "\n\nDeleting $DB database on $HOST"
mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex
