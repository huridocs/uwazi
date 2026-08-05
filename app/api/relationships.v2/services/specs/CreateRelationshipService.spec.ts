import { ObjectId } from 'mongodb';
import { AuthorizationService } from '#api/authorization.v2/services/AuthorizationService.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { partialImplementation } from '#api/common.v2/testing/partialImplementation.js';
import { MongoDeprecatedEntitiesDataSource } from '#api/entities.v2/database/MongoDeprecatedEntitiesDataSource.js';
import { MissingEntityError } from '#api/entities.v2/errors/entityErrors.js';
import { MongoRelationshipsDataSource } from '#api/relationships.v2/database/MongoRelationshipsDataSource.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';
import { MissingRelationshipTypeError } from '#api/core/domain/relationshipType/errors.js';
import { MongoTemplatesDataSource } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { CreateRelationshipService } from '../CreateRelationshipService.js';
import { DenormalizationService } from '../DenormalizationService.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

const factory = getFixturesFactory();

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

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

const createSut = () => {
  const connection = getConnection();
  const transactionManager = TransactionManagerFactory.default();
  const dao = new MongoTemplatesDAO({ db: connection, transactionManager });
  const templatesDS = new MongoTemplatesDataSource({ db: connection, transactionManager, dao });

  return testingEnvironment.runWithContext(
    () => {
      const filesDS = FilesDataSourceFactory.default();
      const settingsDS = SettingsDataSourceFactory.default();

      return new CreateRelationshipService(
        new MongoRelationshipsDataSource(connection, transactionManager),
        new MongoRelationshipTypesDataSource(connection, transactionManager),
        new MongoDeprecatedEntitiesDataSource(
          connection,
          templatesDS,
          settingsDS,
          transactionManager
        ),
        filesDS,
        transactionManager,
        MongoIdHandler,
        authServiceMock,
        denormalizationServiceMock
      );
    },
    { factories: { transactionManager: () => transactionManager } }
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
    factory.fileDeprecated('file1', 'entity1', 'document', 'file1.pdf'),
    factory.fileDeprecated('file2', 'entity2', 'document', 'file2.pdf'),
    factory.fileDeprecated('file3', 'entity3', 'document', 'file3.pdf'),
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

describe('CreateRelationshipService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
      validateAccessMock.mockReset();
      denormalizeAfterCreatingRelationshipsMock.mockReset();
    });

    describe('create()', () => {
      it('should check for user write access in the involved entities', async () => {
        const service = createSut();
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
          const service = createSut();

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

          const relationshipsInDb = await collectionInDb()
            .find({})
            .sort({
              from: 1,
            })
            .toArray();

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
          const service = createSut();
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
          const service = createSut();
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
          const service = createSut();
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
        const service = createSut();

        const result = await service.create([]);

        expect(result).toEqual([]);
      });
    });
  });
});
