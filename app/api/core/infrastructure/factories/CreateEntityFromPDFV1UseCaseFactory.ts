import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { User } from '#api/users.v2/model/User.js';
import { CreateEntityFromPDFV1UseCase } from '#api/core/application/CreateEntityFromPDFV1.js';

class CreateEntityFromPDFV1UseCaseFactory {
  static default(
    overrides: Partial<ConstructorParameters<typeof CreateEntityFromPDFV1UseCase>[0]> & {
      targetLanguage?: LanguageISO6391;
    } = {}
  ) {
    const { targetLanguage = 'en', ...depsOverrides } = overrides;

    const { tenant } = ExecutionContext;

    let actor: User | undefined;
    try {
      actor = ExecutionContext.actor;
    } catch {
      // still needed for some backwards compat tests
      actor = User.createFrom(permissionsContext.getUserInContext()!);
    }

    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const idGenerator = IdGeneratorFactory.default();

    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const entitiesService = EntitiesServiceFactory.default();

    return new CreateEntityFromPDFV1UseCase(
      {
        entitiesService,
        propertyAssignmentCreatorServiceStrategy,
        idGenerator,
        transactionManager,
        ...depsOverrides,
      },
      { actor, tenant, targetLanguage }
    );
  }
}

export { CreateEntityFromPDFV1UseCaseFactory };
