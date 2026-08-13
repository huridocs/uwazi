-- Migration 015: index usergroups.members for containment lookups
-- Supports the users<->usergroups join in PostgresUsersDAO.findWithGroups (D7):
-- `members @> to_jsonb(users."_id")`. jsonb_path_ops rather than the default operator
-- class -- smaller index, and `@>` is the only operator used against this column.

CREATE INDEX IF NOT EXISTS usergroups_members_gin
  ON usergroups USING GIN ("members" jsonb_path_ops);
