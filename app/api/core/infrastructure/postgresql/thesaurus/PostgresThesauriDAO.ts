import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { ThesaurusRow } from './PostgresThesaurusMapper.js';

class PostgresThesauriDAO extends PostgresDataSource {
  protected tableName = 'thesauri';

  constructor(deps: { tenantId: string }) {
    super({ tenantId: deps.tenantId });
  }

  async get(ids?: string[]): Promise<ThesaurusRow[]> {
    if (ids && ids.length) {
      return this.table.query<ThesaurusRow>().whereIn('_id', ids).all();
    }

    return this.table.query<ThesaurusRow>().all();
  }
}

export { PostgresThesauriDAO };
