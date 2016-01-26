#!/bin/bash

curl -XDELETE 'http://localhost:9200/uwazi/'
curl -X DELETE http://127.0.0.1:5984/uwazi/
curl -X PUT http://127.0.0.1:5984/uwazi/
./couchdb-dump.sh -r -H 127.0.0.1 -d uwazi -f dump.json
rm -f dump.json-nodesign\"\"
