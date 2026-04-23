/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { AccessLevel } from '#api/core/domain/entity/AccessLevel.js';
import { PermissionType } from '#api/core/domain/entity/PermissionType.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '#api/core/infrastructure/jobs/DispatcherAdapter.js';
import { UseCaseContext } from '#api/core/libs/UseCase.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { tenants } from '#api/tenants/index.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { CreateEntityFromPDFUseCase } from '../CreateEntityFromPDF.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';

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
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);

  const entitiesDS = EntitiesDataSourceFactory.forTesting(transactionManager);

  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  const jobsDispatcher = new DispatcherAdapter(
    DefaultDispatcher(tenants.current().name, transactionManager)
  );

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

  const sut = new CreateEntityFromPDFUseCase(
    {
      transactionManager,
      entitiesService,
      propertyAssignmentCreatorServiceStrategy,
    },
    context
  );

  return { sut };
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

    const commonProperties = {
      sharedId: expect.any(String),
      template: factory.id('PDF Document'),
      title: 'PDF Entity Title',
      user: factory.id('user1'),
      creationDate: expect.any(Number),
      editDate: expect.any(Number),
      icon: { _id: null, type: 'Empty' },
      permissions: [
        {
          refId: factory.id('user1').toHexString(),
          type: PermissionType.User,
          level: AccessLevel.Write,
        },
      ],
      metadata: expect.objectContaining({
        description: [{ value: 'A description extracted from PDF' }],
      }),
      published: false,
      obsoleteMetadata: [],
    };

    expect(entities).toEqual([
      {
        _id: expect.any(ObjectId),
        language: 'en',
        ...commonProperties,
      },
      {
        _id: expect.any(ObjectId),
        language: 'es',
        ...commonProperties,
      },
    ]);
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
