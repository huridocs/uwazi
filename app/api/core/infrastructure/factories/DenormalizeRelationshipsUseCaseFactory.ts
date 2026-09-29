import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DenormalizeRelationshipsUseCase } from '#api/core/application/DenormalizeRelationships.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class DenormalizeRelationshipsUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DenormalizeRelationshipsUseCase>[0]>
  ) {
    const { transactionManager } = ExecutionContext;

    const settingsDS = SettingsDataSourceFactory.cached();
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });

    return new DenormalizeRelationshipsUseCase(
      {
        settingsDS,
        transactionManager,
        entitiesDS,
        entitiesService: EntitiesServiceFactory.default(),
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { DenormalizeRelationshipsUseCaseFactory };
