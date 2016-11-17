#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P );
cd "$parent_path"

echo -e "\nremoving views of ${1:-uwazi_development} database"
../node_modules/couchdb-dump/bin/cdbdump -k -h 46.226.109.204 -d ${1:-uwazi_development} |
../node_modules/couchdb-dump/bin/cdbmorph -f ./utils/remove_views.js |
../node_modules/couchdb-dump/bin/cdbload -h 46.226.109.204 -d ${1:-uwazi_development}

echo -e "\nimporting views into ${1:-uwazi_development} database"
../node_modules/couchdb-dump/bin/cdbload -h 46.226.109.204 -d ${1:-uwazi_development} -v < ./views.js
