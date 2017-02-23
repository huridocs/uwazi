#!/bin/bash
echo "Applying fixtures...";
cd uwazi-fixtures
./restore.sh

echo "Indexing to ElasticSearch...";
cd ../database/
node reindex_elastic.js
echo "DONE !";
