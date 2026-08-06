import { Db, ObjectId } from 'mongodb';
import {
  CaptchaDataSource,
  CaptchaRecord,
} from '#api/core/application/contracts/CaptchaDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { CaptchaDBO } from './CaptchaDBO.js';

class MongoCaptchaDataSource extends MongoDataSource<CaptchaDBO> implements CaptchaDataSource {
  protected collectionName = 'captchas';

  constructor(deps: { db: Db; transactionManager: TransactionManager }) {
    super(deps.db, deps.transactionManager);
  }

  async create(text: string): Promise<{ id: string }> {
    const _id = new ObjectId();
    await this.getCollection<CaptchaDBO>().insertOne({ _id, text, createdAt: new Date() });
    return { id: _id.toHexString() };
  }

  async findById(id: string): Promise<ResultType<CaptchaRecord, CaptchaNotFound>> {
    const captcha = await this.getCollection<CaptchaDBO>().findOne({
      _id: ObjectId.createFromHexString(id),
    });

    if (!captcha) {
      return Result.fail(new CaptchaNotFound(id));
    }

    return Result.ok({ id: captcha._id.toHexString(), text: captcha.text });
  }

  async deleteById(id: string): Promise<void> {
    await this.getCollection<CaptchaDBO>().deleteOne({ _id: ObjectId.createFromHexString(id) });
  }
}

export { MongoCaptchaDataSource };
