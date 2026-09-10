import { GetRelationshipTypesUseCase } from '#api/core/application/GetRelationshipTypes.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RelationshipTypesDataSourceFactory } from './RelationshipTypesDataSourceFactory.js';

class GetRelationshipTypesUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof GetRelationshipTypesUseCase>[0]>
  ) {
    const { transactionManager } = ExecutionContext;
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default({ transactionManager });

    return new GetRelationshipTypesUseCase({
      transactionManager,
      relationshipTypesDS,
      ...overrides,
    });
  }
}

export { GetRelationshipTypesUseCaseFactory };
