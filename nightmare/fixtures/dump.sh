#!/bin/bash

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

mongodump -h $HOST --db $DB -o dump

echo "Copying uploaded files...";
rm ./uploaded_documents/*.pdf
cp ../../uploaded_documents/*.pdf ./uploaded_documents
echo "DONE !";
