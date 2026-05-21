import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { ElasticSlotsSyncHandler } from './ElasticSlotsSyncHandler.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('elasticSlots', () => new ElasticSlotsSyncHandler());
}
