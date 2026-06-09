import { Db, ObjectId } from 'mongodb';
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

  private mongoDb: Db;

  private syncNamespace = 'dictionaries';

  constructor(deps: { connection: PostgresConnectionConfig; tenantId: string; mongoDb: Db }) {
    super({ connection: deps.connection, tenantId: deps.tenantId });
    this.mongoDb = deps.mongoDb;
  }

  async getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>> {
    const row = await this.table.findOne<ThesaurusRow>({ _id: id });

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
    await this.writeSyncLog();
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.table.count<ThesaurusRow>({ _id: id });
    return count > 0;
  }

  async update(thesaurus: Thesaurus): Promise<void> {
    const dbo = PostgresThesaurusMapper.toDBO(thesaurus);
    await this.table.update(
      { _id: dbo._id },
      { name: dbo.name, values: JSON.stringify(dbo.values) }
    );
    await this.writeSyncLog();
  }

  async delete(id: string): Promise<void> {
    await this.table.delete({ _id: id });
    await this.writeSyncLog();
  }

  async exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>> {
    const count = await this.table.count<ThesaurusRow>({
      name: thesaurus.name,
      _id: { $ne: thesaurus.id },
    });

    if (count > 0) {
      return Result.fail(new ThesaurusNameAlreadyExistsError(thesaurus.name));
    }

    return Result.ok(false);
  }

  private async writeSyncLog(): Promise<void> {
    await this.mongoDb.collection('updatelogs').insertOne({
      _id: new ObjectId(),
      timestamp: Date.now(),
      namespace: this.syncNamespace,
      mongoId: new ObjectId(),
      deleted: false,
    });
  }
}
