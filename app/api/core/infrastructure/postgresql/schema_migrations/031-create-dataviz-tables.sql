-- Migration 031: create-dataviz-tables
-- Dataviz definitions and their cached render snapshots, with tenant-isolation RLS from the start.

CREATE TABLE IF NOT EXISTS dataviz (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "dataSource" TEXT,
  "query" JSONB NOT NULL,
  "manualData" JSONB,
  "chart" JSONB NOT NULL,
  "appearance" JSONB NOT NULL,
  "refresh" JSONB NOT NULL,
  "processing" JSONB,
  "embedPublic" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,

  PRIMARY KEY ("_id", "tenant_id"),
  UNIQUE ("tenant_id", "name")
);

-- "_id" equals "datavizId": one snapshot per dataviz.
CREATE TABLE IF NOT EXISTS dataviz_snapshots (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "datavizId" TEXT NOT NULL,
  "queryHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "generatedAt" TIMESTAMPTZ NOT NULL,

  PRIMARY KEY ("_id", "tenant_id"),
  UNIQUE ("tenant_id", "datavizId")
);

ALTER TABLE dataviz ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON dataviz
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

ALTER TABLE dataviz_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON dataviz_snapshots
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
