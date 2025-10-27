import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoTemplatesDataSourceFactory } from 'api/core/infrastructure/factories/MongoTemplatesDataSourceFactory';
import { SetTemplateAsDefaultUseCase } from 'api/core/application/SetTemplateAsDefault';

class SetTemplateAsDefaultUseCaseFactory {
  static create() {
    const transactionManager = DefaultTransactionManager();
    const templatesDS = MongoTemplatesDataSourceFactory.default(transactionManager);

    const useCase = new SetTemplateAsDefaultUseCase({ templatesDS, transactionManager });

    return useCase;
  }
}

export { SetTemplateAsDefaultUseCaseFactory };
