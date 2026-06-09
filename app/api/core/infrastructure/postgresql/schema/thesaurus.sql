CREATE TABLE IF NOT EXISTS thesauri (
  "_id"    TEXT NOT NULL,
  "name"   TEXT NOT NULL,
  "values" JSONB NOT NULL DEFAULT '[]',
  "tenant_id" TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS thesauri_name ON thesauri ("name", "tenant_id");

CREATE INDEX IF NOT EXISTS thesauri_tenant_id ON thesauri ("tenant_id");