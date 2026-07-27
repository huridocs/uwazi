import { DeleteRelationshipTypeUseCase } from '../../application/DeleteRelationshipType.js';
import { LegacyRelationshipTypesTranslationService } from '../services/LegacyRelationshipTypesTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';

class DeleteRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default(transactionManager);
    const translationService = new LegacyRelationshipTypesTranslationService();

    return new DeleteRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      translationService,
      ...overrides,
    });
  }
}

export { DeleteRelationshipTypeUseCaseFactory };
