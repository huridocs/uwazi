import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO.js';
import { tenants } from '#api/tenants/index.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

export class MongoSlotsDAOFactory {
  static default(overrides?: { transactionManager?: TransactionManager }): MongoSlotsDAO {
    const tenant = tenants.current();

    if (!tenant.featureFlags?.v2ElasticSearch) {
      return TestUtils.mockClass<MongoSlotsDAO>({
        assignSlots: async () => Promise.resolve(),
        unassignSlots: async () => Promise.resolve(),
        getSentinelVersion: async () => Promise.resolve(0),
        touchSentinel: async () => Promise.resolve(),
        getSlotMap: async () => Promise.resolve(new Map()),
        invalidateCache: () => null,
        getCollection: () => ({ bulkWrite: async () => ({}) }) as any,
      });
    }

    const db = getConnection();
    const mongoTM = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;

    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager: mongoTM,
      tenantName: tenant.name,
      settingsDS: SettingsDataSourceFactory.cached(overrides),
    });

    return slotsDAO;
  }

  static forTesting() {
    return TestUtils.mockClass<MongoSlotsDAO>({
      assignSlots: jest.fn().mockResolvedValue(undefined),
      unassignSlots: jest.fn().mockResolvedValue(undefined),
      getSentinelVersion: jest.fn().mockResolvedValue(0),
      touchSentinel: jest.fn().mockResolvedValue(undefined),
      getSlotMap: jest.fn().mockResolvedValue(new Map()),
      invalidateCache: jest.fn(),
      transactionManager: TransactionManagerFactory.forTesting() as MongoTransactionManager,
    });
  }
}
