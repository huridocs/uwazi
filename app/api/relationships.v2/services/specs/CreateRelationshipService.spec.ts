import { PermissionsDataSource } from 'api/authorization.v2/database/PermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/database/EntitiesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/RelationshipTypesDataSource';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { RelationshipsDataSource } from '../../database/RelationshipsDataSource';
import { MissingEntityError, SelfReferenceError } from '../../errors/relationshipErrors';
import { CreateRelationshipService } from '../CreateRelationshipService';

const factory = getFixturesFactory();

const collectionInDb = () => testingDB.mongodb?.collection('relationships')!;

const mockUser = new User(MongoIdGenerator.generate(), 'admin', []);

const fixtures = {
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2', 'template2'),
    factory.entity('entity3', 'template1'),
  ],
  relationships: [],
  relationtypes: [
    {
      _id: factory.id('rel1'),
      name: 'rel1',
    },
    {
      _id: factory.id('rel2'),
      name: 'rel2',
    },
    {
      _id: factory.id('rel3'),
      name: 'rel3',
    },
  ],
  templates: [factory.template('template1'), factory.template('template2')],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('create()', () => {
  describe('When the entities exist', () => {
    it('should return a new connection', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new RelationshipsDataSource(connection),
        new RelationshipTypesDataSource(connection),
        new EntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
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
        MongoIdGenerator,
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
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.create('entity1', 'non-existing', factory.id('rel1').toHexString());
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingEntityError);
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
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.create('entity1', 'entity1', factory.id('rel1').toHexString());
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/self/);
        expect(e).toBeInstanceOf(SelfReferenceError);
      }
    });
  });
});

describe('createMultiple()', () => {
  describe('When the entities exist', () => {
    it('should return new connections', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new RelationshipsDataSource(connection),
        new RelationshipTypesDataSource(connection),
        new EntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      const relationship = await service.createMultiple([
        { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
        { from: 'entity2', to: 'entity1', type: factory.id('rel2').toHexString() },
        { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
      ]);

      expect(relationship).toEqual([
        {
          _id: expect.any(String),
          from: 'entity1',
          to: 'entity2',
          type: factory.id('rel1').toHexString(),
        },
        {
          _id: expect.any(String),
          from: 'entity2',
          to: 'entity1',
          type: factory.id('rel2').toHexString(),
        },
        {
          _id: expect.any(String),
          from: 'entity3',
          to: 'entity1',
          type: factory.id('rel3').toHexString(),
        },
      ]);
    });

    it('should persist new connections', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new RelationshipsDataSource(connection),
        new RelationshipTypesDataSource(connection),
        new EntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      await service.createMultiple([
        { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
        { from: 'entity2', to: 'entity1', type: factory.id('rel2').toHexString() },
        { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
      ]);

      const relatinshipsInDb = await collectionInDb().find({}).sort({ from: 1 }).toArray();

      expect(relatinshipsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          from: 'entity1',
          to: 'entity2',
          type: factory.id('rel1'),
        },
        {
          _id: expect.any(ObjectId),
          from: 'entity2',
          to: 'entity1',
          type: factory.id('rel2'),
        },
        {
          _id: expect.any(ObjectId),
          from: 'entity3',
          to: 'entity1',
          type: factory.id('rel3'),
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
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.createMultiple([
          { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
          { from: 'entity2', to: 'non-existing', type: factory.id('rel2').toHexString() },
          { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingEntityError);
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
        MongoIdGenerator,
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.createMultiple([
          { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
          { from: 'entity1', to: 'entity1', type: factory.id('rel2').toHexString() },
          { from: 'entity3', to: 'entity1', type: factory.id('rel3').toHexString() },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/self/);
        expect(e).toBeInstanceOf(SelfReferenceError);
      }
    });
  });
});
