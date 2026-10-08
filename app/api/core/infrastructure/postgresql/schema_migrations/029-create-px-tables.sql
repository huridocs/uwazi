-- Migration 029: create-px-tables
-- Paragraph extraction persistence tables with tenant-isolation RLS from the start.

CREATE TABLE IF NOT EXISTS px_extractors (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "sourceTemplateId" TEXT NOT NULL,
  "targetTemplateId" TEXT NOT NULL,
  "paragraphNumberPropertyId" TEXT NOT NULL,
  "paragraphPropertyId" TEXT NOT NULL,
  "sourceRelationshipTypeId" TEXT NOT NULL,
  "targetRelationshipTypeId" TEXT NOT NULL,

  PRIMARY KEY ("_id", "tenant_id"),
  UNIQUE ("tenant_id", "sourceTemplateId")
);

CREATE TABLE IF NOT EXISTS px_entities_status (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "entitySharedId" TEXT NOT NULL,
  "extractorId" TEXT NOT NULL,
  "status" TEXT NOT NULL,

  PRIMARY KEY ("_id", "tenant_id"),
  UNIQUE ("tenant_id", "extractorId", "entitySharedId")
);

CREATE INDEX IF NOT EXISTS px_entities_status_tenant_entity ON px_entities_status ("tenant_id", "entitySharedId");

ALTER TABLE px_extractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON px_extractors
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

ALTER TABLE px_entities_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON px_entities_status
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
