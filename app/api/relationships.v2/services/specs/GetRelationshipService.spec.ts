import { MongoPermissionsDataSource } from '#api/authorization.v2/database/MongoPermissionsDataSource.js';
import { AuthorizationService } from '#api/authorization.v2/services/AuthorizationService.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTemplatesDataSource } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { MongoDeprecatedEntitiesDataSource } from '#api/entities.v2/database/MongoDeprecatedEntitiesDataSource.js';
import { MongoRelationshipsDataSource } from '#api/relationships.v2/database/MongoRelationshipsDataSource.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { User } from '#api/users.v2/model/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { GetRelationshipService } from '../GetRelationshipService.js';

const fixtureFactory = getFixturesFactory();

const fixtures: DBFixture = {
  templates: [fixtureFactory.template('template1')],
  entities: [
    fixtureFactory.entity(
      'entity1',
      'template1',
      {},
      { permissions: [{ refId: fixtureFactory.id('user'), level: 'read', type: 'user' }] }
    ),
    fixtureFactory.entity('entity2', 'template1', {}, { published: true }),
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

const createService = (_user?: User) => {
  const user = _user || new User(fixtureFactory.id('user').toString(), 'admin', []);
  const connection = getConnection();
  const transactionManager = TransactionManagerFactory.default();
  const relationshipsDS = new MongoRelationshipsDataSource(connection, transactionManager);
  const relationshipTypesDS = new MongoRelationshipTypesDataSource(connection, transactionManager);
  const templatesDS = new MongoTemplatesDataSource({
    db: connection,
    transactionManager,
    dao: new MongoTemplatesDAO({ db: connection, transactionManager }),
  });
  const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
  const authService = new AuthorizationService(
    new MongoPermissionsDataSource(connection, transactionManager),
    user
  );
  const entitiesDS = new MongoDeprecatedEntitiesDataSource(
    connection,
    templatesDS,
    settingsDS,
    transactionManager
  );
  return new GetRelationshipService(
    relationshipsDS,
    authService,
    entitiesDS,
    templatesDS,
    relationshipTypesDS
  );
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures, true);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('getByEntity()', () => {
  it('should return all the relationships for the entity', async () => {
    const service = createService();
    const relationshipsData = await service.getByEntity('entity2');
    expect(relationshipsData).toEqual([
      fixtureFactory.v2.application.readableRelationship(
        'rel1',
        'entity1',
        'entity1',
        'template1',
        'entity2',
        'entity2',
        'template1',
        'reltype',
        'reltype'
      ),
      fixtureFactory.v2.application.readableRelationship(
        'rel2',
        'entity2',
        'entity2',
        'template1',
        'entity3',
        'entity3',
        'template1',
        'reltype',
        'reltype'
      ),
    ]);
  });

  it('should check for user read access in the involved entities', async () => {
    const service = createService(
      new User(fixtureFactory.id('user').toString(), 'collaborator', [])
    );
    const relationshipsData = await service.getByEntity('entity2');

    expect(relationshipsData).toEqual([
      fixtureFactory.v2.application.readableRelationship(
        'rel1',
        'entity1',
        'entity1',
        'template1',
        'entity2',
        'entity2',
        'template1',
        'reltype',
        'reltype'
      ),
    ]);
  });
});
