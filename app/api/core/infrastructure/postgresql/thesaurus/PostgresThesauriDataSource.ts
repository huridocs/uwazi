import { Db } from 'mongodb';
import pg from 'pg';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import {
  ThesaurusNameAlreadyExistsError,
  ThesaurusNotFoundError,
} from '#api/core/domain/thesaurus/errors.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresThesaurusMapper, ThesaurusRow } from './PostgresThesaurusMapper.js';

export class PostgresThesauriDataSource extends PostgresDataSource implements ThesauriDataSource {
  protected tableName = 'thesauri';

  constructor(deps: { pool: pg.Pool; mongoDb: Db }) {
    super({ pool: deps.pool, mongoDb: deps.mongoDb, syncNamespace: 'dictionaries' });
  }

  async getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>> {
    const result = await this.query<ThesaurusRow>(
      `SELECT * FROM ${this.tableName} WHERE "_id" = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return Result.fail(new ThesaurusNotFoundError(id));
    }

    return Result.ok(PostgresThesaurusMapper.toDomain(result.rows[0]));
  }

  async create(thesaurus: Thesaurus): Promise<void> {
    const dbo = PostgresThesaurusMapper.toDBO(thesaurus);

    await this.execute(
      `INSERT INTO ${this.tableName} ("_id", "name", "values") VALUES ($1, $2, $3)`,
      [dbo._id, dbo.name, JSON.stringify(dbo.values)]
    );
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE "_id" = $1) AS exists`,
      [id]
    );
    return result.rows[0].exists;
  }

  async update(thesaurus: Thesaurus): Promise<void> {
    const dbo = PostgresThesaurusMapper.toDBO(thesaurus);

    await this.execute(`UPDATE ${this.tableName} SET "name" = $2, "values" = $3 WHERE "_id" = $1`, [
      dbo._id,
      dbo.name,
      JSON.stringify(dbo.values),
    ]);
  }

  async exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${this.tableName} WHERE "name" = $1 AND "_id" != $2`,
      [thesaurus.name, thesaurus.id]
    );

    if (parseInt(result.rows[0].count, 10) > 0) {
      return Result.fail(new ThesaurusNameAlreadyExistsError(thesaurus.name));
    }

    return Result.ok(false);
  }
}
