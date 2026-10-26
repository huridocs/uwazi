import { Settings } from '#api/core/domain/settings/Settings.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PostgresSettingsDataSource } from './PostgresSettingsDataSource.js';
import { SettingsRow } from './PostgresSettingsMapper.js';

/**
 * Reads the settings row once and answers every read from it, each still limited to the columns
 * it asks for. Inside a write transaction it reads through, so uncommitted changes are seen; it
 * forgets the row when it writes and when a write transaction commits.
 */
export class CachedPostgresSettingsDataSource extends PostgresSettingsDataSource {
  private row?: Promise<SettingsRow | undefined>;

  private readonly transactionManager: PostgresTransactionManager;

  constructor(deps: ConstructorParameters<typeof PostgresSettingsDataSource>[0]) {
    super(deps);
    this.transactionManager = deps.pgTransactionManager;
    deps.pgTransactionManager.onCommitted(async () => {
      this.row = undefined;
    });
  }

  protected override async readRow(columns?: string[]): Promise<SettingsRow | undefined> {
    if (this.transactionManager.isRunning()) return super.readRow(columns);

    this.row ??= this.readWholeRow().catch(error => {
      this.row = undefined;
      throw error;
    });
    const row = await this.row;
    if (!row || !columns) return row;

    return Object.fromEntries(
      columns
        .filter(column => column in row)
        .map(column => [column, row[column as keyof SettingsRow]])
    ) as SettingsRow;
  }

  /**
   * The whole row in one round trip: every request reads it, so it skips the BEGIN and COMMIT a
   * table read sends. Like a table read, it leaves out `tenant_id` and empty columns.
   */
  private async readWholeRow(): Promise<SettingsRow | undefined> {
    const [row] = await this.transactionManager.readWithoutBindings<Record<string, unknown>>(
      'SELECT * FROM "settings" LIMIT 1;'
    );
    if (!row) return undefined;
    return Object.fromEntries(
      Object.entries(row).filter(([column, value]) => column !== 'tenant_id' && value !== null)
    ) as SettingsRow;
  }

  override async update(settings: Settings): Promise<Settings> {
    this.row = undefined;
    try {
      return await super.update(settings);
    } finally {
      this.row = undefined;
    }
  }
}
