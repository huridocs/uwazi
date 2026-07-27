import { GetRelationshipTypesUseCase } from '../../application/GetRelationshipTypes.js';
import { DefaultRelationshipTypesDataSource } from '../../database/data_source_defaults.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

class GetRelationshipTypesUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof GetRelationshipTypesUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);

    return new GetRelationshipTypesUseCase({
      transactionManager,
      relationshipTypesDS,
      ...overrides,
    });
  }
}

export { GetRelationshipTypesUseCaseFactory };
