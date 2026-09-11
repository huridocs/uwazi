import { DeleteRelationshipTypeUseCase } from '#api/core/application/DeleteRelationshipType.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RelationshipTypeTranslationService } from '#api/core/application/relationshipTypeTranslationService/RelationshipTypeTranslationService.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';
import { TranslationsDataSourceFactory } from './TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class DeleteRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteRelationshipTypeUseCase>[0]>
  ) {
    const { transactionManager } = ExecutionContext;
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
