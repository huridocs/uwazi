-- Migration 017: create-settings-table
-- Create settings singleton table with RLS from the start (tenant_id is identity)

CREATE TABLE IF NOT EXISTS settings (
  "tenant_id"                   TEXT NOT NULL PRIMARY KEY,
  "_id"                         TEXT NOT NULL,

  "languages"                   JSONB,
  "links"                       JSONB,
  "filters"                     JSONB,
  "features"                    JSONB,
  "theme_vars"                  JSONB,
  "theme_assets"                JSONB,
  "site_name"                   TEXT,
  "custom_css"                  TEXT,
  "custom_js"                   TEXT,
  "sync"                        JSONB,
  "private"                     BOOLEAN,
  "new_name_generation"         BOOLEAN,
  "open_public_endpoint"        BOOLEAN,
  "allowed_public_templates"    JSONB,
  "public_form_destination"     TEXT,
  "ocr_service_enabled"         BOOLEAN,
  "filter_unauthorized_related" BOOLEAN,
  "project"                     TEXT,
  "custom"                      JSONB,

  "mail"                        JSONB,
  "analytics"                   JSONB,
  "map"                         JSONB,
  "branding"                    JSONB,
  "site_preferences"            JSONB,

  "extras"                      JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON settings
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
