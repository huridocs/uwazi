/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { TestUtils } from 'api/common.v2/utils/Test';
import { Entity } from 'api/core/domain/entity/Entity';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { RelationshipSyncJob } from 'api/core/infrastructure/jobs/RelationshipSyncJob';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoEntityMapper } from 'api/core/infrastructure/mongodb/entity/MongoEntityMapper';
import { MongoRelationshipsV1DataSource } from 'api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { PDFService } from 'api/core/infrastructure/services/PDFService';
import { applicationEventsBus, EventsBus } from 'api/core/libs/eventsbus';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { tenants } from 'api/tenants';
import { ObjectId } from 'mongodb';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { EntitiesService } from '../EntitiesService';
import { FilesService } from '../FilesService';

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
  jest.spyOn(jobsDispatcher, 'dispatchMany').mockImplementation(async callback => {
    await callback(jest.fn());
  });

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

  describe('when bulk inserting Entities', () => {
    it('should insert multiple entities into the database', async () => {
      const { sut } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();
      const entity3 = createEntitySample();

      await sut.bulkInsert([entity1, entity2, entity3], {
        actorId: 'actorId',
        tenantName: 'tenantName',
      });

      const entitiesCreated = await testingEnvironment.db.getAllFrom('entities');

      expect(entitiesCreated.length).toBe(3);

      const sharedIds = entitiesCreated.map(e => e.sharedId);
      expect(sharedIds).toContain(entity1.sharedId);
      expect(sharedIds).toContain(entity2.sharedId);
      expect(sharedIds).toContain(entity3.sharedId);
    });

    it('should dispatch RelationshipSyncJob for each entity with correct context', async () => {
      const { sut, dispatcher } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();
      const entity3 = createEntitySample();

      const dispatchMock = jest.fn();
      jest.spyOn(dispatcher, 'dispatchMany').mockImplementation(async callback => {
        await callback(dispatchMock);
      });

      await sut.bulkInsert([entity1, entity2, entity3], {
        actorId: 'testActor',
        tenantName: 'testTenant',
      });

      expect(dispatcher.dispatchMany).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledTimes(3);

      expect(dispatchMock).toHaveBeenCalledWith(RelationshipSyncJob, {
        sharedId: entity1.sharedId,
        targetLanguage: entity1.languages[0],
        templateId: entity1.template.id,
        tenantName: 'testTenant',
        userId: 'testActor',
      });

      expect(dispatchMock).toHaveBeenCalledWith(RelationshipSyncJob, {
        sharedId: entity2.sharedId,
        targetLanguage: entity2.languages[0],
        templateId: entity2.template.id,
        tenantName: 'testTenant',
        userId: 'testActor',
      });

      expect(dispatchMock).toHaveBeenCalledWith(RelationshipSyncJob, {
        sharedId: entity3.sharedId,
        targetLanguage: entity3.languages[0],
        templateId: entity3.template.id,
        tenantName: 'testTenant',
        userId: 'testActor',
      });
    });

    it('should emit EntityCreatedEvent for each entity on commit', async () => {
      const { sut, eventBus, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();

      await sut.bulkInsert([entity1, entity2], {
        actorId: 'actorId',
        tenantName: 'tenantName',
      });

      await transactionManager.executeOnCommitHandlers(undefined);

      expect(eventBus.emit).toHaveBeenCalledTimes(2);

      expect(eventBus.emit).toHaveBeenCalledWith(
        new EntityCreatedEvent({
          entities: MongoEntityMapper.toDBO(entity1) as any,
          targetLanguageKey: entity1.languages[0],
        })
      );

      expect(eventBus.emit).toHaveBeenCalledWith(
        new EntityCreatedEvent({
          entities: MongoEntityMapper.toDBO(entity2) as any,
          targetLanguageKey: entity2.languages[0],
        })
      );
    });

    it('should NOT emit events before transaction commit', async () => {
      const { sut, eventBus, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();

      await sut.bulkInsert([entity1, entity2], {
        actorId: 'actorId',
        tenantName: 'tenantName',
      });

      expect(eventBus.emit).not.toHaveBeenCalled();

      await transactionManager.executeOnCommitHandlers(undefined);

      expect(eventBus.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array gracefully', async () => {
      const { sut, dispatcher, eventBus } = createSut();

      await sut.bulkInsert([], {
        actorId: 'actorId',
        tenantName: 'tenantName',
      });

      const entitiesCreated = await testingEnvironment.db.getAllFrom('entities');
      expect(entitiesCreated.length).toBe(0);

      expect(dispatcher.dispatchMany).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).not.toHaveBeenCalled();
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
