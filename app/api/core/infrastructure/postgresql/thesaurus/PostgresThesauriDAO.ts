import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { ThesaurusRow } from './PostgresThesaurusMapper.js';

class PostgresThesauriDAO extends PostgresDataSource<ThesaurusRow> {
  constructor(deps: Pick<PostgresDataSourceDeps, 'tenantId' | 'pgTransactionManager'>) {
    super('thesauri', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async get(ids?: string[]): Promise<ThesaurusRow[]> {
    if (ids && ids.length) {
      return this.table.whereIn('_id', ids).all();
    }

    return this.table.all();
  }
}

export { PostgresThesauriDAO };
