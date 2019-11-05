#!/bin/bash

[[ -f ".env" ]] && source ".env"

OLDWD=$( cd "$(dirname "${BASH_SOURCE[0]}")"/.. ; pwd -P )
cd /tmp

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

rm -rf $DB*
mongodump -h $HOST --gzip --db $DB -o $DB
cp -r $OLDWD/uploaded_documents $DB/
tar czf $OLDWD/$DB.tar.gz $DB/

echo "Wrote $DB.tar.gz."
