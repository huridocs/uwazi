-- Migration 018: create-ix-tables
-- Create ix_extractors, ix_models and ix_suggestions for information extraction, with RLS
--
-- Columns mirror what the ixextractors, ixmodels and ixsuggestions Mongo collections store:
-- field names as written, nested objects and arrays as JSONB, defaults as Mongo applied them
-- on insert. Additions over Mongo: tenant_id, RLS, the FKs to ix_extractors and the unique keys.

CREATE TABLE IF NOT EXISTS ix_extractors (
  "_id"       TEXT  NOT NULL,
  "tenant_id" TEXT  NOT NULL,
  "name"      TEXT  NOT NULL,
  "property"  TEXT  NOT NULL,
  "source"    JSONB NOT NULL,
  "templates" JSONB NOT NULL DEFAULT '[]',
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS ix_extractors_tenant
  ON ix_extractors ("tenant_id");

ALTER TABLE ix_extractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ix_extractors
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS ix_models (
  "_id"                    TEXT    NOT NULL,
  "tenant_id"              TEXT    NOT NULL,
  "extractorId"            TEXT    NOT NULL,
  "creationDate"           BIGINT,
  "status"                 TEXT    NOT NULL DEFAULT 'processing',
  "findingSuggestions"     BOOLEAN NOT NULL DEFAULT true,
  "maxSuggestionsToFind"   INTEGER,
  "totalSuggestionsToFind" INTEGER,
  "processRun"             JSONB,
  PRIMARY KEY ("_id", "tenant_id"),
  FOREIGN KEY ("extractorId", "tenant_id")
    REFERENCES ix_extractors ("_id", "tenant_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_models_extractor
  ON ix_models ("tenant_id", "extractorId");

ALTER TABLE ix_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ix_models
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS ix_suggestions (
  "_id"                 TEXT    NOT NULL,
  "tenant_id"           TEXT    NOT NULL,
  "extractorId"         TEXT    NOT NULL,
  "entityId"            TEXT    NOT NULL,
  "entityLanguageId"    TEXT,
  "entityTemplate"      TEXT    NOT NULL,
  "entityTitle"         TEXT,
  "fileId"              TEXT,
  "propertyName"        TEXT    NOT NULL,
  "language"            TEXT    NOT NULL,
  "suggestedValue"      JSONB   NOT NULL,
  "suggestedText"       TEXT,
  "currentValue"        JSONB,
  "segment"             TEXT,
  "selectionRectangles" JSONB,
  "status"              TEXT    NOT NULL DEFAULT 'processing',
  "error"               TEXT,
  "date"                BIGINT,
  "state"               JSONB,
  "modelData"           JSONB,
  "useForTraining"      BOOLEAN NOT NULL DEFAULT false,
  "trainingSample"      BOOLEAN,
  PRIMARY KEY ("_id", "tenant_id"),
  FOREIGN KEY ("extractorId", "tenant_id")
    REFERENCES ix_extractors ("_id", "tenant_id") ON DELETE CASCADE
);

-- Text sources: one suggestion per entity and language.
CREATE UNIQUE INDEX IF NOT EXISTS ix_suggestions_text_key
  ON ix_suggestions ("tenant_id", "extractorId", "entityId", "language")
  WHERE "fileId" IS NULL;

-- Pdf sources: one suggestion per file; an entity may have several files in one language.
CREATE UNIQUE INDEX IF NOT EXISTS ix_suggestions_pdf_key
  ON ix_suggestions ("tenant_id", "extractorId", "fileId")
  WHERE "fileId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_suggestions_extractor
  ON ix_suggestions ("tenant_id", "extractorId");

CREATE INDEX IF NOT EXISTS ix_suggestions_entity
  ON ix_suggestions ("tenant_id", "entityId");

CREATE INDEX IF NOT EXISTS ix_suggestions_file
  ON ix_suggestions ("tenant_id", "fileId")
  WHERE "fileId" IS NOT NULL;

ALTER TABLE ix_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ix_suggestions
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
