import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { ElasticSlotsSyncHandler } from './ElasticSlotsSyncHandler.js';
import { DictionariesSyncHandlerFactory } from './DictionariesSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('elasticSlots', () => new ElasticSlotsSyncHandler());
  SyncHandlerRegistry.register('dictionaries', () => DictionariesSyncHandlerFactory.default());
}
