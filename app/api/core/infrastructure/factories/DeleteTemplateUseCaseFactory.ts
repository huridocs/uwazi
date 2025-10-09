import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DeleteTemplateUseCase } from 'api/core/application/DeleteTemplate';
import { applicationEventsBus } from 'api/eventsbus';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';

class DeleteTemplateUseCaseFactory {
  static create() {
    const eventBus = applicationEventsBus;
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = DefaultEntitiesDataSource(transactionManager);

    const useCase = new DeleteTemplateUseCase(
      {
        eventBus,
        transactionManager,
        entitiesDS,
        templatesDS,
        settingsDS,
        translationsDS,
      },
      { actor: permissionsContext.getUserInContext()!, tenant: tenants.current() }
    );

    return useCase;
  }
}

export { DeleteTemplateUseCaseFactory };
