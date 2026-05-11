import { EntitiesService, EntitiesServiceDeps } from '#api/core/application/EntitiesService.js';
import { tenants } from '#api/tenants/index.js';
import { applicationEventsBus, EventsBus } from '#api/core/libs/eventsbus/index.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { EntityAccessPolicyDataSourceFactory } from './EntityAccessPolicyDataSourceFactory.js';

class EntitiesServiceFactory {
  static default(deps?: Partial<EntitiesServiceDeps>) {
    const { transactionManager, eventEmitter, jobsDispatcher } = ExecutionContext;

    return new EntitiesService({
      eventEmitter,
      dispatcher: new DispatcherAdapter(jobsDispatcher),
      entitiesDS: EntitiesDataSourceFactory.default(),
      entityPermissionChecker: new MongoEntityPermissionChecker(
        getConnection(),
        transactionManager as MongoTransactionManager
      ),
      eventBus: applicationEventsBus,
      settingsDS: SettingsDataSourceFactory.default(),
      templatesDS: TemplatesDataSourceFactory.default(),
      transactionManager,
      entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default(),
      ...deps,
    });
  }

  static forTesting(_deps?: Partial<EntitiesServiceDeps>) {
    const transactionManager = TransactionManagerFactory.default();

    const deps: EntitiesServiceDeps = {
      eventEmitter: EventEmitterFactory.forTesting(),
      templatesDS: TemplatesDataSourceFactory.default({ transactionManager }),
      dispatcher: new DispatcherAdapter(
        DefaultDispatcher(tenants.current().name, transactionManager)
      ),
      entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
      entityPermissionChecker: new MongoEntityPermissionChecker(
        getConnection(),
        transactionManager as MongoTransactionManager
      ),
      eventBus: TestUtils.mockClass<EventsBus>({
        clear: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
      }),
      settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      transactionManager,
      entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default(),
      ..._deps,
    };

    return [new EntitiesService(deps), deps] as const;
  }
}

export { EntitiesServiceFactory };
