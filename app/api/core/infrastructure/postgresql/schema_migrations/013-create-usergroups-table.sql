-- Migration 013: create-usergroups-table
-- Create usergroups table for Postgres-backed UserGroups

CREATE TABLE IF NOT EXISTS usergroups (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "members" JSONB NOT NULL DEFAULT '[]',
  PRIMARY KEY ("tenant_id", "_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS usergroups_name
  ON usergroups (LOWER("name"), "tenant_id");

ALTER TABLE usergroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON usergroups
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
