#!/bin/bash

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

mongodump -h $HOST --db $DB -o blank_state

echo "Copying uploaded files...";
rm ./uploaded_documents/*.pdf
rm ./uploaded_documents/*.jpg
cp ../uploaded_documents/*.pdf ./uploaded_documents/
cp ../uploaded_documents/*.jpg ./uploaded_documents/
echo "DONE !";
