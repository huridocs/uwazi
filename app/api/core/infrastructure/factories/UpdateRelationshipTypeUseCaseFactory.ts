import { UpdateRelationshipTypeUseCase } from '#api/core/application/UpdateRelationshipType.js';
import { RelationshipTypeTranslationService } from '#api/core/application/relationshipTypeTranslationService/RelationshipTypeTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class UpdateRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof UpdateRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default({ transactionManager });
    const translationService = new RelationshipTypeTranslationService({
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
    });

    return new UpdateRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      translationService,
      ...overrides,
    });
  }
}

export { UpdateRelationshipTypeUseCaseFactory };
