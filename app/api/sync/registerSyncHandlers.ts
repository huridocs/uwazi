import { registerTranslationsV2SyncModel } from '#api/core/infrastructure/mongodb/translation/registerTranslationsV2SyncModel.js';
import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { TemplatesSyncHandlerFactory } from './TemplatesSyncHandlerFactory.js';
import { ThesauriSyncHandlerFactory } from './ThesauriSyncHandlerFactory.js';
import { FilesSyncHandlerFactory } from './FilesSyncHandlerFactory.js';
import { RelationshipTypesSyncHandlerFactory } from './RelationshipTypesSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('templates', () => TemplatesSyncHandlerFactory.default());
  SyncHandlerRegistry.register('dictionaries', () => ThesauriSyncHandlerFactory.default());
  SyncHandlerRegistry.register('relationtypes', () =>
    RelationshipTypesSyncHandlerFactory.default()
  );
  SyncHandlerRegistry.register('files', () => FilesSyncHandlerFactory.default());
  registerTranslationsV2SyncModel();
}
