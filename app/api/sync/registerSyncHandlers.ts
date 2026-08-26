import { SyncHandlerRegistry } from './SyncHandlerRegistry.js';
import { EntitiesSyncHandlerFactory } from './EntitiesSyncHandlerFactory.js';
import { TemplatesSyncHandlerFactory } from './TemplatesSyncHandlerFactory.js';
import { ThesauriSyncHandlerFactory } from './ThesauriSyncHandlerFactory.js';
import { FilesSyncHandlerFactory } from './FilesSyncHandlerFactory.js';
import { RelationshipTypesSyncHandlerFactory } from './RelationshipTypesSyncHandlerFactory.js';
import { TranslationsSyncHandlerFactory } from './TranslationsSyncHandlerFactory.js';
import { SettingsSyncHandlerFactory } from './SettingsSyncHandlerFactory.js';

export function registerSyncHandlers(): void {
  SyncHandlerRegistry.register('entities', () => EntitiesSyncHandlerFactory.default());
  SyncHandlerRegistry.register('templates', () => TemplatesSyncHandlerFactory.default());
  SyncHandlerRegistry.register('dictionaries', () => ThesauriSyncHandlerFactory.default());
  SyncHandlerRegistry.register('relationtypes', () =>
    RelationshipTypesSyncHandlerFactory.default()
  );
  SyncHandlerRegistry.register('files', () => FilesSyncHandlerFactory.default());
  SyncHandlerRegistry.register('translationsV2', () => TranslationsSyncHandlerFactory.default());
  SyncHandlerRegistry.register('settings', () => SettingsSyncHandlerFactory.default());
}
