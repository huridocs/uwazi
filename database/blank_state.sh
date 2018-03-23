#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

echo -e "\n\nDeleting ${1:-uwazi_development} database"
mongo -host ${2:-127.0.0.1} ${1:-uwazi_development} --eval "db.dropDatabase()"
mongorestore -h ${2:-127.0.0.1} blank_state/uwazi_development/ --db=${1:-uwazi_development}

echo "Indexing into ElasticSearch..."
cd ..
npm run reindex
