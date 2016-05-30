#!/bin/bash
../node_modules/couchdb-dump/bin/cdbdump -d uwazi_development | ../node_modules/couchdb-dump/bin/cdbmorph -f ./utils/extract_views.js > views.js
