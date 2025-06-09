#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )
cd "$parent_path" || exit

DB=${1:-${DATABASE_NAME:-uwazi_shared_db}}
HOST=${2:-${DBHOST:-127.0.0.1}}

AUTH=()
[[ -n "$DBUSER" ]] && AUTH+=("--authenticationDatabase" "admin" "-u" "$DBUSER")
[[ -n "$DBPASS" ]] && AUTH+=("-p" "$DBPASS")

echo "Creating indexes for database: $DB"

# Create indexes for jobs collection
echo "Creating indexes for jobs collection..."
mongosh --quiet "${AUTH[@]}" -host "$HOST" "$DB" --eval '
    // Create indexes for jobs collection if they don't exist
    if (!db.jobs.getIndexes().some(index => index.name === "queue_1_lockedUntil_1")) {
        db.jobs.createIndex({ "queue": 1, "lockedUntil": 1 }, { background: true });
        print("Created index: queue_1_lockedUntil_1");
    }
    if (!db.jobs.getIndexes().some(index => index.name === "namespace_1")) {
        db.jobs.createIndex({ "namespace": 1 }, { background: true });
        print("Created index: namespace_1");
    }
    if (!db.jobs.getIndexes().some(index => index.name === "createdAt_1")) {
        db.jobs.createIndex({ "createdAt": 1 }, { background: true });
        print("Created index: createdAt_1");
    }
'

# Create indexes for jobs_failed collection
echo "Creating indexes for jobs_failed collection..."
mongosh --quiet "${AUTH[@]}" -host "$HOST" "$DB" --eval '
    // Create indexes for jobs_failed collection if they don't exist
    if (!db.jobs_failed.getIndexes().some(index => index.name === "queue_1")) {
        db.jobs_failed.createIndex({ "queue": 1 }, { background: true });
        print("Created index: queue_1");
    }
    if (!db.jobs_failed.getIndexes().some(index => index.name === "namespace_1")) {
        db.jobs_failed.createIndex({ "namespace": 1 }, { background: true });
        print("Created index: namespace_1");
    }
    if (!db.jobs_failed.getIndexes().some(index => index.name === "createdAt_1")) {
        db.jobs_failed.createIndex({ "createdAt": 1 }, { background: true });
        print("Created index: createdAt_1");
    }
'

# Create indexes for tenants collection
echo "Creating indexes for tenants collection..."
mongosh --quiet "${AUTH[@]}" -host "$HOST" "$DB" --eval '
    // Create indexes for tenants collection if they don't exist
    if (!db.tenants.getIndexes().some(index => index.name === "name_1")) {
        db.tenants.createIndex({ "name": 1 }, { unique: true, background: true });
        print("Created index: name_1");
    }
    if (!db.tenants.getIndexes().some(index => index.name === "dbName_1")) {
        db.tenants.createIndex({ "dbName": 1 }, { background: true });
        print("Created index: dbName_1");
    }
    if (!db.tenants.getIndexes().some(index => index.name === "indexName_1")) {
        db.tenants.createIndex({ "indexName": 1 }, { background: true });
        print("Created index: indexName_1");
    }
'

echo "Index creation completed!" 