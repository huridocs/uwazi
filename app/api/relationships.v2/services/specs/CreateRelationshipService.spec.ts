import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MissingEntityError } from 'api/entities.v2/errors/entityErrors';
import { MongoFilesDataSource } from 'api/files.v2/database/MongoFilesDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MissingRelationshipTypeError } from 'api/relationshiptypes.v2/errors/relationshipTypeErrors';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
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

const denormalizeAfterCreatingRelationshipsMock = jest.fn().mockResolvedValue(undefined);

const denormalizationServiceMock = partialImplementation<DenormalizationService>({
  denormalizeAfterCreatingRelationships: denormalizeAfterCreatingRelationshipsMock,
});

const createService = () => {
  const connection = getConnection();
  const transactionManager = DefaultTransactionManager();
  const SettingsDataSource = new MongoSettingsDataSource(connection, transactionManager);

  validateAccessMock.mockReset();
  denormalizeAfterCreatingRelationshipsMock.mockReset();

  return new CreateRelationshipService(
    new MongoRelationshipsDataSource(connection, transactionManager),
    new MongoRelationshipTypesDataSource(connection, transactionManager),
    new MongoEntitiesDataSource(
      connection,
      new MongoTemplatesDataSource(connection, transactionManager),
      SettingsDataSource,
      transactionManager
    ),
    new MongoFilesDataSource(connection, transactionManager),
    transactionManager,
    MongoIdHandler,
    authServiceMock,
    denormalizationServiceMock
  );
};

const fixtures: DBFixture = {
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
  files: [
    factory.file('file1', 'entity1', 'document', 'file1.pdf'),
    factory.file('file2', 'entity2', 'document', 'file2.pdf'),
    factory.file('file3', 'entity3', 'document', 'file3.pdf'),
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

describe('create()', () => {
  it('should check for user write access in the involved entities', async () => {
    const service = createService();
    await service.create([
      {
        from: { type: 'entity', entity: 'entity1' },
        to: { type: 'entity', entity: 'entity2' },
        type: factory.id('rel1').toHexString(),
      },
      {
        from: { type: 'entity', entity: 'entity2' },
        to: { type: 'entity', entity: 'entity1' },
        type: factory.id('rel2').toHexString(),
      },
    ]);
    expect(validateAccessMock).toHaveBeenCalledWith(
      'write',
      expect.arrayContaining(['entity1', 'entity2'])
    );
  });

  describe('When the input is correct', () => {
    const execute = async () => {
      const service = createService();

      return service.create([
        {
          from: { type: 'entity', entity: 'entity1' },
          to: { type: 'entity', entity: 'entity2' },
          type: factory.id('rel1').toHexString(),
        },
        {
          from: {
            type: 'text',
            entity: 'entity2',
            file: factory.id('file2').toHexString(),
            text: 'text selection 2',
            selections: [{ page: 2, top: 2, left: 2, width: 2, height: 2 }],
          },
          to: { type: 'entity', entity: 'entity1' },
          type: factory.id('rel2').toHexString(),
        },
        {
          from: { type: 'entity', entity: 'entity3' },
          to: {
            type: 'text',
            entity: 'entity1',
            file: factory.id('file1').toHexString(),
            text: 'text selection 1',
            selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
          },
          type: factory.id('rel3').toHexString(),
        },
      ]);
    };

    it('should return new connections', async () => {
      const relationships = await execute();

      expect(relationships).toEqual([
        {
          _id: expect.any(String),
          from: { entity: 'entity1' },
          to: { entity: 'entity2' },
          type: factory.id('rel1').toHexString(),
        },
        {
          _id: expect.any(String),
          from: {
            entity: 'entity2',
            file: factory.id('file2').toHexString(),
            selections: [{ page: 2, top: 2, left: 2, width: 2, height: 2 }],
            text: 'text selection 2',
          },
          to: { entity: 'entity1' },
          type: factory.id('rel2').toHexString(),
        },
        {
          _id: expect.any(String),
          from: { entity: 'entity3' },
          to: {
            entity: 'entity1',
            file: factory.id('file1').toHexString(),
            selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
            text: 'text selection 1',
          },
          type: factory.id('rel3').toHexString(),
        },
      ]);

      expect(denormalizeAfterCreatingRelationshipsMock).toHaveBeenCalledWith(
        relationships.map(r => r._id)
      );
    });

    it('should persist new connections', async () => {
      await execute();

      const relationshipsInDb = await collectionInDb().find({}).sort({ from: 1 }).toArray();

      expect(relationshipsInDb).toEqual([
        {
          _id: expect.any(ObjectId),
          from: { entity: 'entity1' },
          to: { entity: 'entity2' },
          type: factory.id('rel1'),
        },
        {
          _id: expect.any(ObjectId),
          from: {
            entity: 'entity2',
            file: factory.id('file2'),
            selections: [{ page: 2, top: 2, left: 2, width: 2, height: 2 }],
            text: 'text selection 2',
          },
          to: { entity: 'entity1' },
          type: factory.id('rel2'),
        },
        {
          _id: expect.any(ObjectId),
          from: { entity: 'entity3' },
          to: {
            entity: 'entity1',
            file: factory.id('file1'),
            selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
            text: 'text selection 1',
          },
          type: factory.id('rel3'),
        },
      ]);
    });

    it('should denormalize based on the newly created relationships', async () => {
      const created = await execute();

      expect(denormalizeAfterCreatingRelationshipsMock).toHaveBeenCalledWith(
        created.map(c => c._id)
      );
    });
  });

  describe('When an entity does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.create([
          {
            from: { type: 'entity', entity: 'entity1' },
            to: { type: 'entity', entity: 'entity2' },
            type: factory.id('rel1').toHexString(),
          },
          {
            from: { type: 'entity', entity: 'entity2' },
            to: { type: 'entity', entity: 'non-existing' },
            type: factory.id('rel2').toHexString(),
          },
          {
            from: { type: 'entity', entity: 'entity3' },
            to: { type: 'entity', entity: 'entity1' },
            type: factory.id('rel3').toHexString(),
          },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingEntityError);
      }
      expect(denormalizeAfterCreatingRelationshipsMock).not.toHaveBeenCalled();
    });
  });

  describe('When a type does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.create([
          {
            from: { type: 'entity', entity: 'entity1' },
            to: { type: 'entity', entity: 'entity2' },
            type: factory.id('rel1').toHexString(),
          },
          {
            from: { type: 'entity', entity: 'entity2' },
            to: { type: 'entity', entity: 'entity1' },
            type: factory.id('invalid').toHexString(),
          },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/existing/);
        expect(e).toBeInstanceOf(MissingRelationshipTypeError);
      }
      expect(denormalizeAfterCreatingRelationshipsMock).not.toHaveBeenCalled();
    });
  });

  describe('When a file does not exist', () => {
    it('should throw a validation error', async () => {
      const service = createService();
      try {
        await service.create([
          {
            from: {
              type: 'text',
              entity: 'entity1',
              file: factory.id('some file').toHexString(),
              text: 'some text',
              selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
            },
            to: { type: 'entity', entity: 'entity2' },
            type: factory.id('rel1').toHexString(),
          },
        ]);
        fail('should throw error');
      } catch (e) {
        await expect(e.message).toMatch(/file/i);
      }
      expect(denormalizeAfterCreatingRelationshipsMock).not.toHaveBeenCalled();
    });
  });

  it('should not fail if the input is empty', async () => {
    const service = createService();

    const result = await service.create([]);

    expect(result).toEqual([]);
  });
});
