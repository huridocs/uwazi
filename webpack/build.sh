#!/bin/bash

export NODE_ENV=production

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd "$SCRIPTPATH"/../

rm -rf ./prod/*
yarn webpack --config ./webpack.production.config.js --progress --profile --colors
yarn babel -D -d prod/app --extensions .js,.ts,.tsx --ignore **/specs/* app
yarn babel -D -d prod/ message.js
yarn babel -D -d prod/database --extensions .js,.ts,.tsx database

cp ./server.js ./prod/server.js
cp ./run.js ./prod/run.js
cp ./package.json ./prod/package.json
yarn install --production=true --modules-folder=./prod/node_modules
mkdir ./prod/log
mkdir ./prod/uploaded_documents
mkdir ./prod/temporal_files
mkdir ./prod/custom_uploads
cp -r public ./prod
