import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { ThesauriSyncHandlerFactory } from './ThesauriSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('dictionaries', () => ThesauriSyncHandlerFactory.default());
}
