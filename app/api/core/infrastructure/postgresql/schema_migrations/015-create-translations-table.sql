-- Migration 015: create-translations-table
-- Create translations table with RLS from the start (tenant isolation)

CREATE TABLE IF NOT EXISTS translations (
  "_id"           TEXT NOT NULL,
  "language"      TEXT NOT NULL,
  "key"           TEXT NOT NULL,
  "value"         TEXT NOT NULL,
  "context_id"    TEXT NOT NULL,
  "context_type"  TEXT NOT NULL,
  "context_label" TEXT NOT NULL,
  "tenant_id"     TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id"),
  CHECK ("context_type" IN ('Entity', 'Relationship Type', 'Uwazi UI', 'Thesaurus'))
);

CREATE UNIQUE INDEX IF NOT EXISTS translations_natural_key
  ON translations ("tenant_id", "language", "key", "context_id");

CREATE INDEX IF NOT EXISTS translations_tenant_language
  ON translations ("tenant_id", "language");

CREATE INDEX IF NOT EXISTS translations_tenant_context
  ON translations ("tenant_id", "context_id");

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON translations
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
