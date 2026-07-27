import { UpdateRelationshipTypeUseCase } from '../../application/UpdateRelationshipType.js';
import { DefaultRelationshipTypesDataSource } from '../../database/data_source_defaults.js';
import { LegacyRelationshipTypesTranslationService } from '../services/LegacyRelationshipTypesTranslationService.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

class UpdateRelationshipTypeUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof UpdateRelationshipTypeUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
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
