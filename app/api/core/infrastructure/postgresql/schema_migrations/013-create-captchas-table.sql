-- Migration 013: create-captchas-table
-- Creates the captchas table (postgresCaptchas flag)

-- Replaces the Mongo `captchas` collection behind the postgresCaptchas feature flag.
-- Mongo relies on a TTL index (migration 201-captchas-ttl-index) for 10h expiry;
-- Postgres has no equivalent, so expiry is enforced by filtering on "expiresAt" in
-- PostgresCaptchaDataSource and reaped by CleanupExpiredCaptchasJob.

CREATE TABLE IF NOT EXISTS captchas (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("tenant_id", "_id")
);

CREATE INDEX IF NOT EXISTS captchas_expires_at
  ON captchas ("expiresAt");

ALTER TABLE captchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON captchas
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
