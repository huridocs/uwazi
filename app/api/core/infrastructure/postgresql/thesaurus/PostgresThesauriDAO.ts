import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresConnectionConfig } from '../common/PostgresTable.js';
import { ThesaurusRow } from './PostgresThesaurusMapper.js';

class PostgresThesauriDAO extends PostgresDataSource {
  protected tableName = 'thesauri';

  constructor(deps: { connection: PostgresConnectionConfig; tenantId: string }) {
    super({ connection: deps.connection, tenantId: deps.tenantId });
  }

  async get(ids?: string[]): Promise<ThesaurusRow[]> {
    if (ids && ids.length) {
      return this.table.findAll<ThesaurusRow>({ _id: { $in: ids } });
    }

    return this.table.findAll<ThesaurusRow>();
  }
}

export { PostgresThesauriDAO };
