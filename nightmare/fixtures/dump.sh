#!/bin/bash
../../node_modules/couchdb-dump/bin/cdbdump -d uwazi_development > fixtures.json

#!/bin/bash
#./node_modules/couchdb-dump/bin/cdbdump -d uwazi_development | ./node_modules/couchdb-dump/bin/cdbmorph -f ./without_designs.js > uwazi.json

echo "Copying uploaded files...";
rm ./uploaded_documents/*.pdf
cp ../../uploaded_documents/*.pdf ./uploaded_documents
