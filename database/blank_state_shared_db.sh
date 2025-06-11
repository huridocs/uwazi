#!/bin/bash
set -e

parent_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$parent_path" || exit

# Set default database name for shared database
DATABASE_NAME=uwazi_shared_db

# Source the base script
source ./blank_state_base.sh
