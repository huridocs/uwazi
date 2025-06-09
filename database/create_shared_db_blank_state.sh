#!/bin/bash
set -e

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )
cd "$parent_path" || exit

DB=uwazi_shared_db
HOST=${DBHOST:-127.0.0.1}

AUTH=()
[[ -n "$DBUSER" ]] && AUTH+=("--authenticationDatabase" "admin" "-u" "$DBUSER")
[[ -n "$DBPASS" ]] && AUTH+=("-p" "$DBPASS")

# Drop existing database
mongosh --quiet "${AUTH[@]}" -host "$HOST" "$DB" --eval "db.dropDatabase()"

# Create collections with proper indexes
mongosh --quiet "${AUTH[@]}" -host "$HOST" "$DB" --eval '
    // Create tenants collection with schema validation
    db.createCollection("tenants", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["name"],
                properties: {
                    name: {
                        bsonType: "string",
                        description: "must be a string and is required",
                        minLength: 1
                    }
                }
            }
        }
    });
    
    // Create jobs collection with indexes
    db.createCollection("jobs");
    
    // Create jobs_failed collection with indexes
    db.createCollection("jobs_failed");
    
    // Create indexes for jobs collection
    db.jobs.createIndex({ "queue": 1, "lockedUntil": 1 });
    db.jobs.createIndex({ "namespace": 1 });
    db.jobs.createIndex({ "createdAt": 1 });
    
    // Create indexes for jobs_failed collection
    db.jobs_failed.createIndex({ "queue": 1 });
    db.jobs_failed.createIndex({ "namespace": 1 });
    db.jobs_failed.createIndex({ "createdAt": 1 });
    
    // Create indexes for tenants collection
    db.tenants.createIndex({ "name": 1 }, { unique: true });
    db.tenants.createIndex({ "dbName": 1 });
    db.tenants.createIndex({ "indexName": 1 });
'

# Create dump of the blank state
mongodump -h "$HOST" "${AUTH[@]}" --db="$DB" -o blank_state/ 
