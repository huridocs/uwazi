/* eslint-disable max-statements */
import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { SelfReferenceError } from '../../errors/relationshipErrors';
import { CreateRelationshipService } from '../CreateRelationshipService';
import { DenormalizationService } from '../DenormalizationService';

const factory = getFixturesFactory();

const collectionInDb = (collection = 'relationships') => testingDB.mongodb?.collection(collection)!;

const mockUser = new User(MongoIdGenerator.generate(), 'admin', []);

const fixtures = {
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2', 'template2'),
    factory.entity('entity3', 'template1'),
    factory.entity('entity4', 'template3'),
    factory.entity('entity5', 'template1'),
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
    {
      _id: factory.id('rel4'),
      name: 'rel4',
    },
  ],
  templates: [
    factory.template('template1'),
    factory.template('template2'),
    factory.template('template3', [
      factory.property('relProp', 'newRelationship', {
        query: {
          traverse: [
            {
              direction: 'out',
              types: [factory.id('rel4').toHexString()],
              match: [
                {
                  templates: [factory.id('template1').toHexString()],
                },
                {
                  templates: [factory.id('template2').toHexString()],
                  traverse: [
                    {
                      direction: 'out',
                      types: [factory.id('rel4').toHexString()],
                      match: [{ templates: [factory.id('template1').toHexString()] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ]),
  ],
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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

    // eslint-disable-next-line jest/no-focused-tests
    it('should denormalize the fields over 1 hop', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
      );

      await service.createMultiple([
        { from: 'entity4', to: 'entity1', type: factory.id('rel4').toHexString() },
        { from: 'entity4', to: 'entity3', type: factory.id('rel4').toHexString() },
      ]);

      const [entity4] = await collectionInDb('entities').find({ sharedId: 'entity4' }).toArray();
      const [entity1] = await collectionInDb('entities').find({ sharedId: 'entity1' }).toArray();
      const [entity3] = await collectionInDb('entities').find({ sharedId: 'entity3' }).toArray();

      expect(entity4).toMatchObject({
        metadata: {
          relProp: [
            { value: 'entity1', label: 'entity1' },
            { value: 'entity3', label: 'entity3' },
          ],
        },
      });
      expect(entity1).toEqual(fixtures.entities[0]);
      expect(entity3).toEqual(fixtures.entities[2]);
    });

    // eslint-disable-next-line jest/no-focused-tests
    fit('should denormalize the fields over 2 hops', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser),
        new DenormalizationService(
          new MongoRelationshipsDataSource(connection),
          new MongoEntitiesDataSource(connection),
          new MongoTemplatesDataSource(connection),
          new MongoTransactionManager(getClient())
        )
      );

      // await service.createMultiple([
      //   { from: 'entity4', to: 'entity2', type: factory.id('rel4').toHexString() },
      // ]);

      await service.createMultiple([
        { from: 'entity2', to: 'entity5', type: factory.id('rel4').toHexString() },
      ]);

      // const [entity4] = await collectionInDb('entities').find({ sharedId: 'entity4' }).toArray();
      // const [entity1] = await collectionInDb('entities').find({ sharedId: 'entity1' }).toArray();
      // const [entity3] = await collectionInDb('entities').find({ sharedId: 'entity3' }).toArray();

      // expect(entity4).toMatchObject({
      //   metadata: {
      //     relProp: [{ value: 'entity5', label: 'entity5' }],
      //   },
      // });
      // expect(entity1).toEqual(fixtures.entities[0]);
      // expect(entity3).toEqual(fixtures.entities[2]);
    });
  });

  describe('When an entity does not exist', () => {
    it('should throw a validation error', async () => {
      const connection = getConnection();
      const service = new CreateRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
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
