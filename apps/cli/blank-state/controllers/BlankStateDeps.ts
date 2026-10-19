import type { Pool } from 'pg';

/** Injectable dependencies, so specs run against a temp dir and the test admin pool. */
type BlankStateDeps = {
  pool?: Pool;
  dataDir?: string;
  format?: (dataDir: string, tables: string[]) => Promise<void>;
};

export type { BlankStateDeps };
