#!/bin/bash

echo -e "\n\nDeleting ${1:-uwazi_development} database"
curl -X DELETE http://localhost:5984/${1:-uwazi_development}/
sleep 1
echo -e "\nCreating ${1:-uwazi_development} database"
curl -X PUT http://localhost:5984/${1-uwazi_development}/
echo -e "\ncreating blank state on ${1:-uwazi_development} database"
../../node_modules/couchdb-dump/bin/cdbload -d ${1:-uwazi_development} < fixtures.json
sleep 1
echo -e "\nreseting views on ${1:-uwazi_development} database"
../../couchdb/restore_views.sh

echo "Restoring pdfs..."
rm ../../uploaded_documents/*.pdf
cp ./uploaded_documents/*.pdf ../../uploaded_documents/
