import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

export class MongoSlotsDAOFactory {
  static default(transactionManager: MongoTransactionManager): MongoSlotsDAO {
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

    const db = getConnection();

    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenant.name,
      settingsDS: SettingsDataSourceFactory.cached(transactionManager),
    });

    return slotsDAO;
  }

  static forTesting() {
    return TestUtils.mockClass<MongoSlotsDAO>({
      assignSlot: jest.fn().mockResolvedValue(undefined),
      unassignSlot: jest.fn().mockResolvedValue(undefined),
      getSentinelVersion: jest.fn().mockResolvedValue(0),
      touchSentinel: jest.fn().mockResolvedValue(undefined),
      getSlotMap: jest.fn().mockResolvedValue(new Map()),
      invalidateCache: jest.fn(),
      transactionManager: TransactionManagerFactory.forTesting() as MongoTransactionManager,
    });
  }
}
