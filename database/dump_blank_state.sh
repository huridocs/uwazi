#!/bin/bash
set -e

parent_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$parent_path" || exit

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

mongodump -h "$HOST" --db "$DB" -o "$parent_path/blank_state"

echo "Copying uploaded files..."
rm -f "$parent_path/uploaded_documents/"*.pdf
rm -f "$parent_path/uploaded_documents/"*.jpg
cp -f "$parent_path/../uploaded_documents/"*.pdf "$parent_path/uploaded_documents/" 2>/dev/null || true
cp -f "$parent_path/../uploaded_documents/"*.jpg "$parent_path/uploaded_documents/" 2>/dev/null || true
echo "DONE !"
