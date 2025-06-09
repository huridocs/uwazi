#!/bin/bash
set -e

# Enable debug output
set -x

# Check if DBHOST is set
if [ -z "$DBHOST" ]; then
  echo "Error: DBHOST environment variable is not set"
  exit 1
fi

echo "Using MongoDB host: $DBHOST"

# You can edit this array to add more tenants
TENANTS=$(
  cat << 'EOM'
[
  {
    "name": "tenant1",
    "dbName": "uwazi_tenant1",
    "indexName": "uwazi_tenant1",
    "uploadedDocuments": "",
    "attachments": "",
    "customUploads": "",
    "activityLogs": "",
    "featureFlags": {
      "s3Storage": false,
      "esReplicas": 0,
      "sync": false,
      "deactivateTestJob": false,
      "ixExtraSources": false,
      "paragraphExtraction": true
    }
  },
  {
    "name": "tenant2",
    "dbName": "uwazi_tenant2",
    "indexName": "uwazi_tenant2",
    "uploadedDocuments": "",
    "attachments": "",
    "customUploads": "",
    "activityLogs": "",
    "featureFlags": {
      "s3Storage": false,
      "esReplicas": 0,
      "sync": false,
      "deactivateTestJob": false,
      "ixExtraSources": false,
      "paragraphExtraction": true
    }
  },
  {
    "name": "default",
    "dbName": "uwazi_development",
    "indexName": "uwazi_development",
    "uploadedDocuments": "",
    "attachments": "",
    "customUploads": "",
    "activityLogs": "",
    "featureFlags": {
      "s3Storage": false,
      "esReplicas": 0,
      "sync": false,
      "deactivateTestJob": false,
      "ixExtraSources": false,
      "paragraphExtraction": true
    }
  }
]
EOM
)

# Escape the JSON string for JavaScript (e.g., newlines and double quotes)
ESCAPED_JSON=$(jq -Rs . <<< "$TENANTS")

echo "Attempting to connect to MongoDB..."

# Use the MongoDB connection string from environment
mongosh "mongodb://$DBHOST/uwazi_shared_db" --quiet --eval "
const tenants = JSON.parse($ESCAPED_JSON);
tenants.forEach(tenant => {
  db.tenants.updateOne(
    { name: tenant.name },
    { \$set: tenant },
    { upsert: true }
  );
});
print('Tenants upserted successfully.');
"

echo "Script completed with exit code: $?"
