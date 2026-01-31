import { Db } from 'mongodb';
import {
  DefaultTemplateNotFoundError,
  TemplateDoesNotExistError,
} from '../../../domain/template/errors.js';
import { Template } from '../../../domain/template/Template.js';
import { ResultType } from '../../../libs/Result.js';
import { MongoDSOptions } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from './MongoTemplatesDataSource.js';

export class CachedMongoTemplatesDataSource extends MongoTemplatesDataSource {
  private cache = new Map<
    string,
    ResultType<Template, TemplateDoesNotExistError | DefaultTemplateNotFoundError>
  >();

  constructor(db: Db, transactionManager: MongoTransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
    transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  override async getById(id: string) {
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    const result = await super.getById(id);

    if (result.isOk()) {
      this.cache.set(id, result);
    }

    return result;
  }

  override async getDefaultTemplate() {
    const cacheKey = '__default__';

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await super.getDefaultTemplate();

    if (result.isOk()) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }
}
