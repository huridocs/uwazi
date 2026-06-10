import { Db } from 'mongodb';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import {
  ThesaurusNameAlreadyExistsError,
  ThesaurusNotFoundError,
} from '#api/core/domain/thesaurus/errors.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresConnectionConfig } from '../common/PostgresTable.js';
import { PostgresThesaurusMapper, ThesaurusRow } from './PostgresThesaurusMapper.js';

export class PostgresThesauriDataSource extends PostgresDataSource implements ThesauriDataSource {
  protected tableName = 'thesauri';

  constructor(deps: { connection: PostgresConnectionConfig; tenantId: string; mongoDb: Db }) {
    super({
      connection: deps.connection,
      tenantId: deps.tenantId,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'dictionaries' },
    });
  }

  async getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>> {
    const row = await this.table.query<ThesaurusRow>().where({ _id: id }).first();

    if (!row) {
      return Result.fail(new ThesaurusNotFoundError(id));
    }

    return Result.ok(PostgresThesaurusMapper.toDomain(row));
  }

  async create(thesaurus: Thesaurus): Promise<void> {
    const dbo = PostgresThesaurusMapper.toDBO(thesaurus);
    await this.table.insert({
      _id: dbo._id,
      name: dbo.name,
      values: JSON.stringify(dbo.values),
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.table.query<ThesaurusRow>().where({ _id: id }).count();
    return count > 0;
  }

  async update(thesaurus: Thesaurus): Promise<void> {
    const dbo = PostgresThesaurusMapper.toDBO(thesaurus);
    await this.table
      .query()
      .where({ _id: dbo._id })
      .update({ name: dbo.name, values: JSON.stringify(dbo.values) });
  }

  async delete(id: string): Promise<void> {
    await this.table.query().where({ _id: id }).delete();
  }

  async exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>> {
    const count = await this.table
      .query<ThesaurusRow>()
      .where({ name: thesaurus.name })
      .whereNot('_id', thesaurus.id)
      .count();

    if (count > 0) {
      return Result.fail(new ThesaurusNameAlreadyExistsError(thesaurus.name));
    }

    return Result.ok(false);
  }
}
