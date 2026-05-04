#!/bin/bash

[[ -f ".env" ]] && source ".env"

DB=${1:-${DATABASE_NAME:-uwazi_e2e}}
HOST=${2:-${DBHOST:-127.0.0.1}}
TRANSPILED=${3:-${TRANSPILED:-false}}

echo -e "\n\nDeleting $DB database"
mongosh --quiet -host "$HOST" "$DB" --eval "db.dropDatabase()"
mongorestore -h "$HOST" "uwazi-fixtures/dump/seeded_e2e/uwazi_e2e/" --db="$DB"

echo "Restoring pdfs..."
mkdir -p ./uploaded_documents
rm -rf ./uploaded_documents/*
cp ./uwazi-fixtures/uploaded_documents/seeded_e2e/* ./uploaded_documents/

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
