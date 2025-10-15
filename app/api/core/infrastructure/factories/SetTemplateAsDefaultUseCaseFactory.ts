import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { SetTemplateAsDefaultUseCase } from 'api/core/application/SetTemplateAsDefault';

class SetTemplateAsDefaultUseCaseFactory {
  static create() {
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);

    const useCase = new SetTemplateAsDefaultUseCase({ templatesDS, transactionManager });

    return useCase;
  }
}

export { SetTemplateAsDefaultUseCaseFactory };
