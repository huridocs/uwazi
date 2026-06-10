import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { ElasticSlotsSyncHandler } from './ElasticSlotsSyncHandler.js';
import { ThesauriSyncHandlerFactory } from './ThesauriSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('elasticSlots', () => new ElasticSlotsSyncHandler());
  SyncHandlerRegistry.register('dictionaries', () => ThesauriSyncHandlerFactory.default());
}
