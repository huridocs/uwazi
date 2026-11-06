-- Migration 043: add-lookup-indexes
-- Add single-column indexes on the columns the DAOs and datasources filter by.
--
-- The existing composite indexes ("tenant_id", <column>) cannot serve as index
-- seeks for these lookups: row-level security applies `tenant_id =
-- current_tenant()` as a filter, not as an index condition, so a query that
-- filters on <column> alone degrades to a full scan (see migration 040, which
-- fixed connections.entity and connections.hub the same way). A direct index
-- on the lookup column restores the seek.
--
-- GIN indexes for JSONB lookups are deliberately out of scope here.

-- entities (005) — sharedId/language/template/title lookups.
CREATE INDEX IF NOT EXISTS entities_sharedid ON entities ("sharedId");
CREATE INDEX IF NOT EXISTS entities_language ON entities ("language");
CREATE INDEX IF NOT EXISTS entities_template ON entities ("template");
CREATE INDEX IF NOT EXISTS entities_title ON entities ("title");

-- files (003) — entity/type/filename lookups.
CREATE INDEX IF NOT EXISTS files_entity ON files ("entity");
CREATE INDEX IF NOT EXISTS files_type ON files ("type");
CREATE INDEX IF NOT EXISTS files_filename ON files ("filename");

-- ix_suggestions (019) — extractor/entity/file lookups.
CREATE INDEX IF NOT EXISTS ix_suggestions_extractorid ON ix_suggestions ("extractorId");
CREATE INDEX IF NOT EXISTS ix_suggestions_entityid ON ix_suggestions ("entityId");
CREATE INDEX IF NOT EXISTS ix_suggestions_fileid ON ix_suggestions ("fileId");

-- translations (015) — language/context lookups.
CREATE INDEX IF NOT EXISTS translations_language ON translations ("language");
CREATE INDEX IF NOT EXISTS translations_context_id ON translations ("context_id");

-- connections (022) — template/file/sharedId lookups (entity/hub done in 040).
CREATE INDEX IF NOT EXISTS connections_template ON connections ("template");
CREATE INDEX IF NOT EXISTS connections_file ON connections ("file");
CREATE INDEX IF NOT EXISTS connections_sharedid ON connections ("sharedId");

-- csv_* (020) — per-import lookups.
CREATE INDEX IF NOT EXISTS csv_import_rows_import_id ON csv_import_rows ("import_id");
CREATE INDEX IF NOT EXISTS csv_import_row_errors_import_id ON csv_import_row_errors ("import_id");
CREATE INDEX IF NOT EXISTS csv_import_thesauri_values_import_id ON csv_import_thesauri_values ("import_id");
CREATE INDEX IF NOT EXISTS csv_import_relationships_pending_values_import_id
  ON csv_import_relationships_pending_values ("import_id");
CREATE INDEX IF NOT EXISTS csv_import_relationships_values_import_id
  ON csv_import_relationships_values ("import_id");

-- px_entities_status (029) — entity/extractor lookups.
CREATE INDEX IF NOT EXISTS px_entities_status_entitysharedid ON px_entities_status ("entitySharedId");
CREATE INDEX IF NOT EXISTS px_entities_status_extractorid ON px_entities_status ("extractorId");

-- ix_models (019) — extractor lookups.
CREATE INDEX IF NOT EXISTS ix_models_extractorid ON ix_models ("extractorId");
