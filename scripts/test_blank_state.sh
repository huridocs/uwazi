#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

assert() {                         
  E_PARAM_ERR=98
  E_ASSERT_FAILED=99

  if [ -z "$2" ] 
  then                   
    return $E_PARAM_ERR   
  fi

  message=$1
  assertion=$2

  if [ ! $assertion ] 
  then
    echo "❌ $message"
    exit $E_ASSERT_FAILED
  else
    echo "✅ $message"
    return
  fi  
} 

# + añadir test case con --force
# lo mismo que tenemos aqui pero con el default de blank_state

mongosh --quiet new-db --eval "db.dropDatabase()"

echo -e "\nTest blank state -> new_db"
yarn blank-state new-db > /dev/null 2>&1; result=$?
assert "Creating new-db should be successful" "$result == 0"

echo -e "\nTest blank state -> Database existing should exit with error"
yarn blank-state new-db > /dev/null 2>&1; result=$?
assert "Creating new-db again should throw error" "$result == 2"

echo -e "\nTest blank state -> Database existing should exit with error"
yarn blank-state --force > /dev/null 2>&1; result=$?
assert "Creating default db with force should be successfull" "$result == 0"


# echo 'PEPINILLOS'
# echo $result

#
# echo -e "\nTest blank state -> Database existing with --force"
# FORCE_FLAG="true"
# operations_wrapper
#
# echo -e "\nTest blank state -> Database non-existing"
# mongo_indexof_db="-1"
# operations_wrapper
