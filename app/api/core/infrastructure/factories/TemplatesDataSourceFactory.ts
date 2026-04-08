import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '../mongodb/template/MongoTemplatesDataSource.js';
import { CachedMongoTemplatesDataSource } from '../mongodb/template/CachedMongoTemplatesDataSource.js';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler.js';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO.js';
import { tenants } from '#api/tenants/index.js';

export class TemplatesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenants.current().name,
    });

    const templatesDAO = new MongoTemplatesDAO({
      db,
      transactionManager,
    });

    const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

    return new MongoTemplatesDataSource({ db, transactionManager, slotsReconciler });
  }

  static cached(transactionManager: MongoTransactionManager) {
    const db = getConnection();

    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenants.current().name,
    });

    const templatesDAO = new MongoTemplatesDAO({
      db,
      transactionManager,
    });

    const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

    return new CachedMongoTemplatesDataSource({ db, transactionManager, slotsReconciler });
  }
}
