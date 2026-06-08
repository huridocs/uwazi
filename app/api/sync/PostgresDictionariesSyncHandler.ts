import pg from 'pg';
import { Db } from 'mongodb';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { SyncHandler } from './SyncHandler.js';

type ThesaurusRow = {
  _id: string;
  name: string;
  values: { id: string; label: string; values?: { id: string; label: string }[] }[];
};

const buildUpsert = (
  tableName: string,
  id: string,
  data: Record<string, unknown>
): { sql: string; params: unknown[] } => {
  const keys = Object.keys(data);
  const columns = keys.map(k => `"${k}"`);
  const placeholders = keys.map((_, i) => `$${i + 2}`);
  const setClauses = keys.map((_, i) => `"${keys[i]}" = $${i + 2}`);

  const params: unknown[] = [id];
  for (const key of keys) {
    const val = data[key];
    params.push(
      Array.isArray(val) || (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
    );
  }

  return {
    sql: `INSERT INTO ${tableName} ("_id", ${columns.join(', ')}) VALUES ($1, ${placeholders.join(', ')})
          ON CONFLICT ("_id") DO UPDATE SET ${setClauses.join(', ')}`,
    params,
  };
};

export class PostgresDictionariesSyncHandler
  extends PostgresDataSource
  implements SyncHandler<ThesaurusRow>
{
  protected tableName = 'thesauri';

  constructor(pool: pg.Pool, mongoDb: Db) {
    super({ pool, mongoDb, syncNamespace: 'dictionaries' });
  }

  async getById(id: string): Promise<ThesaurusRow | null> {
    const result = await this.query<ThesaurusRow>(
      `SELECT * FROM ${this.tableName} WHERE "_id" = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async save(document: Partial<ThesaurusRow>): Promise<ThesaurusRow> {
    const { _id: rawId, ...rest } = document as ThesaurusRow;
    if (!rawId) throw new Error('PostgresDictionariesSyncHandler: document._id is required');
    const id = rawId.toString();

    const { sql, params } = buildUpsert(this.tableName, id, rest as Record<string, unknown>);
    await this.query(sql, params);

    const result = await this.query<ThesaurusRow>(
      `SELECT * FROM ${this.tableName} WHERE "_id" = $1`,
      [id]
    );
    return result.rows[0];
  }

  async saveMultiple(documents: Partial<ThesaurusRow>[]): Promise<ThesaurusRow[]> {
    if (documents.length === 0) return [];

    for (const doc of documents) {
      //eslint-disable-next-line no-await-in-loop
      await this.save(doc);
    }

    const ids = documents.map(doc => {
      const rawId = (doc as ThesaurusRow)._id;
      if (!rawId) throw new Error('PostgresDictionariesSyncHandler: document._id is required');
      return rawId.toString();
    });

    const result = await this.query<ThesaurusRow>(
      `SELECT * FROM ${this.tableName} WHERE "_id" = ANY($1)`,
      [ids]
    );
    return result.rows;
  }

  async delete(id: string): Promise<void> {
    await this.query(`DELETE FROM ${this.tableName} WHERE "_id" = $1`, [id]);
  }
}
