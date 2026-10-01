-- Migration 025: create-tenants-table
-- The tenant registry: which tenants exist and how to reach their database, index and files.
-- No tenant column and no row level security: the registry sits above every tenant.
-- Column names mirror the Mongo tenants collection.
-- "extras" holds the top level keys other tools stored on the row that uwazi does not declare,
-- so a copy from Mongo loses nothing.
-- "dbName" and "indexName" are unique: two tenants sharing a database or an index would read and
-- write each other's data.

CREATE TABLE IF NOT EXISTS tenants (
  "name"              TEXT PRIMARY KEY CHECK ("name" <> ''),
  "dbName"            TEXT NOT NULL,
  "indexName"         TEXT NOT NULL,
  "uploadedDocuments" TEXT NOT NULL,
  "attachments"       TEXT NOT NULL,
  "customUploads"     TEXT NOT NULL,
  "activityLogs"      TEXT NOT NULL,
  "domain"            TEXT,
  "featureFlags"      JSONB NOT NULL DEFAULT '{}',
  "globalMatomo"      JSONB,
  "ciMatomoActive"    BOOLEAN,
  "maintenance"       BOOLEAN,
  "stats"             JSONB,
  "healthChecks"      JSONB,
  "metadata"          JSONB,
  "extras"            JSONB NOT NULL DEFAULT '{}',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_db_name ON tenants ("dbName");
CREATE UNIQUE INDEX IF NOT EXISTS tenants_index_name ON tenants ("indexName");
