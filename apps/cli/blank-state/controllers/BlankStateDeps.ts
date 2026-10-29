import type { Pool } from 'pg';

/** Injectable dependencies, so specs run against a temp dump file and the test admin pool. */
type BlankStateDeps = {
  pool?: Pool;
  dumpFile?: string;
  reindex?: (tenantId: string) => Promise<void>;
};

export type { BlankStateDeps };
