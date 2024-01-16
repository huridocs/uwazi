#!/bin/bash

echo -e "\nTest blank state"

echo -e "\nExisting database and force flag true"
yarn blank-state uwazi_development 127.0.0.1 true 22

echo -e "\nExisting database and force flag false"
yarn blank-state uwazi_development 127.0.0.1 false 22

echo -e "\nNon-existing database and force flag true"
yarn blank-state uwazi_development 127.0.0.1 true -1

echo -e "\nNon-existing database and force flag false"
yarn blank-state uwazi_development 127.0.0.1 false -1