import { UpdateRelationshipTypeUseCase } from '#api/core/application/UpdateRelationshipType.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { LegacyRelationshipTypesTranslationService } from '#api/core/infrastructure/mongodb/relationshipType/LegacyRelationshipTypesTranslationService.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';

class UpdateRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof UpdateRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default(transactionManager);
    const translationService = new LegacyRelationshipTypesTranslationService();

    return new UpdateRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      translationService,
      ...overrides,
    });
  }
}

export { UpdateRelationshipTypeUseCaseFactory };
