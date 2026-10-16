-- Migration 035: create-preserve-sync-table
-- Preserve integration cursor. One row per token, looked up by that token.
-- last_import stays text: it is sent back to Preserve as a date filter.

CREATE TABLE IF NOT EXISTS preserve_sync (
  "tenant_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "last_import" TEXT NOT NULL,
  PRIMARY KEY ("tenant_id", "token")
);

ALTER TABLE preserve_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON preserve_sync
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
