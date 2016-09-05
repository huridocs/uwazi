#!/bin/bash

./reset_elastic_index.sh ${1:-uwazi_development}

echo -e "\n\nDeleting ${1:-uwazi_development} database"
curl -X DELETE http://127.0.0.1:5984/${1:-uwazi_development}/
sleep 1
echo -e "\nCreating ${1:-uwazi_development} database"
curl -X PUT http://127.0.0.1:5984/${1-uwazi_development}/
echo -e "\ncreating blank state on ${1:-uwazi_development} database"
../node_modules/couchdb-dump/bin/cdbload -d ${1:-uwazi_development} < uwazi_blank_state.json
sleep 1
echo -e "\nreseting views on ${1:-uwazi_development} database"
./restore_views.sh

echo "Restoring conversions...."
rm ../conversions/*.json
cp ./conversions/*.json ${2:-..}/conversions/
