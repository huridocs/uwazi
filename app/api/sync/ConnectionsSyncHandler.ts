import { SyncHandler } from './SyncHandler.js';

export type ConnectionSyncDocument = {
  _id?: string | { toString(): string };
  hub?: string | { toString(): string } | null;
  entity?: string | null;
  template?: string | { toString(): string } | null;
  file?: string | null;
  metadata?: Record<string, unknown>;
  reference?: Record<string, unknown> | null;
  sharedId?: string | { toString(): string } | null;
  filename?: string | null;
  range?: Record<string, unknown> | null;
};

export interface ConnectionsSyncHandler extends SyncHandler<ConnectionSyncDocument> {
  getHubConnections(hubId: string): Promise<ConnectionSyncDocument[]>;
}
