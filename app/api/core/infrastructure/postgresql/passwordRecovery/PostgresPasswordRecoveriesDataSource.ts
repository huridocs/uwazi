import {
  PasswordRecoveriesDataSource,
  PasswordRecoveryLookup,
  CreateParams,
} from '#api/core/application/contracts/PasswordRecoveriesDataSource.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { RecoveryKeyNotFound } from '#api/core/domain/user/errors.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import type { PasswordRecoveryRow } from './PostgresPasswordRecoveryRow.js';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type Deps = PostgresDataSourceDeps & { idGenerator: IdGenerator };

class PostgresPasswordRecoveriesDataSource
  extends PostgresDataSource<PasswordRecoveryRow>
  implements PasswordRecoveriesDataSource
{
  private idGenerator: IdGenerator;

  constructor(deps: Deps) {
    super('password_recoveries', deps);
    this.idGenerator = deps.idGenerator;
  }

  async create(params: CreateParams): Promise<void> {
    await this.table.insert({
      _id: this.idGenerator.generate(),
      key: params.key,
      userId: params.userId,
      expiresAt: new Date(Date.now() + ONE_DAY_IN_MS),
    });
  }

  async findByKey(key: string): Promise<ResultType<PasswordRecoveryLookup, RecoveryKeyNotFound>> {
    const row = await this.table.where({ key }).whereRaw('"expiresAt" > now()').first();

    if (!row) {
      return Result.fail(new RecoveryKeyNotFound());
    }

    return Result.ok({ recordId: row._id, userId: row.userId });
  }

  async deleteById(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}

export { PostgresPasswordRecoveriesDataSource };
