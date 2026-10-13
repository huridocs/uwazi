-- Migration 033: create-syncs-table
-- Sync cursor per config name

CREATE TABLE IF NOT EXISTS syncs (
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "last_syncs" JSONB NOT NULL DEFAULT '{}',
  "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("tenant_id", "name")
);

ALTER TABLE syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON syncs
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
