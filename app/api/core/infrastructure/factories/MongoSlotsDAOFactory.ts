import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { TestUtils } from '#api/common.v2/utils/Test.js';

export class MongoSlotsDAOFactory {
  static default(transactionManager: MongoTransactionManager): MongoSlotsDAO {
    const db = getConnection();
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch) {
      return TestUtils.mockClass<MongoSlotsDAO>({
        assignSlot: async () => Promise.resolve(),
        unassignSlot: async () => Promise.resolve(),
        getSentinelVersion: async () => Promise.resolve(0),
        touchSentinel: async () => Promise.resolve(),
        getSlotMap: async () => Promise.resolve(new Map()),
        invalidateCache: () => null,
      });
    }

    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenant.name,
    });

    return slotsDAO;
  }
}
