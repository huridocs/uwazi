import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: TransactionManager) {
    const db = getConnection();
    const mongoTM = transactionManager as MongoTransactionManager;

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new MongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      slotsReconciler,
    });
  }

  static cached(transactionManager: TransactionManager) {
    const db = getConnection();
    const mongoTM = transactionManager as MongoTransactionManager;

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new CachedMongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      slotsReconciler,
    });
  }

  static forTesting(transactionManager: TransactionManager) {
    const db = getConnection();
    const mongoTM = transactionManager as MongoTransactionManager;

    const slotsReconciler = TestUtils.mockClass<SlotsReconciler>({});

    return new MongoTemplatesDataSource({
      db,
      transactionManager: mongoTM,
      slotsReconciler,
    });
  }
}
