import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SetTemplateAsDefaultUseCase } from '#api/core/application/SetTemplateAsDefault.js';

class SetTemplateAsDefaultUseCaseFactory {
  static create() {
    const transactionManager = TransactionManagerFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

    const useCase = new SetTemplateAsDefaultUseCase({ templatesDS, transactionManager });

    return useCase;
  }
}

export { SetTemplateAsDefaultUseCaseFactory };
