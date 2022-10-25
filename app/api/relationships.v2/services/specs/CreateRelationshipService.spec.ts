import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { SelfReferenceError } from '../../errors/relationshipErrors';
import { CreateRelationshipService } from '../CreateRelationshipService';
import { DenormalizationService } from '../DenormalizationService';

const factory = getFixturesFactory();

const collectionInDb = (collection = 'relationships') => testingDB.mongodb?.collection(collection)!;

const entityInLanguages = (langs: string[], id: string, template?: string) =>
  langs.map(lang => factory.entity(id, template, {}, { language: lang }));

const validateAccessMock = jest.fn().mockResolvedValue(undefined);

const authServiceMock = partialImplementation<AuthorizationService>({
  validateAccess: validateAccessMock,
});

const denormalizeForNewRelationshipsMock = jest.fn().mockResolvedValue(undefined);

const denormalizationServiceMock = partialImplementation<DenormalizationService>({
  denormalizeForNewRelationships: denormalizeForNewRelationshipsMock,
});

const createService = () => {
  const connection = getConnection();
  const transactionManager = new MongoTransactionManager(getClient());
  const SettingsDataSource = new MongoSettingsDataSource(connection, transactionManager);

  validateAccessMock.mockReset();
  denormalizeForNewRelationshipsMock.mockReset();

  return new CreateRelationshipService(
    new MongoRelationshipsDataSource(connection, transactionManager),
    new MongoRelationshipTypesDataSource(connection, transactionManager),
    new MongoEntitiesDataSource(
      connection,
      new MongoRelationshipsDataSource(connection, transactionManager),
      SettingsDataSource,
      transactionManager
    ),
    transactionManager,
    MongoIdGenerator,
    authServiceMock,
    denormalizationServiceMock
  );
};

const fixtures = {
  entities: [
    ...entityInLanguages(['en', 'hu'], 'entity1', 'template1'),
    ...entityInLanguages(['en', 'hu'], 'entity2', 'template2'),
    ...entityInLanguages(['en', 'hu'], 'entity3', 'template1'),
    ...entityInLanguages(['en', 'hu'], 'entity4', 'template3'),
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
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
        },
        {
          default: true,
          label: 'Hungarian',
          key: 'hu',
        },
      ],
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('createMultiple()', () => {
  it('should check for user write access in the involved entities', async () => {
    const service = createService();
    await service.createMultiple([
      { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
      { from: 'entity2', to: 'entity1', type: factory.id('rel2').toHexString() },
    ]);
    expect(validateAccessMock).toHaveBeenCalledWith(
      'write',
      expect.arrayContaining(['entity1', 'entity2'])
    );
  });

  describe('When the entities exist', () => {
    it('should return new connections', async () => {
      const service = createService();

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
      const service = createService();
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

    it('should denormalize based on the newly created relationships', async () => {
      const service = createService();

      const created = await service.createMultiple([
        { from: 'entity4', to: 'entity1', type: factory.id('rel4').toHexString() },
        { from: 'entity4', to: 'entity3', type: factory.id('rel4').toHexString() },
      ]);

      expect(denormalizeForNewRelationshipsMock).toHaveBeenCalledWith(created.map(c => c._id));
    });
  });

  describe('When an entity does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
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
      expect(denormalizeForNewRelationshipsMock).not.toHaveBeenCalled();
    });
  });

  describe('When a type does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.createMultiple([
          { from: 'entity1', to: 'entity2', type: factory.id('rel1').toHexString() },
          { from: 'entity2', to: 'entity1', type: factory.id('invalid').toHexString() },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingRelationshipTypeError);
      }
      expect(denormalizeForNewRelationshipsMock).not.toHaveBeenCalled();
    });
  });

  describe('When trying to create a self-referencing relationship', () => {
    it('should throw a validation error', async () => {
      const service = createService();
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
      expect(denormalizeForNewRelationshipsMock).not.toHaveBeenCalled();
    });
  });
});
