import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SetTemplateAsDefaultUseCase } from '#api/core/application/SetTemplateAsDefault.js';

class SetTemplateAsDefaultUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof SetTemplateAsDefaultUseCase>[0]>
  ) {
    const { transactionManager } = ExecutionContext;
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });

    return new SetTemplateAsDefaultUseCase({ templatesDS, transactionManager, ...overrides });
  }
}

export { SetTemplateAsDefaultUseCaseFactory };
