#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )
cd "$parent_path" || exit

assert_equals() {
  E_PARAM_ERR=98
  E_ASSERT_FAILED=99

  if [ -z "$3" ]
  then                   
    return $E_PARAM_ERR   
  fi

  message=$1

  if [ ! "$2" == "$3" ]
  then
    echo "❌ $message"
    exit $E_ASSERT_FAILED
  else
    echo "✅ $message"
    return
  fi  
} 

mongosh --quiet new-db --eval "db.dropDatabase()"

echo -e "\nTest blank state -> new_db"
yarn blank-state new-db > /dev/null 2>&1; result=$?
assert_equals "Creating new-db should be successful" $result 0

echo -e "\nTest blank state -> Database existing should exit with error"
yarn blank-state new-db > /dev/null 2>&1; result=$?
assert_equals "Creating new-db again should throw error" $result 2

echo -e "\nTest blank state -> Database existing with force flag"
yarn blank-state --force new-db > /dev/null 2>&1; result=$?
assert_equals "Creating new-db again should be successful" $result 0

echo -e "\nTest blank state -> Database existing with force flag in any order"
yarn blank-state new-db --force > /dev/null 2>&1; result=$?
assert_equals "Creating new-db again should be successful" $result 0

export DATABASE_NAME="uwazi_development_test";
mongosh --quiet uwazi_development_test --eval "db.dropDatabase()"

echo -e "\nTest blank state -> Default params"
yarn blank-state > /dev/null 2>&1; result=$?
assert_equals "Creating default db should be successful" $result 0

echo -e "\nTest blank state -> Database existing with --force flag"
yarn blank-state --force > /dev/null 2>&1; result=$?
assert_equals "Creating default db with force should be successful" $result 0

echo -e "\nTest blank state -> Database deafult existing should exit with error"
yarn blank-state > /dev/null 2>&1; result=$?
assert_equals "Creating default db again should throw error" $result 2

mongosh --quiet uwazi_development_test --eval "db.dropDatabase()"
mongosh --quiet new-db --eval "db.dropDatabase()"
