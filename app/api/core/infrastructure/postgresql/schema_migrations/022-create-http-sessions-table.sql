-- Migration 022: create-http-sessions-table
-- Express session store, same shape as connect-mongo: sid, sess, expire.
-- No tenant column and no row level security. The tenant stays inside sess
-- (passport.user = id///tenant). connect-pg-simple owns the queries.

CREATE TABLE IF NOT EXISTS http_sessions (
  sid varchar NOT NULL,
  sess jsonb NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT http_sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS http_sessions_expire ON http_sessions (expire);
