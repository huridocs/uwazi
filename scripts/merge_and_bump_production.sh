#!/bin/bash

git checkout production
git pull origin production
git merge origin/staging -X theirs --no-commit --no-ff
yarn version patch
git push origin production
