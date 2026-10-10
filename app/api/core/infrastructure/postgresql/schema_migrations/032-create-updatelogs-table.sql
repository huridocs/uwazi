-- Migration 032: create-updatelogs-table
-- Sync change log. One row per document id, same upsert key as the Mongo collection.

CREATE TABLE IF NOT EXISTS updatelogs (
  "tenant_id"  TEXT NOT NULL,
  "id"         TEXT NOT NULL,
  "namespace"  TEXT NOT NULL,
  "timestamp"  BIGINT NOT NULL,
  "deleted"    BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY ("tenant_id", "id")
);

CREATE INDEX IF NOT EXISTS updatelogs_namespace_timestamp
  ON updatelogs ("tenant_id", "namespace", "timestamp");

ALTER TABLE updatelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON updatelogs
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
