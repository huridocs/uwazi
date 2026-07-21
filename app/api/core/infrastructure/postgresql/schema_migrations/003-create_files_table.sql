-- Migration 003: create_files_table
-- Create the files table for V2 core file storage

CREATE TABLE IF NOT EXISTS files (
  "_id"                 TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "originalname"        TEXT NOT NULL,
  "filename"            TEXT NOT NULL,
  "mimetype"            TEXT NOT NULL,
  "size"                INTEGER NOT NULL DEFAULT 0,
  "creationDate"       BIGINT NOT NULL DEFAULT 0,
  "type"                TEXT NOT NULL,
  "entity"              TEXT,
  "status"              TEXT,
  "totalPages"         INTEGER,
  "language"            TEXT,
  "generatedToc"       BOOLEAN,
  "url"                 TEXT,
  "toc"                 JSONB,
  "propertySelections" JSONB,
  "fullText"           JSONB,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS files_filename_unique
  ON files ("tenant_id", "filename");

CREATE INDEX IF NOT EXISTS files_entity_type_status
  ON files ("tenant_id", "entity", "type", "status");

CREATE INDEX IF NOT EXISTS files_type_language
  ON files ("tenant_id", "type", "language");
