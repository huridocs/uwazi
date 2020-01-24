#!/bin/bash

# Check for merge conflicts

# Tested on Linux and Mac

# Simple check for merge conflics
conflicts=$(git diff --cached --name-only -G"<<<<<|=====|>>>>>")


# Something went wrong
if [ -z !${conflicts} ]; then
    echo
    echo "Unresolved merge conflicts in these files:"

    for c in ${conflicts}; do
        echo ${c}
    done;

    exit 1;
fi

exit 0
