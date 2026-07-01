#!/bin/bash
set -e

parent_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$parent_path" || exit

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

blank_state_dir="${BLANK_STATE_DIR:-$parent_path/blank_state}"
uploaded_dir="${BLANK_STATE_UPLOADED_DIR:-$parent_path/uploaded_documents}"

mongodump -h "$HOST" --db "$DB" -o "$blank_state_dir"

echo "Copying uploaded files..."
rm -f "$uploaded_dir/"*.pdf
rm -f "$uploaded_dir/"*.jpg
cp -f "$parent_path/../uploaded_documents/"*.pdf "$uploaded_dir/" 2>/dev/null || true
cp -f "$parent_path/../uploaded_documents/"*.jpg "$uploaded_dir/" 2>/dev/null || true
PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_USER="${POSTGRES_USER:-uwazi}"

echo "DONE !"
