/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { CsvImportDomain } from '../../../domain/CsvImport.js';
import { CsvImportRelationshipPendingValues } from '../../../domain/CsvImportRelationshipPendingValues.js';
import { CsvCreateRelationshipEntitiesJobFactory } from '../../../infrastructure/factories/CsvCreateRelationshipEntitiesJobFactory.js';

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
  users: [fixturesFactory.user('relationship-user', UserRole.EDITOR)],
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

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv-create-relationship-entities-job');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingEnvironment.setFixtures(fixtures);
    await Promise.all(
      [
        'csv_imports',
        'csv_import_relationships_pending_values',
        'csv_import_relationships_values',
        'entities',
        'files',
      ].map(async collectionName => {
        const collection = testingEnvironment.db.getCollection(collectionName);
        if (collection) {
          await collection.deleteMany({});
        }
      })
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('creates relationship entities with all UI languages', async () => {
    const { useCase, csvImportsDS, relationshipPendingValuesDS, entitiesDS } =
      CsvCreateRelationshipEntitiesJobFactory.build();
    const importId = fixturesFactory.idString('relationship-import');
    const user = fixtures.users[0];
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
