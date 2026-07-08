import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { TemplatesSyncHandlerFactory } from './TemplatesSyncHandlerFactory.js';
import { ThesauriSyncHandlerFactory } from './ThesauriSyncHandlerFactory.js';
import { FilesSyncHandlerFactory } from './FilesSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('templates', () => TemplatesSyncHandlerFactory.default());
  SyncHandlerRegistry.register('dictionaries', () => ThesauriSyncHandlerFactory.default());
  SyncHandlerRegistry.register('files', () => FilesSyncHandlerFactory.default());
}
