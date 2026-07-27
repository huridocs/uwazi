import { CreateRelationshipTypeUseCase } from '../../application/CreateRelationshipType.js';
import { LegacyRelationshipTypesTranslationService } from '../services/LegacyRelationshipTypesTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';

class CreateRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CreateRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default(transactionManager);
    const translationService = new LegacyRelationshipTypesTranslationService();

    return new CreateRelationshipTypeUseCase({
      transactionManager,
      relationshipTypesDS,
      translationService,
      ...overrides,
    });
  }
}

export { CreateRelationshipTypeUseCaseFactory };
