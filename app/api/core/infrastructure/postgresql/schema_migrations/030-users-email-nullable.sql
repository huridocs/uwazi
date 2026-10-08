-- Migration 030: users-email-nullable
-- Allow users without an email: Mongo has many users without one, and they
-- must be migratable without fixing the data first.

ALTER TABLE users ALTER COLUMN "email" DROP NOT NULL;
