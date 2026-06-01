CREATE TABLE IF NOT EXISTS thesauri (
  "_id"    TEXT PRIMARY KEY,
  "name"   TEXT NOT NULL,
  "values" JSONB NOT NULL DEFAULT '[]'
);

CREATE UNIQUE INDEX IF NOT EXISTS thesauri_name ON thesauri ("name");
