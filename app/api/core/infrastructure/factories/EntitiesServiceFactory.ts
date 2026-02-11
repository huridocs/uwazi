import { EntitiesService, EntitiesServiceDeps } from '#api/core/application/EntitiesService.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { tenants } from '#api/tenants/index.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { search } from '#api/search/index.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

class EntitiesServiceFactory {
  static default(deps?: Partial<EntitiesServiceDeps>) {
    const transactionManager = deps?.transactionManager ?? TransactionManagerFactory.default();

    const dispatcher =
      deps?.dispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);

    const entitiesDS =
      deps?.entitiesDS ??
      EntitiesDataSourceFactory.default(transactionManager as MongoTransactionManager);

    const entityPermissionChecker =
      deps?.entityPermissionChecker ??
      new MongoEntityPermissionChecker(
        getConnection(),
        transactionManager as MongoTransactionManager
      );

    const eventBus = deps?.eventBus ?? applicationEventsBus;

    const searchInstance = deps?.search ?? search;

    const settingsDS =
      deps?.settingsDS ??
      SettingsDataSourceFactory.default(transactionManager as MongoTransactionManager);

    const templatesDS =
      deps?.templatesDS ??
      TemplatesDataSourceFactory.default(transactionManager as MongoTransactionManager);

    const eventEmitter = deps?.eventEmitter ?? EventEmitterFactory.default();

    return new EntitiesService({
      eventEmitter,
      dispatcher,
      entitiesDS,
      entityPermissionChecker,
      eventBus,
      search: searchInstance,
      settingsDS,
      templatesDS,
      transactionManager,
    });
  }
}

export { EntitiesServiceFactory };
