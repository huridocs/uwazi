/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { RelationshipSyncJob } from '#api/core/infrastructure/jobs/RelationshipSyncJob.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { PDFService } from '#api/core/infrastructure/services/PDFService.js';
import { applicationEventsBus, EventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';
import { tenants } from '#api/tenants/index.js';
import { ObjectId } from 'mongodb';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { FilesService } from '#api/core/application/FilesService.js';

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
    factory.template(
      'Document',
      [factory.property('text', 'text'), factory.property('numeric', 'numeric')],
      { default: true }
    ),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

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

  jest.spyOn(jobsDispatcher, 'dispatch').mockResolvedValue();

  const sut = new EntitiesService({
    entitiesDS,
    eventBus,
    settingsDS,
    templatesDS,
    transactionManager,
    dispatcher: jobsDispatcher,
  });

  return { sut, fileService, eventBus, transactionManager, dispatcher: jobsDispatcher };
};

const createSampleTemplate = () =>
  TemplateBuilder.aTemplate({ id: new ObjectId().toString() })
    .withProperties([
      new TextProperty({
        id: 'text',
        template: new ObjectId().toString(),
        label: 'Text',
      }),
      new NumericProperty({
        id: 'numeric',
        template: new ObjectId().toString(),
        label: 'Numeric',
      }),
    ])
    .build();

const createEntitySample = () => {
  const template = createSampleTemplate();
  const entity = Entity.create({ languages: ['en'], template });
  entity.setPropertyAssignmentsInAllLanguages([
    template.createPropertyAssignment('title', { value: [{ value: 'My entity title' }] }),
  ]);

  return entity;
};

describe('EntitiesService', () => {
  const getTemplate = async (templateId: ObjectId) => {
    const dbo = await testingEnvironment.db
      .getCollection('templates')
      ?.findOne({ _id: templateId });

    return MongoTemplateMapper.toDomain(dbo as any);
  };

  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when inserting an Entity', () => {
    it('should emit an EntityCreatedEvent', async () => {
      const { sut, eventBus, transactionManager } = createSut();
      const entity = createEntitySample();

      await sut.insert(entity, { actorId: 'actorId', tenantName: 'tenantName' });

      const [entityCreated] = await testingEnvironment.db.getAllFrom('entities');
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityCreated.sharedId).toEqual(entity.sharedId);

      expect(eventBus.emit).toHaveBeenCalledWith(
        new EntityCreatedEvent({
          entities: MongoEntityMapper.toDBO(entity) as any,
          targetLanguageKey: entity.languages[0],
        })
      );
    });

    it('should emit an EntityCreatedEvent inside onCommit handler', async () => {
      const { sut, transactionManager, eventBus } = createSut();
      const entity = createEntitySample();

      await sut.insert(entity, { actorId: 'actorId', tenantName: 'tenantName' });

      expect(eventBus.emit).not.toHaveBeenCalled();

      await transactionManager.executeOnCommitHandlers(undefined);

      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should dispatch a RelationshipSyncJob', async () => {
      const { sut, dispatcher } = createSut();
      const entity = createEntitySample();

      await sut.insert(entity, { actorId: 'actorId', tenantName: 'tenantName' });

      expect(dispatcher.dispatch).toHaveBeenCalledWith(RelationshipSyncJob, {
        sharedId: entity.sharedId,
        targetLanguage: entity.languages[0],
        templateId: entity.template.id,
        tenantName: 'tenantName',
        userId: 'actorId',
      });
    });
  });

  describe('when creating an Entity', () => {
    it('should create an entity', async () => {
      const { sut } = createSut();
      const template = await getTemplate(factory.id('Document'));

      const expectedEntity = Entity.create({
        template,
        languages: ['en', 'es'],
        userId: 'user1',
        icon: { id: 'iconId', type: 'image/png', label: 'Icon Label' },
      });

      const entity = await sut.create({
        templateId: factory.id('Document').toHexString(),
        userId: 'user1',
        icon: { id: 'iconId', type: 'image/png', label: 'Icon Label' },
      });

      expect(entity.template.id).toEqual(expectedEntity.template.id);
      expect(entity.languages).toEqual(expectedEntity.languages);
      expect(entity.icon).toEqual(expectedEntity.icon);
      expect(entity.userId).toEqual(expectedEntity.userId);
    });

    it('should use default template when none is provided', async () => {
      const { sut } = createSut();
      const template = await getTemplate(factory.id('Document'));

      const expectedEntity = Entity.create({
        template,
        languages: ['en', 'es'],
      });

      const entity = await sut.create({});

      expect(entity.template.id).toEqual(expectedEntity.template.id);
      expect(entity.languages).toEqual(expectedEntity.languages);
      expect(entity.icon).toEqual(expectedEntity.icon);
      expect(entity.userId).toEqual(expectedEntity.userId);
    });
  });
});
