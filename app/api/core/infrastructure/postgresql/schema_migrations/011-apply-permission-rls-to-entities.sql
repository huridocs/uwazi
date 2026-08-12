-- Migration 011: apply permission-level RLS to the entities table
--
-- Calls the shared create_permission_rls_policies function (defined in
-- migration 009) which adds the array columns, creates GIN indexes, attaches
-- the sync trigger, and sets up all four RLS policies.

-- 1. Apply columns, indexes, trigger, and RLS policies via the shared function.
SELECT create_permission_rls_policies('entities');

-- 2. Backfill existing rows (the trigger populates the arrays).
UPDATE entities SET "permissions" = "permissions";
