import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';

class AddLanguageUseCaseFactory {
  static create(): AddLanguageUseCase {
    const tenant = tenants.current();
    const transactionManager = DependenciesContext.transactionManager as MongoTransactionManager;
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const eventEmitter = EventEmitterFactory.default();
    const dispatcher = new DispatcherAdapter(DefaultDispatcher(tenant.name, transactionManager));

    return new AddLanguageUseCase(
      {
        transactionManager,
        settingsDS,
        translationsDS,
        eventEmitter,
        dispatcher,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );
  }
}

export { AddLanguageUseCaseFactory };
