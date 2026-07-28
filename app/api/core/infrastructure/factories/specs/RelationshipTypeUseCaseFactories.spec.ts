import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CreateRelationshipTypeUseCase } from '#api/core/application/CreateRelationshipType.js';
import { DeleteRelationshipTypeUseCase } from '#api/core/application/DeleteRelationshipType.js';
import { GetRelationshipTypesUseCase } from '#api/core/application/GetRelationshipTypes.js';
import { UpdateRelationshipTypeUseCase } from '#api/core/application/UpdateRelationshipType.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { CreateRelationshipTypeUseCaseFactory } from '../CreateRelationshipTypeUseCaseFactory.js';
import { DeleteRelationshipTypeUseCaseFactory } from '../DeleteRelationshipTypeUseCaseFactory.js';
import { GetRelationshipTypesUseCaseFactory } from '../GetRelationshipTypesUseCaseFactory.js';
import { RelationshipTypesDataSourceFactory } from '../RelationshipTypesDataSourceFactory.js';
import { UpdateRelationshipTypeUseCaseFactory } from '../UpdateRelationshipTypeUseCaseFactory.js';

describe('RelationshipType use case factories', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({ relationtypes: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should build CreateRelationshipTypeUseCase', () => {
    const sut = testingEnvironment.runWithContext(() =>
      CreateRelationshipTypeUseCaseFactory.default()
    );
    expect(sut).toBeInstanceOf(CreateRelationshipTypeUseCase);
  });

  it('should build UpdateRelationshipTypeUseCase', () => {
    const sut = testingEnvironment.runWithContext(() =>
      UpdateRelationshipTypeUseCaseFactory.default()
    );
    expect(sut).toBeInstanceOf(UpdateRelationshipTypeUseCase);
  });

  it('should build DeleteRelationshipTypeUseCase', () => {
    const sut = testingEnvironment.runWithContext(() =>
      DeleteRelationshipTypeUseCaseFactory.default()
    );
    expect(sut).toBeInstanceOf(DeleteRelationshipTypeUseCase);
  });

  it('should build GetRelationshipTypesUseCase', () => {
    const sut = testingEnvironment.runWithContext(() =>
      GetRelationshipTypesUseCaseFactory.default()
    );
    expect(sut).toBeInstanceOf(GetRelationshipTypesUseCase);
  });

  it('should build relationship types data source', () => {
    const sut = testingEnvironment.runWithContext(() =>
      RelationshipTypesDataSourceFactory.default(TransactionManagerFactory.default())
    );
    expect(sut).toBeInstanceOf(MongoRelationshipTypesDataSource);
  });
});
