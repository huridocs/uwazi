CREATE TABLE IF NOT EXISTS entities (
  "_id"              TEXT PRIMARY KEY,
  "sharedId"         TEXT NOT NULL,
  "language"         TEXT NOT NULL,
  "templateId"       TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "published"        BOOLEAN NOT NULL DEFAULT false,
  "creationDate"     BIGINT NOT NULL,
  "editDate"         BIGINT NOT NULL,
  "userId"           TEXT,
  "mongoLanguage"    TEXT,
  "generatedToc"     BOOLEAN,
  "preview"          TEXT,
  "__v"              INTEGER,
  "icon"             JSONB,
  "metadata"         JSONB NOT NULL DEFAULT '{}',
  "obsoleteMetadata" JSONB NOT NULL DEFAULT '[]',
  "permissions"      JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS entities_sharedId      ON entities ("sharedId");
CREATE INDEX IF NOT EXISTS entities_templateId    ON entities ("templateId");
CREATE INDEX IF NOT EXISTS entities_language      ON entities ("language");
CREATE INDEX IF NOT EXISTS entities_sharedId_lang ON entities ("sharedId", "language");
CREATE INDEX IF NOT EXISTS entities_metadata_gin  ON entities USING GIN (metadata);
CREATE INDEX IF NOT EXISTS entities_perms_gin     ON entities USING GIN (permissions);
