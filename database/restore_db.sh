#!/bin/bash

[[ -f ".env" ]] && source ".env"

OLDWD=$( cd "$(dirname "${BASH_SOURCE[0]}")"/.. ; pwd -P )
cd /tmp

DB=${1:-${DATABASE_NAME:-uwazi_development}}
HOST=${2:-${DBHOST:-127.0.0.1}}

if [ ! -f "$OLDWD/$DB.tar.gz" ]; then
  echo "Did not find expected $OLDWD/$DB.tar.gz - run restore-db <database name> to pick a different db."
  exit -1
fi

rm -rf $DB*
tar xzf $OLDWD/$DB.tar.gz
mongosh --quiet -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST --gzip --db $DB $DB/$DB
cp $DB/uploaded_documents/* $OLDWD/uploaded_documents

echo "Restored $DB.tar.gz."

cd $OLDWD
export DATABASE_NAME=$DB
yarn migrate
yarn reindex
