import type {
  SettingsDocument,
  SettingsDocumentQueryService,
} from '../../settings/SettingsDocumentQueryService.js';
import { toPersistableSettingsFields } from '../../settings/persistableSettingsFields.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresSettingsMapper, SettingsRow } from './PostgresSettingsMapper.js';

/** Extends PostgresDataSource only for its tenant-scoped table; it never writes. */
class PostgresSettingsDocumentQueryService
  extends PostgresDataSource<SettingsRow>
  implements SettingsDocumentQueryService
{
  constructor(deps: PostgresDataSourceDeps) {
    super('settings', deps);
  }

  async get(): Promise<SettingsDocument | undefined> {
    const row = await this.table.first();
    if (!row) {
      return undefined;
    }
    const settings = toPersistableSettingsFields(PostgresSettingsMapper.toSettings(row));
    return JSON.parse(JSON.stringify(settings));
  }
}

export { PostgresSettingsDocumentQueryService };
