-- Migration 007: create-password-recoveries-table
-- Postgres-backed password recovery records (postgresPasswordRecoveries flag)

-- Replaces the Mongo `passwordrecoveries` collection behind the
-- postgresPasswordRecoveries feature flag (see plans/003). RLS is enabled
-- here, at creation time, not as a follow-up (see plans/001).

CREATE TABLE IF NOT EXISTS password_recoveries (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("tenant_id", "_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS password_recoveries_key
  ON password_recoveries ("key", "tenant_id");

CREATE INDEX IF NOT EXISTS password_recoveries_expires_at
  ON password_recoveries ("expiresAt");

ALTER TABLE password_recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON password_recoveries
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
