#!/bin/bash

install_path=${1:-./uwazi-production/}
install_path=${install_path%/}

echo "Building production"
yarn production-build

echo installing into "$install_path"
mkdir -p "$install_path"
mkdir -p "$install_path"/custom_uploads
mkdir -p "$install_path"/log
mkdir -p "$install_path"/temporal_files
mkdir -p "$install_path"/uploaded_documents

echo "Copying app files..."
rm -fr "$install_path"/app
cp -r ./prod/app "$install_path"/app

echo "Copying database files..."
rm -fr "$install_path"/database
cp -r ./prod/database "$install_path"/database

echo "Copying script files..."
rm -fr "$install_path"/scripts
cp -r ./prod/scripts "$install_path"/scripts

echo "Copying node modules..."
rm -fr "$install_path"/node_modules
cp -fr ./prod/node_modules "$install_path"/node_modules

echo "Copying dist files..."
rm -fr "$install_path"/dist
cp -r ./prod/dist "$install_path"/dist

rm -fr "$install_path"/public
cp -r ./prod/public "$install_path"/public

cp ./prod/package.json "$install_path"/package.json
cp ./prod/server.js "$install_path"/server.js
cp ./prod/message.js "$install_path"/message.js

cd "$install_path"
echo "Updating database schema..."
npm run migrate

echo "Reindexing ElasticSearch..."
npm run reindex
