-- Migration 022: create-connections-table
-- Connections (V1 relationships) table with tenant-isolation RLS from the start.

CREATE TABLE IF NOT EXISTS connections (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "entity" TEXT,
  "hub" TEXT,
  "template" TEXT,
  "file" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "reference" JSONB,
  "sharedId" TEXT,
  "filename" TEXT,
  "range" JSONB,

  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS connections_tenant_id ON connections ("tenant_id");
CREATE INDEX IF NOT EXISTS connections_tenant_entity ON connections ("tenant_id", "entity");
CREATE INDEX IF NOT EXISTS connections_tenant_hub ON connections ("tenant_id", "hub");
CREATE INDEX IF NOT EXISTS connections_tenant_template ON connections ("tenant_id", "template");

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON connections
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
