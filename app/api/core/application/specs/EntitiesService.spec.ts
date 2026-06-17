/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoMultiLanguageEntityDataSource } from '#api/core/infrastructure/mongodb/entity/MongoMultiLanguageEntityDataSource.js';
import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';
import { EntityUpdatedEvent as LegacyEntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { EntitiesServiceDeps } from '../EntitiesService.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { search } from '#api/search/index.js';

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

const createSut = (deps?: Partial<EntitiesServiceDeps>) =>
  testingEnvironment.runWithContext(() => {
    const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });
    const eventEmitter = TestUtils.mockClass<EventEmitter>({
      emit: jest.fn().mockResolvedValue(undefined),
    });
    const dispatcher = TestUtils.mockClass<Dispatcher>({
      syncRelationships: jest.fn().mockResolvedValue(undefined),
      cleanupEntities: jest.fn().mockResolvedValue(undefined),
      postProcessPDFs: jest.fn().mockResolvedValue(undefined),
      deleteFilesFromStorage: jest.fn().mockResolvedValue(undefined),
      postProcessTemplateEntities: jest
        .fn()
        .mockImplementation(async (callback: (dispatch: jest.Mock) => Promise<void>) => {
          await callback(jest.fn());
        }),
    });
    return {
      sut: EntitiesServiceFactory.default({
        eventBus,
        eventEmitter,
        dispatcher,
        ...deps,
      }),
      transactionManager: ExecutionContext.transactionManager,
      dispatcher,
      eventBus,
      eventEmitter,
    };
  });

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

const loadEntities = async (sharedIds: string[]) => {
  const ds = testingEnvironment.runWithContext(() =>
    EntitiesDataSourceFactory.default({ transactionManager: TransactionManagerFactory.default() })
  );
  return (await ds.getEntitiesBySharedIds(sharedIds)).all();
};

describe('EntitiesService', () => {
  const getTemplate = async (templateId: ObjectId) => {
    const dbo = await testingEnvironment.db
      .getCollection('templates')
      ?.findOne({ _id: templateId });

    return MongoTemplateMapper.toDomain(dbo as any);
  };

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined);
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('when inserting an Entity', () => {
    it('should emit an EntityCreatedEvent', async () => {
      const { sut, eventBus, transactionManager } = createSut();
      const entity = createEntitySample();

      await transactionManager.run(async () => {
        await sut.insert(entity, {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
      });

      const [entityCreated] = await testingEnvironment.db.getAllFrom('entities');

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
      let emitCalledDuringTransaction = false;

      await transactionManager.run(async () => {
        await sut.insert(entity, {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
        emitCalledDuringTransaction = (eventBus.emit as any).mock.calls.length > 0;
      });

      expect(emitCalledDuringTransaction).toBe(false);
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should provision grant access to the entity', async () => {
      const { sut, transactionManager } = createSut();
      const entity = createEntitySample();

      await transactionManager.run(async () =>
        sut.insert(entity, {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        })
      );

      const entityCreated = await testingEnvironment.db
        .getCollection('entities')
        ?.findOne({ sharedId: entity.sharedId });

      expect(entityCreated).toMatchObject({
        language: 'en',
        sharedId: entity.sharedId,
        permissions: [{ refId: 'actorId', type: GrantType.User, level: AccessLevel.Write }],
        published: false,
      });
    });

    it('should dispatch a RelationshipSyncJob', async () => {
      const { sut, dispatcher, transactionManager } = createSut();
      const entity = createEntitySample();

      await transactionManager.run(async () => {
        await sut.insert(entity, {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
      });

      expect(dispatcher.syncRelationships).toHaveBeenCalledWith([
        {
          sharedId: entity.sharedId,
          targetLanguage: entity.languages[0],
          templateId: entity.template.id,
          tenantName: 'tenantName',
          userId: 'actorId',
        },
      ]);
    });
  });

  describe('when bulk inserting Entities', () => {
    it('should insert multiple entities into the database', async () => {
      const { sut, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();
      const entity3 = createEntitySample();

      await transactionManager.run(async () =>
        sut.bulkInsert([entity1, entity2, entity3], {
          actorId: 'actorId',
          tenantName: 'tenantName',
          targetLanguage: 'en',
        })
      );

      const entitiesCreated = await testingEnvironment.db.getAllFrom('entities');

      expect(entitiesCreated.length).toBe(3);

      const sharedIds = entitiesCreated.map(e => e.sharedId);
      expect(sharedIds).toContain(entity1.sharedId);
      expect(sharedIds).toContain(entity2.sharedId);
      expect(sharedIds).toContain(entity3.sharedId);
    });

    it('should dispatch RelationshipSyncJob for each entity with correct context', async () => {
      const { sut, dispatcher, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();
      const entity3 = createEntitySample();

      await transactionManager.run(async () => {
        await sut.bulkInsert([entity1, entity2, entity3], {
          targetLanguage: 'en',
          actorId: 'testActor',
          tenantName: 'testTenant',
        });
      });

      expect(dispatcher.syncRelationships).toHaveBeenCalledTimes(1);
      expect(dispatcher.syncRelationships).toHaveBeenCalledWith([
        {
          sharedId: entity1.sharedId,
          targetLanguage: entity1.languages[0],
          templateId: entity1.template.id,
          tenantName: 'testTenant',
          userId: 'testActor',
        },
        {
          sharedId: entity2.sharedId,
          targetLanguage: entity2.languages[0],
          templateId: entity2.template.id,
          tenantName: 'testTenant',
          userId: 'testActor',
        },
        {
          sharedId: entity3.sharedId,
          targetLanguage: entity3.languages[0],
          templateId: entity3.template.id,
          tenantName: 'testTenant',
          userId: 'testActor',
        },
      ]);
    });

    it('should emit EntityCreatedEvent for each entity on commit', async () => {
      const { sut, eventBus, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();

      await transactionManager.run(async () => {
        await sut.bulkInsert([entity1, entity2], {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
      });

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
      let emitCalledDuringTransaction = false;

      await transactionManager.run(async () => {
        await sut.bulkInsert([entity1, entity2], {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
        emitCalledDuringTransaction = (eventBus.emit as any).mock.calls.length > 0;
      });

      expect(emitCalledDuringTransaction).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledTimes(2);
    });

    it('should provision access to all entities', async () => {
      const { sut, transactionManager } = createSut();
      const entity1 = createEntitySample();
      const entity2 = createEntitySample();
      const entity3 = createEntitySample();

      await transactionManager.run(async () =>
        sut.bulkInsert([entity1, entity2, entity3], {
          actorId: 'actorId',
          tenantName: 'tenantName',
          targetLanguage: 'en',
        })
      );

      const entitiesCreated = await testingEnvironment.db.getAllFrom('entities');

      expect(entitiesCreated).toMatchObject([
        {
          language: 'en',
          sharedId: entity1.sharedId,
          permissions: [{ refId: 'actorId', type: GrantType.User, level: AccessLevel.Write }],
          published: false,
        },
        {
          language: 'en',
          sharedId: entity2.sharedId,
          permissions: [{ refId: 'actorId', type: GrantType.User, level: AccessLevel.Write }],
          published: false,
        },
        {
          sharedId: entity3.sharedId,
          permissions: [{ refId: 'actorId', type: GrantType.User, level: AccessLevel.Write }],
          published: false,
        },
      ]);
    });

    it('should handle empty array gracefully', async () => {
      const { sut, dispatcher, eventBus, transactionManager } = createSut();

      await transactionManager.run(async () => {
        await sut.bulkInsert([], {
          targetLanguage: 'en',
          actorId: 'actorId',
          tenantName: 'tenantName',
        });
      });

      const entitiesCreated = await testingEnvironment.db.getAllFrom('entities');
      expect(entitiesCreated.length).toBe(0);

      expect(dispatcher.syncRelationships).toHaveBeenCalledTimes(1);
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

  describe('when upserting an Entity', () => {
    it('should not call data source and event emitter if it has not changed', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const entitiesDS = TestUtils.mockClass<MongoMultiLanguageEntityDataSource>({
        update: jest.fn(),
      });
      const { sut, transactionManager, eventBus } = createSut({ eventEmitter, entitiesDS });
      await testingEnvironment.setFixtures({
        ...fixtures,
        entities: [
          ...factory.entityInMultipleLanguages(
            ['en', 'es'],
            'entity-1',
            'Document',
            { text: [{ value: 'Entity 1 original text' }], numeric: [{ value: 10 }] },
            {
              title: 'Entity 1 original title',
              icon: { _id: 'icon-original-1', type: 'image', label: 'Original Icon 1' },
              obsoleteMetadata: [],
            }
          ),
        ],
      });

      const [entity] = await loadEntities(['entity-1']);

      await transactionManager.run(async () =>
        sut.update(entity, { actorId: 'actorId', targetLanguage: 'en' })
      );

      expect(entitiesDS.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();

      entity.update({ icon: { id: 'icon-123', type: 'image', label: 'Icon Label' } });

      await transactionManager.run(async () =>
        sut.update(entity, { actorId: 'actorId', targetLanguage: 'en' })
      );

      expect(entitiesDS.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith(
        new LegacyEntityUpdatedEvent({
          before: MongoEntityMapper.toDBO(entity.previousVersion) as any,
          after: MongoEntityMapper.toDBO(entity) as any,
          targetLanguageKey: 'en',
        })
      );
    });
  });

  describe('when updating multiple entities', () => {
    const updateMultipleFixtures: DBFixture = {
      ...fixtures,
      entities: [
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity-1',
          'Document',
          { text: [{ value: 'Entity 1 original text' }], numeric: [{ value: 10 }] },
          {
            title: 'Entity 1 original title',
            icon: { _id: 'icon-original-1', type: 'image', label: 'Original Icon 1' },
            obsoleteMetadata: [],
          }
        ),
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity-2',
          'Document',
          { text: [{ value: 'Entity 2 original text' }], numeric: [{ value: 20 }] },
          {
            title: 'Entity 2 original title',
            icon: { _id: 'icon-original-2', type: 'image', label: 'Original Icon 2' },
            obsoleteMetadata: [],
          }
        ),
      ],
    };

    beforeEach(async () => testingEnvironment.setFixtures(updateMultipleFixtures));

    it('should persist changes for all changed entities in the database', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const { sut, transactionManager } = createSut({ eventEmitter });
      const template = await getTemplate(factory.id('Document'));

      const entities = await loadEntities(['entity-1', 'entity-2']);
      const entity1 = entities.find(e => e.sharedId === 'entity-1')!;
      const entity2 = entities.find(e => e.sharedId === 'entity-2')!;

      entity1.update({ icon: { id: 'icon-updated-1', type: 'image', label: 'Updated Icon 1' } });
      entity1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', {
          value: [{ value: 'Entity 1 updated title' }],
        }),
        template.createPropertyAssignment('text', { value: [{ value: 'Entity 1 updated text' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 11 }] }),
      ]);

      entity2.update({ icon: { id: 'icon-updated-2', type: 'image', label: 'Updated Icon 2' } });
      entity2.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', {
          value: [{ value: 'Entity 2 updated title' }],
        }),
        template.createPropertyAssignment('text', { value: [{ value: 'Entity 2 updated text' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 22 }] }),
      ]);

      await transactionManager.run(async () => {
        await sut.updateMultiple([entity1, entity2], { actorId: 'actorId', targetLanguage: 'en' });
      });

      const allDocs = await testingEnvironment.db.getAllFrom('entities');

      expect(allDocs.filter(d => d.sharedId === 'entity-1')).toHaveLength(2);
      allDocs
        .filter(d => d.sharedId === 'entity-1')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({
            _id: 'icon-updated-1',
            type: 'image',
            label: 'Updated Icon 1',
          });
          expect(doc.title).toBe('Entity 1 updated title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 1 updated text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 11 }]);
        });

      expect(allDocs.filter(d => d.sharedId === 'entity-2')).toHaveLength(2);
      allDocs
        .filter(d => d.sharedId === 'entity-2')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({
            _id: 'icon-updated-2',
            type: 'image',
            label: 'Updated Icon 2',
          });
          expect(doc.title).toBe('Entity 2 updated title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 2 updated text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 22 }]);
        });
    });

    it('should skip entities that have not changed and only update the changed ones', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const { sut, transactionManager } = createSut({ eventEmitter });
      const template = await getTemplate(factory.id('Document'));

      const entities = await loadEntities(['entity-1', 'entity-2']);
      const entity1 = entities.find(e => e.sharedId === 'entity-1')!;
      const entity2 = entities.find(e => e.sharedId === 'entity-2')!;

      // Only mutate entity-1; entity-2 is loaded fresh and has hasChanged === false
      entity1.update({ icon: { id: 'icon-updated-1', type: 'image', label: 'Updated Icon 1' } });
      entity1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', {
          value: [{ value: 'Entity 1 updated title' }],
        }),
        template.createPropertyAssignment('text', { value: [{ value: 'Entity 1 updated text' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 99 }] }),
      ]);

      await transactionManager.run(async () => {
        await sut.updateMultiple([entity1, entity2], { actorId: 'actorId', targetLanguage: 'en' });
      });

      const allDocs = await testingEnvironment.db.getAllFrom('entities');

      allDocs
        .filter(d => d.sharedId === 'entity-1')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({ _id: 'icon-updated-1' });
          expect(doc.title).toBe('Entity 1 updated title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 1 updated text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 99 }]);
        });

      allDocs
        .filter(d => d.sharedId === 'entity-2')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({ _id: 'icon-original-2' });
          expect(doc.title).toBe('Entity 2 original title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 2 original text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 20 }]);
        });
    });

    it('should emit an EntityUpdatedEvent with correct before/after payload for each changed entity', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const { sut, transactionManager, eventBus } = createSut({ eventEmitter });
      const template = await getTemplate(factory.id('Document'));

      const entities = await loadEntities(['entity-1', 'entity-2']);
      const entity1 = entities.find(e => e.sharedId === 'entity-1')!;
      const entity2 = entities.find(e => e.sharedId === 'entity-2')!;

      entity1.update({ icon: { id: 'icon-after-1', type: 'image', label: 'After Icon 1' } });
      entity1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Title after 1' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Text after 1' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 11 }] }),
      ]);

      entity2.update({ icon: { id: 'icon-after-2', type: 'image', label: 'After Icon 2' } });
      entity2.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Title after 2' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Text after 2' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 22 }] }),
      ]);

      const expectedEvent1 = EntityUpdatedEvent.create({
        entity: entity1,
        userId: 'actorId',
        targetLanguage: 'en',
      });
      const expectedEvent2 = EntityUpdatedEvent.create({
        entity: entity2,
        userId: 'actorId',
        targetLanguage: 'en',
      });

      await transactionManager.run(async () => {
        await sut.updateMultiple([entity1, entity2], { actorId: 'actorId', targetLanguage: 'en' });
      });

      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(expectedEvent1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(expectedEvent2);

      expect(eventBus.emit).toHaveBeenCalledTimes(2);
      expect(eventBus.emit).toHaveBeenCalledWith(
        new LegacyEntityUpdatedEvent({
          before: MongoEntityMapper.toDBO(entity1.previousVersion) as any,
          after: MongoEntityMapper.toDBO(entity1) as any,
          targetLanguageKey: 'en',
        })
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        new LegacyEntityUpdatedEvent({
          before: MongoEntityMapper.toDBO(entity2.previousVersion) as any,
          after: MongoEntityMapper.toDBO(entity2) as any,
          targetLanguageKey: 'en',
        })
      );
    });

    it('should not update the database or emit events when no entity has changed', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const { sut, transactionManager, eventBus } = createSut({ eventEmitter });

      const entities = await loadEntities(['entity-1', 'entity-2']);

      await transactionManager.run(async () => {
        await sut.updateMultiple(entities, { actorId: 'actorId', targetLanguage: 'en' });
      });

      const allDocs = await testingEnvironment.db.getAllFrom('entities');

      allDocs
        .filter(d => d.sharedId === 'entity-1')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({ _id: 'icon-original-1' });
          expect(doc.title).toBe('Entity 1 original title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 1 original text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 10 }]);
        });

      allDocs
        .filter(d => d.sharedId === 'entity-2')
        .forEach(doc => {
          expect(doc.icon).toMatchObject({ _id: 'icon-original-2' });
          expect(doc.title).toBe('Entity 2 original title');
          expect(doc.metadata.text).toEqual([{ value: 'Entity 2 original text' }]);
          expect(doc.metadata.numeric).toEqual([{ value: 20 }]);
        });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should do nothing when passed an empty array', async () => {
      const eventEmitter = TestUtils.mockClass<EventEmitter>({ emit: jest.fn() });
      const { sut, transactionManager, eventBus } = createSut({ eventEmitter });

      await transactionManager.run(async () => {
        await sut.updateMultiple([], { actorId: 'actorId', targetLanguage: 'en' });
      });

      const allDocs = await testingEnvironment.db.getAllFrom('entities');
      expect(allDocs.filter(d => d.sharedId === 'entity-1')).toHaveLength(2);
      expect(allDocs.filter(d => d.sharedId === 'entity-2')).toHaveLength(2);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should throw when called outside a transaction', async () => {
      const { sut } = createSut();

      await expect(
        sut.updateMultiple([], { actorId: 'actorId', targetLanguage: 'en' })
      ).rejects.toThrow('This operation must be called within a transaction');
    });
  });
});
