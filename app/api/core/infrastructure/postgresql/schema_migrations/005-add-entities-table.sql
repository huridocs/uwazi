-- Migration 005: add-entities-table
-- Add entities table

-- Add your schema changes here

CREATE TABLE IF NOT EXISTS entities (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "sharedId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL,
  "generatedToc" BOOLEAN,
  "icon" JSONB NOT NULL DEFAULT '{}',
  "creationDate" BIGINT NOT NULL,
  "editDate" BIGINT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "user" TEXT,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "preview" TEXT,

  PRIMARY KEY ("tenant_id", "_id") 
);


CREATE INDEX IF NOT EXISTS idx_entities_sharedId on entities ("tenant_id", "sharedId");
CREATE INDEX IF NOT EXISTS idx_entities_language on entities ("tenant_id", "language");
CREATE INDEX IF NOT EXISTS idx_entities_template on entities ("tenant_id", "template");
