/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { CsvImportDomain } from '../../../domain/CsvImport.js';
import { CsvImportRelationshipPendingValues } from '../../../domain/CsvImportRelationshipPendingValues.js';
import { CsvCreateRelationshipEntitiesJobFactory } from '../../../infrastructure/factories/CsvCreateRelationshipEntitiesJobFactory.js';
import { cleanupCsvV2QueueJobsByImportIds } from '../../../specs/helpers/queueTestCleanup.js';
import { testingPG } from '#api/utils/testing_pg.js';
import {
  applyCsvJobBackendFlags,
  clearCsvStores,
  csvJobBackendConfigs,
  itWithContext,
} from '../../../specs/csvBackendTest.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [
    {
      _id: fixturesFactory.id('csvRelationshipSettings'),
      languages: [
        { key: 'en' as LanguageISO6391, label: 'English', default: true },
        { key: 'es' as LanguageISO6391, label: 'Spanish' },
      ],
      features: { newNameGeneration: false },
    },
  ],
  templates: [
    fixturesFactory.template('csvImportTemplate', []),
    fixturesFactory.template('relatedTemplate', []),
  ],
  users: [fixturesFactory.user({ username: 'relationship-user', role: UserRole.EDITOR })],
};

const createCallbacks = () => ({
  onStart: jest.fn(),
  onProgress: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
});

describe('CsvCreateRelationshipEntitiesJob (integration)', () => {
  const importTemplateId = fixtures.templates[0]._id.toString();
  const relatedTemplateId = fixtures.templates[1]._id.toString();
  const createdImportIds: string[] = [];

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(csvJobBackendConfigs)('$name', ({ postgresCsv, postgresCore }) => {
    beforeEach(async () => {
      applyCsvJobBackendFlags(postgresCsv, postgresCore);
      jest.clearAllMocks();
      await testingEnvironment.setFixtures(fixtures);
      await cleanupCsvV2QueueJobsByImportIds(createdImportIds.splice(0));
      await Promise.all(
        ['entities', 'files'].map(async collectionName => {
          const collection = testingEnvironment.db.getCollection(collectionName);
          if (collection) {
            await collection.deleteMany({});
          }
        })
      );
      await testingPG.clear(['entities', 'files']);
      await clearCsvStores();
    });

    itWithContext('creates relationship entities with all UI languages', async () => {
      const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
        dispatch: jest.fn().mockResolvedValue(undefined),
        dispatchMany: jest.fn().mockResolvedValue(undefined),
      }) as jest.Mocked<JobsDispatcher>;
      const { useCase, csvImportsDS, relationshipPendingValuesDS, entitiesDS } =
        CsvCreateRelationshipEntitiesJobFactory.build({ jobsDispatcher });
      const importId = fixturesFactory.idString('relationship-import');
      createdImportIds.push(importId);
      const [user] = fixtures.users;
      if (!user._id) {
        throw new Error('Test user id is missing');
      }
      const userId = user._id.toString();
      const tenantName = tenants.current().name;

      permissionsContext.setUserInContext(user);

      const csvImport = CsvImportDomain.withStorage(
        CsvImportDomain.create({
          id: importId,
          templateId: importTemplateId,
          createdBy: userId,
          file: { originalName: 'import.csv', mimeType: 'text/csv', size: 10 },
        }),
        `csv-imports/${importId}/original.csv`
      );
      await csvImportsDS.insert(csvImport);

      await relationshipPendingValuesDS.replacePendingValues(importId, [
        CsvImportRelationshipPendingValues.create({
          id: fixturesFactory.idString('rel-pending-1'),
          importId,
          templateId: relatedTemplateId,
          titles: ['New Target Entity'],
          createdAt: Date.now(),
        }),
      ]);

      await useCase.execute({
        importId,
        tenantName,
        userId,
        callbacks: createCallbacks(),
      });

      const entities = await entitiesDS.getEntitiesByTemplateId(relatedTemplateId);
      const created = await entities.all();
      expect(created).toHaveLength(1);
      expect(created[0].languages).toEqual(expect.arrayContaining(['en', 'es']));
    });
  });
});
