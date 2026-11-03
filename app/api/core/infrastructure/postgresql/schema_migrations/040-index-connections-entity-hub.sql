-- Migration 040: index-connections-entity-hub
-- Add single-column indexes on connections.entity and connections.hub.
--
-- The composite indexes (tenant_id, entity) and (tenant_id, hub) cannot be used
-- as index seeks: row-level security applies `tenant_id = current_tenant()` as a
-- filter, not as an index condition, so lookups by entity/hub degrade to full
-- scans. Direct indexes restore index seeks for relationship lookups.

CREATE INDEX IF NOT EXISTS connections_entity ON connections ("entity");
CREATE INDEX IF NOT EXISTS connections_hub ON connections ("hub");
