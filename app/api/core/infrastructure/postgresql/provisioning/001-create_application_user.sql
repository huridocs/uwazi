DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app_user';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_database WHERE datname = 'uwazi_development') THEN
    GRANT CONNECT ON DATABASE uwazi_development TO app_user;
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_database WHERE datname = 'uwazi') THEN
    GRANT CONNECT ON DATABASE uwazi TO app_user;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
