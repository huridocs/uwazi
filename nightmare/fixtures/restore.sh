#!/bin/bash

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

echo -e "\n\nDeleting $DB database on $HOST"
mongo -host $HOST $DB --eval "db.dropDatabase()"
mongorestore -h $HOST dump/uwazi_development/ --db=$DB

echo "Restoring pdfs and other files..."
rm ../../uploaded_documents/*.pdf
rm ../../uploaded_documents/*.jpg
cp ./uploaded_documents/*.pdf ../../uploaded_documents/
cp ./uploaded_documents/*.jpg ../../uploaded_documents/

echo "Indexing into ElasticSearch..."
cd ../../
npm run reindex
