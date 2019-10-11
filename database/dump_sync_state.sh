#!/bin/bash

DB=${1:-uwazi_development}
HOST=${2:-${DBHOST:-127.0.0.1}}

mongodump -h $HOST --db $DB -o sync_state
