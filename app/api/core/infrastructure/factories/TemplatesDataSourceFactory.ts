import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { SlotsReconcilerFactory } from './SlotsReconcilerFactory.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new MongoTemplatesDataSource({ db, transactionManager, slotsReconciler });
  }

  static cached(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsReconciler = SlotsReconcilerFactory.default(transactionManager);

    return new CachedMongoTemplatesDataSource({ db, transactionManager, slotsReconciler });
  }
}
