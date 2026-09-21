-- Migration 021: create-jobs-table
-- Postgres job queue table
--
-- No row level security, unlike the tenant tables: queue workers pick jobs across every tenant,
-- so there is no current tenant to filter by. The queue adapter scopes every dispatch-side
-- query by "namespace" instead.
--
-- Columns mirror the Mongo jobs collection. Timestamps are epoch milliseconds, as there.
-- "lockedUntil" stays out of jobs_pick so picks and heartbeats remain HOT updates.

CREATE TABLE IF NOT EXISTS jobs (
  "id"          TEXT    PRIMARY KEY,
  "queue"       TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "namespace"   TEXT    NOT NULL,
  "params"      JSONB   NOT NULL DEFAULT '{}',
  "lockedUntil" BIGINT  NOT NULL DEFAULT 0,
  "createdAt"   BIGINT  NOT NULL,
  "retryCount"  INTEGER NOT NULL DEFAULT 0,
  "failed"      BOOLEAN NOT NULL DEFAULT false,
  "options"     JSONB   NOT NULL
);

CREATE INDEX IF NOT EXISTS jobs_pick
  ON jobs ("queue", "createdAt", "id")
  WHERE "failed" = false;

CREATE INDEX IF NOT EXISTS jobs_namespace_name
  ON jobs ("namespace", "name");

-- Rows are short-lived and constantly rewritten: vacuum after a fixed number of dead rows
-- rather than a fraction of the table.
ALTER TABLE jobs SET (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 1000);
