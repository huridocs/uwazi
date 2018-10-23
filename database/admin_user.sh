#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

echo -e "\n\nDeleting ${1:-uwazi_development} database"
mongo -host ${2:-127.0.0.1} ${1:-uwazi_development} --eval "db.users.drop()"
mongorestore -h ${2:-127.0.0.1} blank_state/admin_user/ --db=${1:-uwazi_development}
