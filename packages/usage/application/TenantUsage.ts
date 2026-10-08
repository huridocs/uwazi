import type { FilesByKind } from './FileKind.js';

type FileTypeCounts = { document: number; attachment: number; custom: number; thumbnail: number };

/** What one tenant consumes: its content, its footprint in storage, and when it was last used. */
type TenantUsage = {
  /** Distinct entities: one per sharedId, however many languages it has. */
  entitiesCount: number;
  filesCount: FileTypeCounts;
  filesByBucket: FilesByKind;
  /** Bytes, from the sizes stored with each file; the storage backend is not walked. */
  filesStorage: number;
  /** Bytes, the sum of dbStorageByEngine. */
  dbStorage: number;
  /** Bytes per engine. The PostgreSQL figure is an estimate from the tenant's row sizes. */
  dbStorageByEngine: { mongo: number; postgres: number };
  /** Epoch ms of the latest session activity, accurate to a day; null when there is none. */
  lastSession: number | null;
};

type ContentUsage = Pick<
  TenantUsage,
  'entitiesCount' | 'filesCount' | 'filesByBucket' | 'filesStorage'
>;

export type { ContentUsage, FileTypeCounts, TenantUsage };
