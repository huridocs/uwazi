#!/bin/bash

[[ -f ".env" ]] && source ".env"

DB=${1:-${DATABASE_NAME:-uwazi_e2e}}
HOST=${2:-${DBHOST:-127.0.0.1}}
DUMP_ROOT="uwazi-fixtures/dump/seeded_e2e"
DOCS_ROOT="uwazi-fixtures/uploaded_documents/seeded_e2e"

echo "Refreshing seeded e2e dump from database: $DB"
rm -rf "$DUMP_ROOT"
mkdir -p "$DUMP_ROOT"

mongodump -h "$HOST" --db "$DB" --out "$DUMP_ROOT"
rm -f "$DUMP_ROOT/$DB/prelude.json"

echo "Refreshing seeded fixture documents"
rm -rf "$DOCS_ROOT"
mkdir -p "$DOCS_ROOT"
cp ./uploaded_documents/* "$DOCS_ROOT/" 2>/dev/null || true

echo "Seeded dump updated at: $DUMP_ROOT/$DB"
