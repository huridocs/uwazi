#!/bin/bash
mongodump -h ${2:-127.0.0.1} --db ${1:-uwazi_development} -o sync_state
