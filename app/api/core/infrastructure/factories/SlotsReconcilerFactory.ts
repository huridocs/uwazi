import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory';

export class SlotsReconcilerFactory {
  static default(transactionManager: MongoTransactionManager): SlotsReconciler {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch) {
      return TestUtils.mockClass<SlotsReconciler>({
        execute: async () => Promise.resolve(),
      });
    }

    const db = getConnection();

    const slotsDAO = MongoSlotsDAOFactory.default(transactionManager);

    const templatesDAO = new MongoTemplatesDAO({
      db,
      transactionManager,
    });

    const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

    return slotsReconciler;
  }
}
