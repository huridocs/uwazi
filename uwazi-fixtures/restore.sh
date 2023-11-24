#!/bin/bash

[[ -f ".env" ]] && source ".env"

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}
TRANSPILED=${3:-${TRANSPILED:-false}}

echo -e "\n\nDeleting $DB database"
mongosh --quiet -host "$HOST" "$DB" --eval "db.dropDatabase()"
mongorestore -h "$HOST" uwazi-fixtures/dump/uwazi_development/ --db="$DB"

echo "Restoring pdfs..."
rm ./uploaded_documents/*
cp ./uwazi-fixtures/uploaded_documents/* ./uploaded_documents/

echo "Running migrations..."
if [ "$TRANSPILED" = true ]; then
  node ./prod/scripts/migrate.js
else
  yarn migrate
fi

echo "Reindexing..."
if [ "$TRANSPILED" = true ]; then
  node ./prod/database/reindex_elastic.js
else
  yarn reindex
fi
