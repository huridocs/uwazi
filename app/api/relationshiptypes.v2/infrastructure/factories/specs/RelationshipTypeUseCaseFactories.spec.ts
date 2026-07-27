import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CreateRelationshipTypeUseCase } from '../../../application/CreateRelationshipType.js';
import { DeleteRelationshipTypeUseCase } from '../../../application/DeleteRelationshipType.js';
import { GetRelationshipTypesUseCase } from '../../../application/GetRelationshipTypes.js';
import { UpdateRelationshipTypeUseCase } from '../../../application/UpdateRelationshipType.js';
import { CreateRelationshipTypeUseCaseFactory } from '../CreateRelationshipTypeUseCaseFactory.js';
import { DeleteRelationshipTypeUseCaseFactory } from '../DeleteRelationshipTypeUseCaseFactory.js';
import { GetRelationshipTypesUseCaseFactory } from '../GetRelationshipTypesUseCaseFactory.js';
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
});
