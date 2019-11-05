#!/bin/bash

[[ -f ".env" ]] && source ".env"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

echo -e "\n\nDeleting $DB database on $HOST"
mongo -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST blank_state/uwazi_development/ --db=$DB

export DATABASE_NAME=$DB
yarn migrate
yarn reindex
