#!/bin/bash

[[ -f ".env" ]] && source ".env"

DB=${1:-${DATABASE_NAME:-uwazi_e2e}}
HOST=${2:-${DBHOST:-127.0.0.1}}
TRANSPILED=${3:-${TRANSPILED:-false}}

echo -e "\n\nDeleting $DB database"
mongosh --quiet -host "$HOST" "$DB" --eval "db.dropDatabase()"
mongorestore -h "$HOST" "uwazi-fixtures/dump/blank_e2e/" --db="$DB"

echo "Resetting uploaded docs..."
rm -rf ./uploaded_documents/*
cp ./uwazi-fixtures/uploaded_documents/blank_e2e/* ./uploaded_documents/ 2>/dev/null || true

echo "Running migrations..."
if [ "$TRANSPILED" = true ]; then
  INDEX_NAME=$DB DATABASE_NAME=$DB node ./prod/scripts/migrate.js
else
  INDEX_NAME=$DB DATABASE_NAME=$DB yarn migrate
fi

echo "Reindexing..."
if [ "$TRANSPILED" = true ]; then
  INDEX_NAME=$DB DATABASE_NAME=$DB node ./prod/database/reindex_elastic.js
else
  INDEX_NAME=$DB DATABASE_NAME=$DB yarn reindex
fi
