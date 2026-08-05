DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migrator_user') THEN
    CREATE ROLE migrator_user LOGIN PASSWORD 'migrator_user';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_database WHERE datname = 'uwazi_development') THEN
    GRANT CONNECT ON DATABASE uwazi_development TO migrator_user;
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_database WHERE datname = 'uwazi') THEN
    GRANT CONNECT ON DATABASE uwazi TO migrator_user;
  END IF;
END
$$;

GRANT USAGE, CREATE ON SCHEMA public TO migrator_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migrator_user IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migrator_user IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO app_user;
