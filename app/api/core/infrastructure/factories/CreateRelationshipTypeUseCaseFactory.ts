import { CreateRelationshipTypeUseCase } from '#api/core/application/CreateRelationshipType.js';
import { RelationshipTypeTranslationService } from '#api/core/application/relationshipTypeTranslationService/RelationshipTypeTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class CreateRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CreateRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default({ transactionManager });
    const translationService = new RelationshipTypeTranslationService({
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
    });

    return new CreateRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      translationService,
      idGenerator: IdGeneratorFactory.default(),
      ...overrides,
    });
  }
}

export { CreateRelationshipTypeUseCaseFactory };
