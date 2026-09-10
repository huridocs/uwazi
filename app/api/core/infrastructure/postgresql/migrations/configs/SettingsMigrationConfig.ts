import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { PostgresSettingsMapper } from '../../settings/PostgresSettingsMapper.js';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const SettingsMigrationConfig: MigrationConfig = {
  mongoCollection: 'settings',
  pgTable: 'settings',
  mapDocument(doc: Record<string, unknown>) {
    return PostgresSettingsMapper.toRow(doc as SettingsType);
  },
  assertDocumentCount(count: number) {
    if (count !== 1) {
      throw new Error(`Tenant must have exactly one settings document in Mongo (found ${count})`);
    }
  },
};
