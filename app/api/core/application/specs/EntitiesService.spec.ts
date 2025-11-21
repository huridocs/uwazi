/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { ObjectId } from 'mongodb';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { TestUtils } from 'api/common.v2/utils/Test';
import { tenants } from 'api/tenants';
import { EventsBus } from 'api/core/libs/eventsbus';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { MongoEntityMapper } from 'api/core/infrastructure/mongodb/entity/MongoEntityMapper';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { Entity } from 'api/core/domain/entity/Entity';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { RelationshipSyncJob } from 'api/core/infrastructure/jobs/RelationshipSyncJob';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FilesService } from '../FilesService';
import { EntitiesService } from '../EntitiesService';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { PDFService } from 'api/core/infrastructure/services/PDFService';

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

  const fileService = new FilesService({
    idGenerator,
    fileStorage,
    filesDS,
    jobsDispatcher: DefaultDispatcher(tenants.current().name),
    filesIO: new FileContentsIO(),
    pdfService: new PDFService(),
  });

  const dispatcher = DefaultDispatcher(tenants.current().name);

  jest.spyOn(dispatcher, 'dispatch').mockResolvedValue();

  const sut = new EntitiesService({
    entitiesDS,
    eventBus,
    settingsDS,
    templatesDS,
    transactionManager,
    dispatcher,
  });

  return { sut, fileService, eventBus, transactionManager, dispatcher };
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

      await sut.insert(entity);

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
      const { sut, eventBus } = createSut();
      const entity = createEntitySample();

      await sut.insert(entity);

      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should dispatch a RelationshipSyncJob', async () => {
      const { sut, dispatcher } = createSut();
      const entity = createEntitySample();

      await sut.insert(entity);

      expect(dispatcher.dispatch).toHaveBeenCalledWith(RelationshipSyncJob, {
        sharedId: entity.sharedId,
        targetLanguage: entity.languages[0],
        templateId: entity.template.id,
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
