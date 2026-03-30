/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { AccessLevel } from '#api/core/domain/entity/AccessLevel.js';
import { PermissionType } from '#api/core/domain/entity/PermissionType.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PDFService } from '#api/core/infrastructure/services/PDFService.js';
import { applicationEventsBus, EventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { UseCaseContext } from '#api/core/libs/UseCase.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { tenants } from '#api/tenants/index.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { FilesService } from '../FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { CreateEntityFromPDFUseCase } from '../CreateEntityFromPDF.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  templates: [
    factory.template('PDF Document', [
      factory.property('description', 'text'),
      factory.property('required_field', 'text', { required: true }),
    ]),
  ],
};

type CreateSutProps = {
  context?: UseCaseContext;
};

const createSut = (props: CreateSutProps = {}) => {
  const { context } = props;
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);

  const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

  const filesDS = FilesDataSourceFactory.default(transactionManager);

  const fileStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);
  const fileService = new FilesService({
    pathManager: new PathManager({ tenant: tenants.current() }),
    idGenerator,
    fileStorage,
    filesDS,
    jobsDispatcher,
    filesIO: new FileContentsIO(),
    pdfService: new PDFService(),
    relV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
    transactionManager,
    eventBus: applicationEventsBus,
  });

  const entitiesService = EntitiesServiceFactory.default({
    entitiesDS,
    eventBus,
    settingsDS,
    transactionManager,
    dispatcher: jobsDispatcher,
  });

  const propertyAssignmentCreatorServiceStrategy = PropertyAssignmentCreatorServiceStrategy.create({
    entitiesDS,
    settingsDS,
    thesauriDS,
    translationsDS,
  });

  jest.spyOn(fileService, 'storeFiles').mockResolvedValue();
  jest.spyOn(fileService, 'insert').mockResolvedValue();

  const sut = new CreateEntityFromPDFUseCase(
    {
      transactionManager,
      idGenerator,
      entitiesService,
      eventBus,
      propertyAssignmentCreatorServiceStrategy,
    },
    context
  );

  return { sut, fileService, eventBus };
};

describe('CreateEntityFromPDFUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a basic entity from PDF', async () => {
    const { sut } = createSut({
      context: {
        targetLanguage: 'en',
        actor: {
          _id: factory.id('user1'),
          username: 'username',
          email: 'email@email.com',
          role: 'collaborator',
        },
        tenant: tenants.current(),
      },
    });

    const entity = await sut.execute({
      templateId: factory.id('PDF Document').toHexString(),
      propertyAssignments: [
        { name: 'title', value: [{ value: 'PDF Entity Title' }] },
        { name: 'description', value: [{ value: 'A description extracted from PDF' }] },
      ],
    });

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    expect(entities).toHaveLength(2); // One per language (en, es)
    expect(entities![0]).toMatchObject({
      template: factory.id('PDF Document'),
      sharedId: expect.any(String),
      title: 'PDF Entity Title',
      published: false,
      permissions: [
        {
          refId: factory.id('user1').toHexString(),
          type: PermissionType.User,
          level: AccessLevel.Write,
        },
      ],
      user: factory.id('user1'),
      metadata: expect.objectContaining({
        description: [{ value: 'A description extracted from PDF' }],
      }),
    });
  });

  it('should NOT validate required properties', async () => {
    const { sut } = createSut({
      context: {
        targetLanguage: 'en',
        actor: {
          _id: factory.id('user1'),
          username: 'username',
          email: 'email@email.com',
          role: 'collaborator',
        },
        tenant: tenants.current(),
      },
    });

    // The required_field property is marked as required, but we don't provide a value
    // This use case should NOT throw an error - it's a permissive operation for PDF creation
    const entity = await sut.execute({
      templateId: factory.id('PDF Document').toHexString(),
      propertyAssignments: [
        { name: 'title', value: [{ value: 'PDF without required field' }] },
        // Intentionally omitting required_field
      ],
    });

    expect(entity).toBeDefined();
    expect(entity.sharedId).toBeDefined();
  });
});
