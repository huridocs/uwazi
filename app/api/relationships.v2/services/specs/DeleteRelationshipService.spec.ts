import { PermissionsDataSource } from 'api/authorization.v2/database/PermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { User } from 'api/users.v2/model/User';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { RelationshipsDataSource } from '../../database/RelationshipsDataSource';
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
    it('should return the deleted entry', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      const relationship = await service.delete(factory.id('rel1').toHexString());

      expect(relationship).toEqual({
        _id: expect.any(String),
        from: 'entity1',
        to: 'entity2',
        type: factory.id('rtype1').toHexString(),
      });
    });

    it('should delete the relationship', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      await service.delete(factory.id('rel1').toHexString());

      const relatinshipsInDb = await collectionInDb()
        .find({ _id: factory.id('rel1') })
        .toArray();
      expect(relatinshipsInDb).toEqual([]);
    });
  });

  describe('When the relationship does not exist', () => {
    it('should throw a validation error', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.delete(factory.id('non-existing').toHexString());
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(MissingRelationshipError);
      }
    });
  });
});

describe('deleteMultiple()', () => {
  describe('When the entities exist', () => {
    it('should return the deleted relationships', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      const relationships = await service.deleteMultiple([
        factory.id('rel1').toHexString(),
        factory.id('rel3').toHexString(),
      ]);

      expect(relationships).toEqual([
        {
          _id: expect.any(String),
          from: 'entity1',
          to: 'entity2',
          type: factory.id('rtype1').toHexString(),
        },
        {
          _id: expect.any(String),
          from: 'entity3',
          to: 'entity1',
          type: factory.id('rtype3').toHexString(),
        },
      ]);
    });

    it('should delete the relationships', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      await service.deleteMultiple([
        factory.id('rel1').toHexString(),
        factory.id('rel3').toHexString(),
      ]);

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

  describe('When an relationship does not exist', () => {
    it('should throw a validation error', async () => {
      const connection = getConnection();
      const service = new DeleteRelationshipService(
        new RelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new PermissionsDataSource(connection), mockUser)
      );
      try {
        await service.deleteMultiple([
          factory.id('rel1').toHexString(),
          factory.id('non-existing').toHexString(),
        ]);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(MissingRelationshipError);
      }
    });
  });
});
