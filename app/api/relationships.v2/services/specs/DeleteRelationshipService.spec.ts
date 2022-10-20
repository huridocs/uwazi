import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { MongoRelationshipsDataSource } from '../../database/MongoRelationshipsDataSource';
import { MissingRelationshipError } from '../../errors/relationshipErrors';
import { DeleteRelationshipService } from '../DeleteRelationshipService';

const factory = getFixturesFactory();

const collectionInDb = () => testingDB.mongodb?.collection('relationships')!;

const mockUser = new User(MongoIdGenerator.generate(), 'admin', []);

const fixtures = {
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2', 'template2'),
    factory.entity('entity3', 'template1'),
  ],
  relationships: [
    {
      _id: factory.id('rel1'),
      from: 'entity1',
      to: 'entity2',
      type: factory.id('rtype1'),
    },
    {
      _id: factory.id('rel2'),
      from: 'entity2',
      to: 'entity1',
      type: factory.id('rtype2'),
    },
    {
      _id: factory.id('rel3'),
      from: 'entity3',
      to: 'entity1',
      type: factory.id('rtype3'),
    },
  ],
  relationtypes: [
    {
      _id: factory.id('rtype1'),
      name: 'rtype1',
    },
    {
      _id: factory.id('rtype2'),
      name: 'rtype2',
    },
    {
      _id: factory.id('rtype3'),
      name: 'rtype3',
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

describe('delete()', () => {
  describe('When the entities exist', () => {
    it('should delete a single relationship', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
      );
      await service.delete(factory.id('rel1').toHexString());

      const relatinshipsInDb = await collectionInDb()
        .find({ _id: factory.id('rel1') })
        .toArray();
      expect(relatinshipsInDb).toEqual([]);
    });

    it('should delete multiple relationships', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
      );
      await service.delete([factory.id('rel1').toHexString(), factory.id('rel3').toHexString()]);

      const relatinshipsInDb = await collectionInDb().find({}).toArray();

      expect(relatinshipsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          from: 'entity2',
          to: 'entity1',
          type: factory.id('rtype2'),
        },
      ]);
    });
  });

  describe('When a relationship does not exist', () => {
    it.each([
      {
        toDelete: factory.id('non-existing').toHexString(),
      },
      {
        toDelete: [factory.id('non-existing').toHexString(), factory.id('rel1').toHexString()],
      },
    ])('should throw a validation error', async ({ toDelete }) => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new MongoPermissionsDataSource(connection), mockUser)
      );
      try {
        await service.delete(toDelete);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(MissingRelationshipError);
      }
    });
  });
});
