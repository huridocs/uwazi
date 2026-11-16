-- Migration 044: create-archived-tenants-table
-- The archived tenant registry: the snapshot `uwazi tenants archive` writes, moved between
-- `tenants` and this table by the CLI. Like `tenants`, it has no tenant column and no row level
-- security: the registry sits above every tenant. Column names mirror the Mongo `archives`
-- collection. The snapshot drops analytics, maintenance and operational data, so there is no
-- `extras`: only the archived fields are kept.

CREATE TABLE IF NOT EXISTS archived_tenants (
  "name"              TEXT PRIMARY KEY CHECK ("name" <> ''),
  "dbName"            TEXT,
  "indexName"         TEXT,
  "uploadedDocuments" TEXT,
  "attachments"       TEXT,
  "customUploads"     TEXT,
  "activityLogs"      TEXT,
  "featureFlags"      JSONB,
  "status"            TEXT,
  "dumpLocation"      JSONB,
  "archivedAt"        BIGINT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
