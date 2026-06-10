import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { DictionariesSyncHandlerFactory } from './DictionariesSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('dictionaries', () => DictionariesSyncHandlerFactory.default());
}
