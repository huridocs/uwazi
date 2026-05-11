import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  EntityIndexerService,
  EntityIndexerServiceDeps,
} from '../elasticSearch/entities/EntityIndexerService.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoSlotsDAO } from '../elasticSearch/entities/MongoSlotsDAO.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { EntityESWriterFactory } from './EntityESWriterFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';

export class EntityIndexerServiceFactory {
  static default(overrides?: Partial<EntityIndexerServiceDeps>): EntityIndexerService {
    const { tenant } = ExecutionContext;

    const db = getConnection();
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    const settingsDS = SettingsDataSourceFactory.default();
    const entityDAO = new MongoEntityDAO(
      db,
      transactionManager,
      ExecutionContext.actor || User.createFrom(null)
    );
    const slotsDAO = new MongoSlotsDAO({
      db,
      transactionManager,
      tenantName: tenant.name,
      settingsDS,
    });

    const writer = EntityESWriterFactory.default();

    const entityESWriter = new EntityIndexerService({ entityDAO, slotsDAO, writer, ...overrides });

    return entityESWriter;
  }

  static forTests(): EntityIndexerService {
    return TestUtils.mockClass<EntityIndexerService>({
      index: jest.fn(),
      sync: jest.fn(),
      syncAll: jest.fn(),
      remove: jest.fn(),
      removeByTemplateIds: jest.fn(),
    });
  }
}
