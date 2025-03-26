#!/usr/bin/env bash

COOKIE=$(curl -X POST 'http://localhost:3000/api/login' \
    --silent --fail --show-error \
    -H "Content-Type: application/json" \
    -H 'Accept: application/json' \
    -i \
    -d '{"username":"admin","password":"change this password now"}' \
    | grep -i "set-cookie" | cut -d' ' -f2)

mongosh --quiet uwazi_development --eval "db.px_extractors.deleteMany({})" > /dev/null

# CREATE EXTRACTOR
extractor_data='{
    "targetTemplateId": "67e3d019da479ee9844564fd",
    "sourceTemplateId": "5bfbb1a0471dd0fc16ada146",
    "paragraphPropertyId": "67e3d091da479ee98445662d",
    "paragraphNumberPropertyId": "67e3d091da479ee98445662e",
    "sourceRelationshipTypeId": "67e3d0fdda479ee984456721",
    "targetRelationshipTypeId": "67e3d102da479ee984456735"
}'
extractorId=$(curl -X POST \
    --silent --show-error \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Cookie: ${COOKIE}" \
    -d "$extractor_data" \
    "http://localhost:3000/api/paragraphExtraction/extractor" | jq -r '.extractorId')
    
# TRIGGER EXTRACTION
extraction_data="{
    \"extractorId\": \"$extractorId\",
    \"entitySharedIds\": [\"or350o92t8\"]
}"

echo "Triggering extraction..."

curl -X POST \
    -s \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Cookie: ${COOKIE}" \
    -d "$extraction_data" \
    "http://localhost:3000/api/paragraphExtraction/extract" | jq

echo "Extraction triggered."
