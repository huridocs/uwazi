-- Migration 001: create_templates_table
-- Create the templates table for V2 core entity definitions

CREATE TABLE IF NOT EXISTS templates (
  "_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "properties" JSONB NOT NULL DEFAULT '[]',
  "commonProperties" JSONB NOT NULL DEFAULT '[]',
  "color" TEXT,
  "default" BOOLEAN NOT NULL DEFAULT false,
  "entityViewPage" TEXT,
  "processing" JSONB,
  "tenant_id" TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS templates_name ON templates ("name", "tenant_id");
CREATE INDEX IF NOT EXISTS templates_tenant_id ON templates ("tenant_id");
CREATE INDEX IF NOT EXISTS templates_default ON templates ("default", "tenant_id") WHERE "default" = true;
