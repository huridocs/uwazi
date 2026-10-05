-- Migration 027: create-ocr-records-table
-- Create ocr_records table with RLS

CREATE TABLE IF NOT EXISTS ocr_records (
  "_id"            TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "source_file_id" TEXT,
  "result_file_id" TEXT,
  "filename"       TEXT NOT NULL,
  "language"       TEXT NOT NULL,
  "status"         TEXT NOT NULL,
  "attempt"        INTEGER NOT NULL DEFAULT 0,
  "requested_at"   BIGINT,
  "last_updated"   BIGINT NOT NULL,
  "failure_reason" TEXT,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS ocr_records_source_file_id
  ON ocr_records ("tenant_id", "source_file_id")
  WHERE "source_file_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS ocr_records_result_file_id
  ON ocr_records ("tenant_id", "result_file_id");

CREATE INDEX IF NOT EXISTS ocr_records_filename
  ON ocr_records ("tenant_id", "filename");

ALTER TABLE ocr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ocr_records
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
