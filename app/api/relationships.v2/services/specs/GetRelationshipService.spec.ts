import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { GetRelationshipService } from '../GetRelationshipService';

const fixtureFactory = getFixturesFactory();

const fixtures = {
  templates: [fixtureFactory.template('template1')],
  entities: [
    fixtureFactory.entity('entity1', 'template1'),
    fixtureFactory.entity('entity2', 'template1'),
    fixtureFactory.entity('entity3', 'template1'),
  ],
  relationships: [
    fixtureFactory.v2.database.relationshipDBO('rel1', 'entity1', 'entity2', 'reltype'),
    fixtureFactory.v2.database.relationshipDBO('rel2', 'entity2', 'entity3', 'reltype'),
    fixtureFactory.v2.database.relationshipDBO('rel3', 'entity3', 'entity1', 'reltype'),
  ],
  relationtypes: [fixtureFactory.relationType('reltype')],
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
        },
      ],
    },
  ],
};

const validateAccessMock = jest.fn().mockResolvedValue(undefined);

const authServiceMock = partialImplementation<AuthorizationService>({
  validateAccess: validateAccessMock,
});

const createService = () => {
  const connection = getConnection();
  const transactionManager = new MongoTransactionManager(getClient());
  const relationshipsDS = new MongoRelationshipsDataSource(connection, transactionManager);
  return new GetRelationshipService(relationshipsDS, authServiceMock);
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('getByEntity()', () => {
  it('should return all the relationships for the entity', async () => {
    const service = createService();
    const relationships = await service.getByEntity('entity2');
    expect(relationships).toEqual([
      fixtureFactory.v2.application.relationship('rel1', 'entity1', 'entity2', 'reltype'),
      fixtureFactory.v2.application.relationship('rel2', 'entity2', 'entity3', 'reltype'),
    ]);
  });

  it('should check for user read access in the involved entities', async () => {
    const service = createService();
    await service.getByEntity('entity2');

    expect(validateAccessMock).toHaveBeenCalledWith(
      'read',
      expect.arrayContaining(['entity1', 'entity2', 'entity3'])
    );
  });
});
