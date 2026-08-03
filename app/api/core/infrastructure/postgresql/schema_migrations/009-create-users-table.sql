-- Migration 009: create-users-table
-- Postgres-backed users table, starting with the two-factor authentication
-- fields (using2fa, secret) behind the postgresUsers feature flag


CREATE TABLE IF NOT EXISTS users (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "failedLogins" INTEGER,
  "accountLocked" BOOLEAN,
  "accountUnlockCode" TEXT,
  "using2fa" BOOLEAN NOT NULL DEFAULT false,
  "secret" TEXT,
  "deletedAt" TIMESTAMPTZ,
  PRIMARY KEY ("tenant_id", "_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username
  ON users ("username", "tenant_id")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email
  ON users ("email", "tenant_id")
  WHERE "deletedAt" IS NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
