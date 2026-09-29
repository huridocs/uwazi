-- Migration 024: create-segmentations-table
-- Create segmentations table with RLS

CREATE TABLE IF NOT EXISTS segmentations (
  "_id"            TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "file_id"        TEXT NOT NULL,
  "filename"       TEXT NOT NULL,
  "status"         TEXT NOT NULL,
  "attempt"        INTEGER NOT NULL DEFAULT 0,
  "requested_at"   BIGINT,
  "xml_filename"   TEXT,
  "failure_reason" TEXT,
  "layout"         JSONB,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS segmentations_file_id
  ON segmentations ("tenant_id", "file_id");

CREATE INDEX IF NOT EXISTS segmentations_idle
  ON segmentations ("tenant_id", "_id")
  WHERE "status" = 'idle';

CREATE INDEX IF NOT EXISTS segmentations_status_requested_at
  ON segmentations ("tenant_id", "status", "requested_at");

CREATE INDEX IF NOT EXISTS segmentations_filename
  ON segmentations ("tenant_id", "filename");

CREATE INDEX IF NOT EXISTS segmentations_xml_filename
  ON segmentations ("tenant_id", "xml_filename");

ALTER TABLE segmentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON segmentations
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
