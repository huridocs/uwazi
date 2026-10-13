import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { ThesaurusRow } from './PostgresThesaurusMapper.js';

class PostgresThesauriDAO extends PostgresDataSource<ThesaurusRow> {
  constructor(
    deps: Pick<PostgresDataSourceDeps, 'tenantId' | 'pgTransactionManager' | 'accessContext'>
  ) {
    super('thesauri', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      accessContext: deps.accessContext,
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
