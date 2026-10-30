import type { Pool } from 'pg';
import type { Readable, Writable } from 'stream';

/** Injectable dependencies, so specs can run against the test admin pool and in-memory streams. */
type TenantBackupDeps = {
  pool?: Pool;
  stdin?: Readable;
  stdout?: Writable;
  stderr?: Writable;
  /** Force progress on/off; defaults to "on only when stderr is a terminal". */
  progress?: boolean;
  reindex?: (tenantId: string) => Promise<void>;
};

export type { TenantBackupDeps };
