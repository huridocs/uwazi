import { ObjectId, Db } from 'mongodb';
import {
  PasswordRecoveriesDataSource,
  PasswordRecoveryLookup,
  CreateParams,
} from '#api/core/application/contracts/PasswordRecoveriesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { RecoveryKeyNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { PasswordRecoveryDBO } from './PasswordRecoveryDBO.js';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

class MongoPasswordRecoveriesDataSource
  extends MongoDataSource<PasswordRecoveryDBO>
  implements PasswordRecoveriesDataSource
{
  protected collectionName = 'passwordrecoveries';

  constructor(deps: { db: Db; transactionManager: TransactionManager }) {
    super(deps.db, deps.transactionManager);
  }

  async create(params: CreateParams): Promise<void> {
    await this.getCollection<PasswordRecoveryDBO>().insertOne({
      _id: new ObjectId(),
      key: params.key,
      user: ObjectId.createFromHexString(params.userId),
      expiresAt: new Date(Date.now() + ONE_DAY_IN_MS),
    });
  }

  async findByKey(key: string): Promise<ResultType<PasswordRecoveryLookup, RecoveryKeyNotFound>> {
    const record = await this.getCollection<PasswordRecoveryDBO>().findOne({ key });

    if (!record) {
      return Result.fail(new RecoveryKeyNotFound());
    }

    return Result.ok({
      recordId: record._id.toHexString(),
      userId: record.user.toHexString(),
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.getCollection<PasswordRecoveryDBO>().deleteOne({
      _id: ObjectId.createFromHexString(id),
    });
  }
}

export { MongoPasswordRecoveriesDataSource };
