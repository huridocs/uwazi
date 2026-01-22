import { EntitiesService, EntitiesServiceDeps } from 'api/core/application/EntitiesService';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { search } from 'api/search';
import { TransactionManagerFactory } from './TransactionManagerFactory';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory';

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

    return new EntitiesService({
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
