import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO.js';
import { SlotsReconciler } from '../elasticSearch/entities/SlotsReconciler.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MongoSlotsDAOFactory } from './MongoSlotsDAOFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = { transactionManager?: TransactionManager };

export class SlotsReconcilerFactory {
  static default(overrides?: Overrides): SlotsReconciler {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch) {
      return TestUtils.mockClass<SlotsReconciler>({
        execute: async () => Promise.resolve(),
      });
    }

    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const slotsDAO = MongoSlotsDAOFactory.default({
      transactionManager: overrides?.transactionManager,
    });

    const templatesDAO = new MongoTemplatesDAO({
      db,
      transactionManager: mongoTM,
    });

    const slotsReconciler = new SlotsReconciler({ slotsDAO, templatesDAO });

    return slotsReconciler;
  }
}
