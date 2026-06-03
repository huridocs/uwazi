import pg from 'pg';
import { Db } from 'mongodb';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { ThesaurusRow } from './PostgresThesaurusMapper.js';

class PostgresThesauriDAO extends PostgresDataSource {
  protected tableName = 'thesauri';

  constructor(deps: { pool: pg.Pool; mongoDb: Db }) {
    super({ pool: deps.pool, mongoDb: deps.mongoDb, syncNamespace: 'dictionaries' });
  }

  async get(query?: { _id?: string }): Promise<ThesaurusRow[]> {
    if (query?._id) {
      const result = await this.query<ThesaurusRow>(
        `SELECT * FROM ${this.tableName} WHERE "_id" = $1`,
        [query._id]
      );
      return result.rows;
    }

    const result = await this.query<ThesaurusRow>(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }
}

export { PostgresThesauriDAO };
