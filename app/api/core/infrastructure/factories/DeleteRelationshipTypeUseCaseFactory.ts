import { DeleteRelationshipTypeUseCase } from '#api/core/application/DeleteRelationshipType.js';
import { RelationshipTypeTranslationService } from '#api/core/application/relationshipTypeTranslationService/RelationshipTypeTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class DeleteRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default({ transactionManager });
    const relationshipTypeTranslationService = new RelationshipTypeTranslationService({
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
    });

    return new DeleteRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      relationshipTypeTranslationService,
      ...overrides,
    });
  }
}

export { DeleteRelationshipTypeUseCaseFactory };
