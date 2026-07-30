-- Migration 006: create_relationship_types_table
-- Create relationship_types table with RLS from the start (tenant isolation)

CREATE TABLE IF NOT EXISTS relationship_types (
  "_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS relationship_types_tenant_id ON relationship_types ("tenant_id");

ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON relationship_types
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
