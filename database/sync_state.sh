#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

echo -e "\n\nDeleting $DB database on $HOST"
mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST sync_state/uwazi_development/ --db=$DB
