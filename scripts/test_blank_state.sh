#!/bin/bash

echo -e "\nTest blank state"

echo -e "\nNO FORCE FLAG"
yarn blank-state uwazi_development 127.0.0.1

echo -e "\nFORCE FLAG SENT"
yarn blank-state uwazi_development 127.0.0.1 --force
