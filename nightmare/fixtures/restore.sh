#!/bin/bash
echo -e "\n\nDeleting ${1:-uwazi_development} database"
mongo -host ${2:-127.0.0.1} ${1:-uwazi_development} --eval "db.dropDatabase()"
mongorestore -h ${2:-127.0.0.1} dump/uwazi_development/ --db=${1:-uwazi_development}

echo "Restoring pdfs and other files..."
rm ../../uploaded_documents/*.pdf
rm ../../uploaded_documents/*.jpg
cp ./uploaded_documents/*.pdf ../../uploaded_documents/
cp ./uploaded_documents/*.jpg ../../uploaded_documents/

echo "Indexing into ElasticSearch..."
cd ../../
npm run reindex
