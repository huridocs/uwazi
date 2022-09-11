import {
  getConnection,
  getClient,
} from 'api/relationships.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { MongoTransactionManager } from 'api/relationships.v2/database/MongoTransactionManager';
import { ObjectId } from 'mongodb';
import { RelationshipTypesDataSource } from 'api/relationships.v2/database/RelationshipTypesDataSource';
import { generateId } from 'api/relationships.v2/database/MongoIdGenerator';
import { User } from 'api/relationships.v2/model/User';
import { PermissionsDataSource } from 'api/relationships.v2/database/PermissionsDataSource';
import { CreateRelationshipService } from '../CreateRelationshipService';
import { EntitiesDataSource } from '../../database/EntitiesDataSource';
import { RelationshipsDataSource } from '../../database/RelationshipsDataSource';
import { AuthorizationService } from '../AuthorizationService';

const factory = getFixturesFactory();

const collectionInDb = () => testingDB.mongodb?.collection('relationships')!;

const mockUser = new User(generateId(), 'admin', []);

const fixtures = {
  entities: [factory.entity('entity1', 'template1'), factory.entity('entity2', 'template1')],
  relationships: [],
  relationtypes: [
    {
      _id: factory.id('rel1'),
      name: 'rel1',
    },
  ],
  templates: [factory.template('template1')],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('When the entities exist', () => {
  it('should return a new connection', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new RelationshipTypesDataSource(connection),
      new EntitiesDataSource(connection),
      new MongoTransactionManager(getClient()),
      generateId,
      new AuthorizationService(new PermissionsDataSource(connection), mockUser)
    );
    const relationship = await service.create(
      'entity1',
      'entity2',
      factory.id('rel1').toHexString()
    );

    expect(relationship).toEqual({
      _id: expect.any(String),
      from: 'entity1',
      to: 'entity2',
      type: factory.id('rel1').toHexString(),
    });
  });

  it('should persist a new connection', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new RelationshipTypesDataSource(connection),
      new EntitiesDataSource(connection),
      new MongoTransactionManager(getClient()),
      generateId,
      new AuthorizationService(new PermissionsDataSource(connection), mockUser)
    );
    await service.create('entity1', 'entity2', factory.id('rel1').toHexString());

    const relatinshipsInDb = await collectionInDb().find({}).toArray();

    expect(relatinshipsInDb).toEqual([
      {
        _id: expect.any(ObjectId),
        from: 'entity1',
        to: 'entity2',
        type: factory.id('rel1'),
      },
    ]);
  });
});

describe('When an entity does not exist', () => {
  it('should throw a validation error', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new RelationshipTypesDataSource(connection),
      new EntitiesDataSource(connection),
      new MongoTransactionManager(getClient()),
      generateId,
      new AuthorizationService(new PermissionsDataSource(connection), mockUser)
    );
    try {
      await service.create('entity1', 'non-existing', factory.id('rel1').toHexString());
      fail('should throw error');
    } catch (e) {
      await expect(e.message).toMatch(/existing/);
    }
  });
});

describe('When trying to create a self-referencing relationship', () => {
  it('should throw a validation error', async () => {
    const connection = getConnection();
    const service = new CreateRelationshipService(
      new RelationshipsDataSource(connection),
      new RelationshipTypesDataSource(connection),
      new EntitiesDataSource(connection),
      new MongoTransactionManager(getClient()),
      generateId,
      new AuthorizationService(new PermissionsDataSource(connection), mockUser)
    );
    try {
      await service.create('entity1', 'entity1', factory.id('rel1').toHexString());
      fail('should throw error');
    } catch (e) {
      await expect(e.message).toMatch(/self/);
    }
  });
});
