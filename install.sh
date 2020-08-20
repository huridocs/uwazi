#!/bin/bash

install_path=${1:-./uwazi-production/}
install_path=${install_path%/}

echo "Building production"
yarn production-build

echo installing into $install_path
mkdir -p $install_path
mkdir -p $install_path/custom_uploads
mkdir -p $install_path/log
mkdir -p $install_path/temporal_files
mkdir -p $install_path/uploaded_documents

echo "Copy app files..."
rm -fr $install_path/app
cp -r ./prod/app $install_path/app

echo "Copy database files..."
rm -fr $install_path/database
cp -r ./prod/database $install_path/database

echo "Copy node modules..."
rm -fr $install_path/node_modules
cp -fr ./prod/node_modules $install_path/node_modules

echo "Copy dist files..."
rm -fr $install_path/dist
cp -r ./prod/dist $install_path/dist

rm -fr $install_path/public
cp -r ./prod/public $install_path/public

cp ./prod/package.json $install_path/package.json
cp ./prod/run.js $install_path/run.js
cp ./prod/server.js $install_path/server.js
cp ./prod/message.js $install_path/message.js

cd $install_path
echo "Updating database schema..."
node ./run.js ./app/api/migrations/migrate.js

echo "Reindexing ElasticSearch..."
node ./run.js ./database/reindex_elastic.js
