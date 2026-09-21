-- Migration 020: create-csv-tables
-- Create CSV v2 staging tables with RLS

CREATE TABLE IF NOT EXISTS csv_imports (
  "_id"           TEXT NOT NULL,
  "tenant_id"     TEXT NOT NULL,
  "template_id"   TEXT NOT NULL,
  "status"        TEXT NOT NULL,
  "created_by"    TEXT NOT NULL,
  "created_at"    BIGINT NOT NULL,
  "updated_at"    BIGINT NOT NULL,
  "files_cleanup" TEXT,
  "file"          JSONB NOT NULL,
  "storage"       JSONB,
  "stats"         JSONB,
  "progress"      JSONB,
  "extraction"    JSONB,
  "failure"       JSONB,
  "row_errors"    JSONB,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS csv_imports_created_at
  ON csv_imports ("tenant_id", "created_at" DESC);

ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_imports
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS csv_import_rows (
  "_id"       TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "import_id" TEXT NOT NULL,
  "row_index" INTEGER NOT NULL,
  "headers"   JSONB NOT NULL,
  "values"    JSONB NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS csv_import_rows_import_id_row_index
  ON csv_import_rows ("tenant_id", "import_id", "row_index");

ALTER TABLE csv_import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_import_rows
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS csv_import_row_errors (
  "_id"       TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "import_id" TEXT NOT NULL,
  "row_index" INTEGER NOT NULL,
  "message"   TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "property"  TEXT,
  "raw_value" TEXT,
  "details"   JSONB,
  "created_at" BIGINT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS csv_import_row_errors_import_id_row_index
  ON csv_import_row_errors ("tenant_id", "import_id", "row_index");

ALTER TABLE csv_import_row_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_import_row_errors
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS csv_import_thesauri_values (
  "_id"            TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "import_id"      TEXT NOT NULL,
  "thesaurus_id"   TEXT NOT NULL,
  "entries"        JSONB NOT NULL,
  "created_at"     BIGINT NOT NULL,
  "applied_at"     BIGINT,
  "applied_values" JSONB,
  "stats"          JSONB,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS csv_import_thesauri_values_import_id_thesaurus_id
  ON csv_import_thesauri_values ("tenant_id", "import_id", "thesaurus_id");

ALTER TABLE csv_import_thesauri_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_import_thesauri_values
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS csv_import_relationships_pending_values (
  "_id"         TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "import_id"   TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "titles"      JSONB NOT NULL,
  "created_at"  BIGINT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS csv_import_relationships_pending_values_import_id_template_id
  ON csv_import_relationships_pending_values ("tenant_id", "import_id", "template_id");

ALTER TABLE csv_import_relationships_pending_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_import_relationships_pending_values
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS csv_import_relationships_values (
  "_id"         TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "import_id"   TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "values"      JSONB NOT NULL,
  "created_at"  BIGINT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS csv_import_relationships_values_import_id_template_id
  ON csv_import_relationships_values ("tenant_id", "import_id", "template_id");

ALTER TABLE csv_import_relationships_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON csv_import_relationships_values
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
