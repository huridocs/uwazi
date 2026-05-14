#!/bin/bash
set -e

DB=${1:-uwazi_development}
HOST=${2:-127.0.0.1}
PROFILE=${3:-$DB}
OUT_ROOT="dump/${PROFILE}"
DOCS_ROOT="uploaded_documents/${PROFILE}"

mongodump -h "$HOST" --db "$DB" -o "$OUT_ROOT"
rm -f "$OUT_ROOT/$DB/prelude.json"

echo "Copying uploaded files...";
rm -rf "$DOCS_ROOT"
mkdir -p "$DOCS_ROOT"
cp ../uploaded_documents/* "$DOCS_ROOT/" 2>/dev/null || true
echo "DONE !";
