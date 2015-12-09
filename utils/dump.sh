#!/bin/bash
rm -f dump.json
./couchdb-dump.sh -b -H 127.0.0.1 -d uwazi -f dump.json
rm -f dump.json\"\"
