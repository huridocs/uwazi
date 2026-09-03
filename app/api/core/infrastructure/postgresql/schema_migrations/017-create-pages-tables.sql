-- Migration 017: create-pages-tables
-- Create pages, page_locales and page_releases tables with RLS from the start (tenant isolation)

CREATE TABLE IF NOT EXISTS pages (
  "_id"              TEXT NOT NULL,
  "shared_id"        TEXT NOT NULL,
  "creation_date"    BIGINT,
  "entity_view"      BOOLEAN NOT NULL DEFAULT false,
  "markdown_support" BOOLEAN NOT NULL DEFAULT false,
  "tenant_id"        TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS pages_shared_id
  ON pages ("shared_id", "tenant_id");

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON pages
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS page_locales (
  "page_id"       TEXT NOT NULL,
  "language"      TEXT NOT NULL,
  "title"         TEXT NOT NULL DEFAULT '',
  "draft_content" TEXT NOT NULL DEFAULT '',
  "draft_script"  TEXT NOT NULL DEFAULT '',
  "draft_css"     TEXT NOT NULL DEFAULT '',
  "tenant_id"     TEXT NOT NULL,
  PRIMARY KEY ("page_id", "language", "tenant_id")
);

CREATE INDEX IF NOT EXISTS page_locales_language
  ON page_locales ("tenant_id", "language");

ALTER TABLE page_locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON page_locales
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE TABLE IF NOT EXISTS page_releases (
  "_id"             TEXT NOT NULL,
  "page_id"         TEXT NOT NULL,
  "version"         INTEGER NOT NULL,
  "release_message" TEXT NOT NULL,
  "user_id"         TEXT,
  "date"            BIGINT NOT NULL,
  "locales"         JSONB NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  PRIMARY KEY ("_id", "tenant_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS page_releases_version
  ON page_releases ("page_id", "version", "tenant_id");

ALTER TABLE page_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON page_releases
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
