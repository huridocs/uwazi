import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new MongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
    });
  }

  static cached(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new CachedMongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
    });
  }

  static forTesting(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = TestUtils.mockClass<SlotsReconciler>({});

    return new MongoTemplatesDataSource({
      db,
      transactionManager,
      slotsReconciler,
    });
  }
}
