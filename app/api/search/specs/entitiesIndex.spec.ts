import { legacyLogger } from '#api/log/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import db from '#api/utils/testing_db.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { UserRole } from '#shared/types/userSchema.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { FileType } from '#shared/types/fileType.js';
import { elastic } from '../elastic.js';
import { reindexAll, updateMapping } from '../entitiesIndex.js';
import { search } from '../search.js';
import { fixtures as fixturesForIndexErrors } from './fixtures_elastic_errors.js';

const forceIndexingOfNumberBasedProperty = async () => {
  await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
};

describe('entitiesIndex', () => {
  const elasticIndex = 'index_for_entities_index_testing';
  const userFactory = new UserInContextMockFactory();

  beforeEach(async () => {
    await testingEnvironment.setUp({}, elasticIndex);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('indexEntities', () => {
    const loadFailingFixtures = async () => {
      await testingEnvironment.setUp(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      // force indexing will ensure that all exceptions are mapper_parsing. Otherwise you get different kinds of exceptions
      await forceIndexingOfNumberBasedProperty();
      await elasticTesting.refresh();
    };

    it('indexing without errors', async () => {
      jest.spyOn(legacyLogger, 'error').mockImplementation(() => {});
      await loadFailingFixtures();
      await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
      expect(legacyLogger.error).not.toHaveBeenCalled();
      await elasticTesting.refresh();
      const indexedEntities = await testingEnvironment.runWithContext(async () =>
        search.search({}, 'en')
      );
      expect(indexedEntities.rows.length).toBe(1);
    });
  });

  describe('indexEntities by query', () => {
    it('should only index the entities that match the query', async () => {
      await db.setupFixturesAndContext({
        entities: [
          { title: 'title1', language: 'en' },
          { title: 'titulo1', language: 'es' },
          { title: 'title2', language: 'en' },
          { title: 'titulo2', language: 'es' },
          { title: 'title3', language: 'en' },
          { title: 'titulo3', language: 'es' },
          { title: 'title4', language: 'en' },
          { title: 'titulo4', language: 'es' },
          { title: 'title5', language: 'en' },
          {
            title: 'titulo5',
            language: 'es',
            permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
          },
        ],
      });

      await search.indexEntities({ language: 'es' }, '', 2);
      await elasticTesting.refresh();

      const indexedEntities = await elasticTesting.getIndexedEntities();

      expect(indexedEntities).toEqual([
        expect.objectContaining({ title: 'titulo1' }),
        expect.objectContaining({ title: 'titulo2' }),
        expect.objectContaining({ title: 'titulo3' }),
        expect.objectContaining({ title: 'titulo4' }),
        expect.objectContaining({
          title: 'titulo5',
          permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
        }),
      ]);
    });
  });

  describe('indexEntities by query (postgresEntities flag on)', () => {
    const factory = getFixturesFactory({ convertIdToString: true });

    const pgFixtures = {
      templates: [factory.template('t1', [])],
      entities: [
        factory.entity('e1', 't1', {}, { language: 'en', title: 'Entity One' }),
        factory.entity('e2', 't1', {}, { language: 'en', title: 'Entity Two' }),
        factory.entity('e3', 't1', {}, { language: 'en', title: 'Entity Three' }),
      ],
    };

    beforeAll(async () => {
      // Enables Postgres fixture mirroring before the first beforeEach runs -
      // otherwise the very first test's fixtures never make it into Postgres.
      // Pass the file's own elasticIndex constant explicitly so this never
      // resets/regenerates testingEnvironment.elasticIndex for the rest of the file.
      await testingEnvironment.setUp({}, { elasticIndex, postgres: true });
    });

    beforeEach(async () => {
      await testingEnvironment.setUp(pgFixtures, { elasticIndex, postgres: true });
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresEntities: true, postgresFiles: true },
      });
      // setUp's own reindex ran with the flag still off (indexing every entity via Mongo);
      // clear the index so each test only sees what it indexes itself.
      await elasticTesting.resetIndex();
    });

    it('indexes every entity when the query is empty', async () => {
      await testingEnvironment.runWithContext(async () => search.indexEntities({}));
      await elasticTesting.refresh();

      const indexed = await elasticTesting.getIndexedEntities();
      expect(indexed.map(e => e.title)).toEqual(['Entity One', 'Entity Three', 'Entity Two']);
    });

    it('only indexes the entity matching a sharedId filter', async () => {
      await testingEnvironment.runWithContext(async () => search.indexEntities({ sharedId: 'e1' }));
      await elasticTesting.refresh();

      const indexed = await elasticTesting.getIndexedEntities();
      expect(indexed.map(e => e.title)).toEqual(['Entity One']);
    });

    it('only indexes the entities matching a sharedId.$in filter', async () => {
      await testingEnvironment.runWithContext(async () =>
        search.indexEntities({ sharedId: { $in: ['e1', 'e2'] } })
      );
      await elasticTesting.refresh();

      const indexed = await elasticTesting.getIndexedEntities();
      expect(indexed.map(e => e.title)).toEqual(['Entity One', 'Entity Two']);
    });

    it('only indexes the entities matching an _id.$in filter', async () => {
      const ids = [factory.idString('e2-en'), factory.idString('e3-en')];
      await testingEnvironment.runWithContext(async () =>
        search.indexEntities({ _id: { $in: ids } })
      );
      await elasticTesting.refresh();

      const indexed = await elasticTesting.getIndexedEntities();
      expect(indexed.map(e => e.title)).toEqual(['Entity Three', 'Entity Two']);
    });
  });

  describe('updateMapping', () => {
    it('should update the mapping provided by the factory', async () => {
      const template = {
        _id: '123',
        name: 'test',
        properties: [
          { _id: '123', name: 'name', type: 'text' },
          { name: 'dob', type: 'date' },
          { name: 'country', type: 'select' },
        ],
      };
      await updateMapping([template]);
      const mapping = await elastic.indices.getMapping();
      const mappedProps = mapping.body[elasticIndex].mappings.properties.metadata.properties;
      expect(mappedProps.name).toMatchSnapshot();
      expect(mappedProps.dob).toMatchSnapshot();
      expect(mappedProps.country).toMatchSnapshot();
    });
  });

  describe('reindexAll', () => {
    it('should reindex the entities with fullText', async () => {
      const entities = [
        { sharedId: 'title1', title: 'title1', language: 'en' },
        { sharedId: 'titulo1', title: 'titulo1', language: 'es' },
        { sharedId: 'title2', title: 'title2', language: 'en' },
        { sharedId: 'titulo2', title: 'titulo2', language: 'es' },
      ];

      const files: FileType[] = [
        {
          entity: 'title1',
          originalname: 'file1',
          filename: 'file1',
          type: 'document',
          mimetype: 'application/pdf',
          language: 'en',
          fullText: { 1: 'page1', 2: 'page2' },
          totalPages: 0,
        },
      ];

      await db.setupFixturesAndContext({ entities, files });
      userFactory.mock({
        _id: 'user1',
        username: 'collaborator',
        role: UserRole.COLLABORATOR,
        email: 'col@test.com',
      });

      await search.indexEntities({});
      await elasticTesting.refresh();

      await reindexAll([], search);
      await elasticTesting.refresh();

      expect(await elasticTesting.getIndexedEntities('')).toEqual([
        expect.objectContaining({ title: 'title1' }),
        expect.objectContaining({ fullText_other: 'page1\fpage2' }),
        expect.objectContaining({ title: 'titulo1' }),
        expect.objectContaining({ title: 'title2' }),
        expect.objectContaining({ title: 'titulo2' }),
      ]);
    });

    it('should delete a field from the mapping', async () => {
      const templateA = {
        _id: '123',
        name: 'template A',
        properties: [
          { name: 'name', type: 'text' },
          { name: 'dob', type: 'date' },
          { name: 'country', type: 'select' },
        ],
      };

      await updateMapping([templateA]);
      templateA.properties = [
        { name: 'name', type: 'text' },
        { name: 'country', type: 'select' },
      ];
      await reindexAll([templateA], search);
      const mapping = await elastic.indices.getMapping();

      expect(
        mapping.body[elasticIndex].mappings.properties.metadata.properties.dob
      ).toBeUndefined();
    });
  });

  it('should fallback to "other" language if the language is not fully supported by elastic search', async () => {
    const sharedId = db.id().toString();
    const entities: EntitySchema[] = [{ sharedId, title: 'Entity 1', language: 'en' }];
    const files: FileType[] = [
      {
        entity: sharedId,
        originalname: 'file1',
        filename: 'file1',
        type: 'document',
        mimetype: 'application/pdf',
        language: 'ukr', // Ukrainian is not fully supported by elastic search
        fullText: {},
        totalPages: 0,
      },
    ];

    await db.setupFixturesAndContext({ entities, files });

    await elasticTesting.reindex();

    const [indexedFile] = await elasticTesting.getIndexedFullTextFromFiles();

    expect(indexedFile.fullText_other).toBeDefined();
    expect(indexedFile.fullText_undefined).not.toBeDefined();
  });
});
