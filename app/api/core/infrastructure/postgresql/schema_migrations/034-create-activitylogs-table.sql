-- Migration 034: create-activitylogs-table
-- Activity log entries: one row per logged API request.
--
-- params, query and body hold the request's JSON as text, exactly as it was sent: the log's
-- filters match on how that text starts, which JSONB would not preserve. They are nullable
-- because entries copied from MongoDB may lack them.

CREATE TABLE IF NOT EXISTS activitylogs (
  "_id"        TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "method"     TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "params"     TEXT,
  "query"      TEXT,
  "body"       TEXT,
  "user_id"    TEXT,
  "username"   TEXT,
  "time"       BIGINT NOT NULL,
  PRIMARY KEY ("tenant_id", "_id")
);

CREATE INDEX IF NOT EXISTS activitylogs_tenant_time
  ON activitylogs ("tenant_id", "time" DESC, "_id" DESC);

ALTER TABLE activitylogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON activitylogs
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
