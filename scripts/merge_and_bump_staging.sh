#!/bin/bash

git checkout staging
git pull origin staging
git merge origin/development -X theirs --no-commit --no-ff
yarn version
git push origin staging
