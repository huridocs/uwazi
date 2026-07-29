import { GetRelationshipTypesUseCase } from '#api/core/application/GetRelationshipTypes.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';

class GetRelationshipTypesUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof GetRelationshipTypesUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default(transactionManager);

    return new GetRelationshipTypesUseCase({
      transactionManager,
      relationshipTypesDS,
      ...overrides,
    });
  }
}

export { GetRelationshipTypesUseCaseFactory };
