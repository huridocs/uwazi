/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { Template } from '#api/core/domain/template/Template.js';
import { MongoEntitiesDataSource } from '../entity/MongoEntitiesDataSource.js';
import { MongoTemplatesDAO } from '../template/MongoTemplatesDAO.js';
import { search } from '#api/search/index.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';

const factory = getFixturesFactory();
const fixtures = {
  settings: [
    {
      languages: [
        { default: true, key: 'en' as const, label: 'English' },
        { key: 'es' as const, label: 'Spanish' },
        { key: 'pt' as const, label: 'Portuguese' },
      ],
    },
  ],
  templates: [
    factory.template(
      'Template1',
      [factory.property('text', 'text'), factory.property('numeric', 'numeric')],
      { default: true }
    ),
    factory.template('Template2', [factory.property('text', 'text')]),
  ],
};

const createSampleTemplate = (name: string = 'Template') =>
  TemplateBuilder.aTemplate({ id: new ObjectId().toString(), name })
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

const createTemplateWithId = (id: string, name: string = 'Template') =>
  TemplateBuilder.aTemplate({ id, name })
    .withProperties([
      new TextProperty({
        id: 'text',
        template: id,
        label: 'Text',
      }),
      new NumericProperty({
        id: 'numeric',
        template: id,
        label: 'Numeric',
      }),
    ])
    .build();

const createEntity = (languages: string[], template: Template, userId?: string) => {
  const entity = Entity.create({ languages: languages as any, template, userId });
  entity.setPropertyAssignmentsInAllLanguages([
    template.createPropertyAssignment('title', { value: [{ value: `Entity ${entity.sharedId}` }] }),
  ]);
  return entity;
};

const createSut = (accessContext?: AccessContext) => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();

  const sut = new MongoEntitiesDataSource({
    db,
    transactionManager,
    templatesDAO: new MongoTemplatesDAO({ db, transactionManager }),
    options: accessContext ? { accessContext } : undefined,
  });

  return { sut, transactionManager };
};

describe('MongoEntitiesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('bulkInsert', () => {
    it('should insert multiple entities with all their translations', async () => {
      const { sut } = createSut();

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2, entity3]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');

      expect(dbEntities.length).toBe(6);

      const entity1Docs = dbEntities.filter(e => e.sharedId === entity1.sharedId);
      expect(entity1Docs.length).toBe(2);
      expect(entity1Docs.map(e => e.language).sort()).toEqual(['en', 'es']);

      const entity2Docs = dbEntities.filter(e => e.sharedId === entity2.sharedId);
      expect(entity2Docs.length).toBe(2);
      expect(entity2Docs.map(e => e.language).sort()).toEqual(['en', 'es']);

      const entity3Docs = dbEntities.filter(e => e.sharedId === entity3.sharedId);
      expect(entity3Docs.length).toBe(2);
      expect(entity3Docs.map(e => e.language).sort()).toEqual(['en', 'es']);
    });

    it('should index the inserted entities on transaction commit', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);

      await transactionManager.run(async () => {
        await sut.bulkInsert([entity1, entity2]);
      });

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedForEntities = indexed
        .filter(
          e =>
            e.sharedId !== undefined && [entity1.sharedId, entity2.sharedId].includes(e.sharedId)
        )
        .map(e => `${e.sharedId}:${e.language}`)
        .sort();

      expect(indexedForEntities).toEqual(
        [
          `${entity1.sharedId}:en`,
          `${entity1.sharedId}:es`,
          `${entity2.sharedId}:en`,
          `${entity2.sharedId}:es`,
        ].sort()
      );
    });

    it('should handle entities with different templates', async () => {
      const { sut } = createSut();

      const template1 = createSampleTemplate('Template1');
      const template2 = createSampleTemplate('Template2');

      const entity1 = createEntity(['en', 'es'], template1);
      const entity2 = createEntity(['en', 'es'], template2);

      await sut.bulkInsert([entity1, entity2]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');

      expect(dbEntities.length).toBe(4);

      const entity1Docs = dbEntities.filter(e => e.sharedId === entity1.sharedId);
      const entity2Docs = dbEntities.filter(e => e.sharedId === entity2.sharedId);

      expect(entity1Docs.length).toBe(2);
      expect(entity2Docs.length).toBe(2);

      expect(entity1Docs[0].template.toString()).toBe(template1.id);
      expect(entity2Docs[0].template.toString()).toBe(template2.id);
    });

    it('should handle entities with different language counts', async () => {
      const { sut } = createSut();

      const template = createSampleTemplate();

      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es', 'pt'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2, entity3]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');

      expect(dbEntities.length).toBe(6);

      const entity1Docs = dbEntities.filter(e => e.sharedId === entity1.sharedId);
      const entity2Docs = dbEntities.filter(e => e.sharedId === entity2.sharedId);
      const entity3Docs = dbEntities.filter(e => e.sharedId === entity3.sharedId);

      expect(entity1Docs.length).toBe(1);
      expect(entity1Docs.map(e => e.language)).toEqual(['en']);

      expect(entity2Docs.length).toBe(3);
      expect(entity2Docs.map(e => e.language).sort()).toEqual(['en', 'es', 'pt']);

      expect(entity3Docs.length).toBe(2);
      expect(entity3Docs.map(e => e.language).sort()).toEqual(['en', 'es']);
    });

    it('should persist all entity data correctly in the database', async () => {
      const { sut } = createSut();

      const template = createSampleTemplate();
      const userId = new ObjectId().toHexString();
      const entity = createEntity(['en', 'es'], template, userId);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Test Entity Title' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Test Text Value' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
      ]);

      await sut.bulkInsert([entity]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');

      expect(dbEntities.length).toBe(2);

      const enEntity = dbEntities.find(e => e.language === 'en');
      const esEntity = dbEntities.find(e => e.language === 'es');

      expect(enEntity?.sharedId).toBe(entity.sharedId);
      expect(esEntity?.sharedId).toBe(entity.sharedId);

      expect(enEntity?.user?.toString()).toBe(userId);
      expect(esEntity?.user?.toString()).toBe(userId);

      expect(enEntity?.title).toBe('Test Entity Title');
      expect(esEntity?.title).toBe('Test Entity Title');

      expect(enEntity?.template.toString()).toBe(template.id);
      expect(esEntity?.template.toString()).toBe(template.id);

      expect(enEntity?.metadata.text).toEqual([{ value: 'Test Text Value' }]);
      expect(esEntity?.metadata.text).toEqual([{ value: 'Test Text Value' }]);

      expect(enEntity?.metadata.numeric).toEqual([{ value: 42 }]);
      expect(esEntity?.metadata.numeric).toEqual([{ value: 42 }]);
    });

    it('should handle empty array gracefully', async () => {
      const { sut } = createSut();

      await sut.bulkInsert([]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');
      expect(dbEntities.length).toBe(0);
    });
  });

  describe('getSharedIdsByTemplateAndTitles', () => {
    it('should return sharedIds for matching titles within the template', async () => {
      const { sut } = createSut();

      const templateId = new ObjectId().toString();
      const otherTemplateId = new ObjectId().toString();
      const template = createTemplateWithId(templateId);
      const otherTemplate = createTemplateWithId(otherTemplateId);

      const entity1 = createEntity(['en'], template);
      entity1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);
      const entity2 = createEntity(['en'], template);
      entity2.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Beta' }] }),
      ]);
      const entity3 = createEntity(['en'], template);
      entity3.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Gamma' }] }),
      ]);

      const entityOtherTemplate = createEntity(['en'], otherTemplate);
      entityOtherTemplate.setPropertyAssignmentsInAllLanguages([
        otherTemplate.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);
      const entityOtherTemplate2 = createEntity(['en'], otherTemplate);
      entityOtherTemplate2.setPropertyAssignmentsInAllLanguages([
        otherTemplate.createPropertyAssignment('title', { value: [{ value: 'Delta' }] }),
      ]);

      await sut.bulkInsert([entity1, entity2, entity3, entityOtherTemplate, entityOtherTemplate2]);

      const results = await sut.getSharedIdsByTemplateAndTitles(templateId, [
        'Alpha',
        'Beta',
        'Delta',
      ]);

      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          { title: 'Alpha', sharedId: entity1.sharedId },
          { title: 'Beta', sharedId: entity2.sharedId },
        ])
      );
    });
  });

  describe('getSharedIdsByTitles', () => {
    it('should return sharedIds across all templates for matching titles', async () => {
      const { sut } = createSut();

      const templateId = new ObjectId().toString();
      const otherTemplateId = new ObjectId().toString();
      const template = createTemplateWithId(templateId);
      const otherTemplate = createTemplateWithId(otherTemplateId);

      const entity1 = createEntity(['en'], template);
      entity1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);
      const entity2 = createEntity(['en'], template);
      entity2.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Beta' }] }),
      ]);
      const entityOtherTemplate = createEntity(['en'], otherTemplate);
      entityOtherTemplate.setPropertyAssignmentsInAllLanguages([
        otherTemplate.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);

      await sut.bulkInsert([entity1, entity2, entityOtherTemplate]);

      const results = await sut.getSharedIdsByTitles(['Alpha', 'Gamma']);

      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          { title: 'Alpha', sharedId: entity1.sharedId, templateId },
          { title: 'Alpha', sharedId: entityOtherTemplate.sharedId, templateId: otherTemplateId },
        ])
      );
    });
  });

  describe('existsByIdAndTemplateId', () => {
    it('should return true only when sharedId belongs to the given template', async () => {
      const { sut } = createSut();

      const templateId = new ObjectId().toString();
      const otherTemplateId = new ObjectId().toString();
      const template = createTemplateWithId(templateId);
      const otherTemplate = createTemplateWithId(otherTemplateId);

      const targetEntity = createEntity(['en'], template);
      const otherEntity = createEntity(['en'], otherTemplate);
      await sut.bulkInsert([targetEntity, otherEntity]);

      await expect(sut.existsByIdAndTemplateId(targetEntity.sharedId, templateId)).resolves.toBe(
        true
      );
      await expect(
        sut.existsByIdAndTemplateId(targetEntity.sharedId, otherTemplateId)
      ).resolves.toBe(false);
      await expect(sut.existsByIdAndTemplateId('missing-shared-id', templateId)).resolves.toBe(
        false
      );
    });
  });

  describe('indexing on transaction commit', () => {
    let searchIndexSpy: jest.SpyInstance;

    beforeEach(() => {
      searchIndexSpy = jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
    });

    afterEach(() => {
      searchIndexSpy.mockRestore();
    });
    it('calls search.bulkDeleteBySharedId during bulkDelete (legacy ES infra)', async () => {
      const bulkDeleteBySharedIdSpy = jest
        .spyOn(search, 'bulkDeleteBySharedId')
        .mockResolvedValue(undefined);

      const template = createSampleTemplate();
      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es'], template);

      const { sut: setupSut, transactionManager: setupTm } = createSut();
      await setupSut.bulkInsert([entity1, entity2]);
      await setupTm.executeOnCommitHandlers(undefined);

      const { sut } = createSut();
      await sut.bulkDelete([entity1.sharedId, entity2.sharedId]);

      expect(bulkDeleteBySharedIdSpy).toHaveBeenCalledTimes(1);
      expect(bulkDeleteBySharedIdSpy).toHaveBeenCalledWith(
        expect.arrayContaining([entity1.sharedId, entity2.sharedId])
      );

      bulkDeleteBySharedIdSpy.mockRestore();
    });
  });

  describe('bulkUpdate', () => {
    it('should not overwrite permissions or published when updating entity content', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      const existingPermissions = [{ refId: 'user-abc', type: 'user', level: 'write' }];

      // Insert with permissions and published set directly, bypassing the domain mapper
      const templateObjectId = new ObjectId(template.id);
      await testingEnvironment.db.getCollection('entities')!.insertMany([
        {
          _id: new ObjectId(entity.getTranslation('en').id.value),
          sharedId: entity.sharedId,
          language: 'en',
          template: templateObjectId,
          title: 'Original Title',
          metadata: {},
          obsoleteMetadata: [],
          published: true,
          permissions: existingPermissions,
          creationDate: Date.now(),
          editDate: Date.now(),
        },
        {
          _id: new ObjectId(entity.getTranslation('es').id.value),
          sharedId: entity.sharedId,
          language: 'es',
          template: templateObjectId,
          title: 'Original Title',
          metadata: {},
          obsoleteMetadata: [],
          published: true,
          permissions: existingPermissions,
          creationDate: Date.now(),
          editDate: Date.now(),
        },
      ]);

      // Update content via bulkUpdate
      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Updated Title' }] }),
      ]);

      await transactionManager.run(async () => {
        await sut.bulkUpdate([entity]);
      });

      const stored = await testingEnvironment.db.getAllFrom('entities');
      const entityDocs = stored.filter(e => e.sharedId === entity.sharedId);

      entityDocs.forEach(doc => {
        expect(doc.title).toBe('Updated Title'); // content was updated
        expect(doc.published).toBe(true); // not erased
        expect(doc.permissions).toEqual(existingPermissions); // not erased
      });
    });

    it('should unset preview when the entity has no preview', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      await testingEnvironment.db.getCollection('entities')!.insertOne({
        _id: new ObjectId(entity.getTranslation('en').id.value),
        sharedId: entity.sharedId,
        language: 'en',
        template: new ObjectId(template.id),
        title: 'Title',
        metadata: {},
        obsoleteMetadata: [],
        published: false,
        permissions: [],
        preview: 'some-thumbnail.jpg', // preview was previously set
        creationDate: Date.now(),
        editDate: Date.now(),
      });

      // entity domain object has no preview set (undefined)
      await transactionManager.run(async () => {
        await sut.bulkUpdate([entity]);
      });

      const [stored] = await testingEnvironment.db.getAllFrom('entities');
      expect(stored.preview).toBeUndefined();
    });
  });

  describe('unrestricted', () => {
    const collaboratorUser = new User(factory.id('collaborator').toString(), 'collaborator', []);

    it('does not register a duplicate onCommitted search-index handler on the shared transaction manager', () => {
      const { sut, transactionManager } = createSut();

      const onCommittedSpy = jest.spyOn(transactionManager, 'onCommitted');
      const unrestricted = sut.unrestricted();

      expect(onCommittedSpy).not.toHaveBeenCalled();

      // Cached — repeated calls return the same instance and never register
      // an extra handler.
      expect(sut.unrestricted()).toBe(unrestricted);
      expect(onCommittedSpy).not.toHaveBeenCalled();
    });

    it('returns a view that sees entities the actor cannot read', async () => {
      const fixturesWithPermissions: DBFixture = {
        settings: [
          {
            languages: [{ key: 'en', label: 'English', default: true }],
          },
        ],
        templates: [factory.template('Template1', [])],
        entities: [
          factory.entity(
            'readable',
            'Template1',
            {},
            {
              language: 'en',
              permissions: [factory.entityPermission('collaborator', 'user', 'write')],
            }
          ),
          factory.entity(
            'unreadable',
            'Template1',
            {},
            {
              language: 'en',
              permissions: [],
            }
          ),
        ],
      };

      await testingEnvironment.setFixtures(fixturesWithPermissions);

      const { sut } = createSut(AccessContext.forActor(collaboratorUser));

      const enforced = await (await sut.getEntitiesBySharedIds(['readable', 'unreadable'])).all();
      expect(enforced.map(e => e.sharedId)).toEqual(['readable']);

      const unrestricted = await (
        await sut.unrestricted().getEntitiesBySharedIds(['readable', 'unreadable'])
      ).all();
      expect(unrestricted.map(e => e.sharedId).sort()).toEqual(['readable', 'unreadable']);
    });
  });

  describe('create', () => {
    it('should insert a single entity with all its translations', async () => {
      const { sut } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      await sut.create(entity);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');

      expect(dbEntities.length).toBe(2);
      expect(dbEntities.map(e => e.sharedId)).toEqual([entity.sharedId, entity.sharedId]);
      expect(dbEntities.map(e => e.language).sort()).toEqual(['en', 'es']);
    });

    it('should index the created entity on transaction commit', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      await transactionManager.run(async () => {
        await sut.create(entity);
      });

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntity = indexed.find(e => e.sharedId === entity.sharedId);

      expect(indexedEntity?.language).toBe('en');
      expect(indexedEntity?.title).toBe(`Entity ${entity.sharedId}`);
    });
  });

  describe('update', () => {
    it('should update the entity content and reindex it', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);
      await transactionManager.run(async () => {
        await sut.bulkInsert([entity]);
      });

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Updated Title' }] }),
      ]);

      await transactionManager.run(async () => {
        await sut.update(entity);
      });

      const [stored] = await testingEnvironment.db.getAllFrom('entities');
      expect(stored.title).toBe('Updated Title');

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntity = indexed.find(e => e.sharedId === entity.sharedId);

      expect(indexedEntity?.title).toBe('Updated Title');
    });
  });

  describe('getById', () => {
    it('should return the entity for a sharedId', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [factory.template('Template1', [factory.property('text', 'text')])],
        entities: [
          factory.entity('entity-1', 'Template1', {}, { language: 'en' }),
          factory.entity('entity-1', 'Template1', {}, { language: 'es' }),
        ],
      });

      const { sut } = createSut();

      const result = await sut.getById('entity-1');

      expect(result.isOk()).toBe(true);
      const found = result.getDataOrThrow();
      expect(found.sharedId).toBe('entity-1');
      expect(found.languages.sort()).toEqual(['en', 'es']);
    });

    it('should fail with EntityNotFoundError when the entity does not exist', async () => {
      const { sut } = createSut();

      const result = await sut.getById('missing-shared-id');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(EntityNotFoundError);
    });
  });

  describe('getAllBySharedId', () => {
    it('should return entities for the given sharedIds', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [factory.template('Template1', [factory.property('text', 'text')])],
        entities: [
          factory.entity('entity-1', 'Template1', {}),
          factory.entity('entity-2', 'Template1', {}),
        ],
      });

      const { sut } = createSut();

      const result = await sut.getAllBySharedId(['entity-1', 'entity-2']);

      expect(result.isOk()).toBe(true);
      const entities = result.getDataOrThrow();
      expect(entities.map(e => e.sharedId).sort()).toEqual(['entity-1', 'entity-2']);
    });

    it('should fail when no entities are found', async () => {
      const { sut } = createSut();

      const result = await sut.getAllBySharedId(['missing-1', 'missing-2']);

      expect(result.isError()).toBe(true);
      expect(result.getError()?.message).toContain('not found');
    });
  });

  describe('getEntitiesByTemplateId', () => {
    it('should return only entities of the given template', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [
          factory.template('Template1', [factory.property('text', 'text')]),
          factory.template('Template2', [factory.property('text', 'text')]),
        ],
        entities: [
          factory.entity('entity-1', 'Template1', {}),
          factory.entity('entity-2', 'Template2', {}),
        ],
      });

      const { sut } = createSut();

      const entities = await (
        await sut.getEntitiesByTemplateId(factory.id('Template1').toString())
      ).all();

      expect(entities.map(e => e.sharedId)).toEqual(['entity-1']);
    });
  });

  describe('getSharedIdsByTemplateId', () => {
    it('should return sharedIds of entities in the given template', async () => {
      const { sut } = createSut();

      const template1 = createSampleTemplate('Template1');
      const template2 = createSampleTemplate('Template2');
      const entity1 = createEntity(['en', 'es'], template1);
      const entity2 = createEntity(['en'], template1);
      const entity3 = createEntity(['en'], template2);
      await sut.bulkInsert([entity1, entity2, entity3]);

      const sharedIds = await (await sut.getSharedIdsByTemplateId(template1.id)).all();

      expect(sharedIds.sort()).toEqual([entity1.sharedId, entity2.sharedId].sort());
    });
  });

  describe('countByTemplateId', () => {
    it('should count distinct sharedIds in the given template', async () => {
      const { sut } = createSut();

      const template1 = createSampleTemplate('Template1');
      const template2 = createSampleTemplate('Template2');
      const entity1 = createEntity(['en', 'es'], template1);
      const entity2 = createEntity(['en'], template1);
      const entity3 = createEntity(['en'], template2);
      await sut.bulkInsert([entity1, entity2, entity3]);

      await expect(sut.countByTemplateId(template1.id)).resolves.toBe(2);
      await expect(sut.countByTemplateId(template2.id)).resolves.toBe(1);
    });
  });

  describe('getEntitiesByRelatedProperties', () => {
    it('should return entities referenced by the given relationship properties', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [
          factory.template('RelTemplate', [factory.relationshipProp('rel', 'thesaurus1')]),
        ],
        entities: [
          factory.entity('related-1', 'RelTemplate', {}),
          factory.entity('related-2', 'RelTemplate', {}),
        ],
      });

      const { sut } = createSut();

      const templateId = factory.id('RelTemplate').toString();
      const relationshipProperty = new V1RelationshipProperty(
        'rel',
        'rel',
        'Rel',
        'relType',
        templateId
      );
      const template = TemplateBuilder.aTemplate({ id: templateId, name: 'RelTemplate' })
        .withProperties([relationshipProperty])
        .build();
      const source = createEntity(['en'], template);

      source.setPropertyAssignmentsInAllLanguages([
        relationshipProperty.createPropertyAssignment({
          value: [
            { value: 'related-1', label: 'r1', type: 'entity' },
            { value: 'related-2', label: 'r2', type: 'entity' },
          ],
          language: 'en',
        }),
      ]);

      const entities = await (
        await sut.getEntitiesByRelatedProperties([source], [relationshipProperty])
      ).all();

      expect(entities.map(e => e.sharedId).sort()).toEqual(['related-1', 'related-2']);
    });
  });

  describe('getSharedIdsUsingThesaurus', () => {
    it('should return sharedIds of entities with non-empty metadata using thesaurus templates', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [
          factory.template('ThesaurusTemplate', [factory.relationshipProp('rel', 'thesaurus1')]),
          factory.template('OtherTemplate', [factory.property('text', 'text')]),
        ],
        entities: [
          factory.entity('with-metadata', 'ThesaurusTemplate', {
            rel: [{ value: 'value1', label: 'value1' }],
          }),
          factory.entity('empty-metadata', 'ThesaurusTemplate', {}),
          factory.entity('other-template', 'OtherTemplate', { text: [{ value: 'x' }] }),
        ],
      });

      const { sut } = createSut();

      const sharedIds = await sut.getSharedIdsUsingThesaurus(factory.id('thesaurus1').toString());

      expect(sharedIds).toEqual(['with-metadata']);
    });
  });

  describe('deleteReferencesToSharedIds', () => {
    it('should remove references to the deleted sharedIds from metadata', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
        templates: [
          factory.template('RefTemplate', [factory.relationshipProp('rel', 'thesaurus1')]),
        ],
        entities: [
          factory.entity('entity-a', 'RefTemplate', {
            rel: [
              { value: 'deleted-1', label: 'd1' },
              { value: 'keep-1', label: 'k1' },
            ],
          }),
          factory.entity('entity-b', 'RefTemplate', {
            rel: [{ value: 'keep-2', label: 'k2' }],
          }),
        ],
      });

      const { sut, transactionManager } = createSut();

      await transactionManager.run(async () => {
        await sut.deleteReferencesToSharedIds(['deleted-1']);
      });

      const stored = await testingEnvironment.db.getAllFrom('entities');
      const entityA = stored.find(e => e.sharedId === 'entity-a');
      const entityB = stored.find(e => e.sharedId === 'entity-b');

      expect(entityA?.metadata.rel).toEqual([{ value: 'keep-1', label: 'k1' }]);
      expect(entityB?.metadata.rel).toEqual([{ value: 'keep-2', label: 'k2' }]);

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntityA = indexed.find(e => e.sharedId === 'entity-a');

      expect(indexedEntityA?.metadata?.rel).toEqual([{ value: 'keep-1', label: 'k1' }]);
    });
  });

  describe('touchEntitiesBySharedIds', () => {
    it('should update editDate and reindex the sharedIds', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);
      await transactionManager.run(async () => {
        await sut.bulkInsert([entity]);
      });

      await transactionManager.run(async () => {
        await sut.touchEntitiesBySharedIds([entity.sharedId]);
      });

      const [stored] = await testingEnvironment.db.getAllFrom('entities');
      expect(typeof stored.editDate).toBe('number');

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntity = indexed.find(e => e.sharedId === entity.sharedId);

      expect(indexedEntity?.editDate).toBe(stored.editDate);
    });
  });

  describe('deleteMetadataProperties', () => {
    it('should remove the given metadata properties and reindex', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);
      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Title' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Text' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
      ]);
      await transactionManager.run(async () => {
        await sut.bulkInsert([entity]);
      });

      await transactionManager.run(async () => {
        await sut.deleteMetadataProperties(['text'], [entity.sharedId]);
      });

      const [stored] = await testingEnvironment.db.getAllFrom('entities');
      expect(stored.metadata.text).toBeUndefined();
      expect(stored.metadata.numeric).toEqual([{ value: 42 }]);

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntity = indexed.find(e => e.sharedId === entity.sharedId);

      expect(indexedEntity?.metadata?.text).toBeUndefined();
      expect(indexedEntity?.metadata?.numeric).toEqual([{ value: 42 }]);
    });
  });

  describe('renameMetadataProperties', () => {
    it('should rename the given metadata properties and reindex', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);
      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Title' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Text' }] }),
      ]);
      await transactionManager.run(async () => {
        await sut.bulkInsert([entity]);
      });

      await transactionManager.run(async () => {
        await sut.renameMetadataProperties({ text: 'renamed' }, [entity.sharedId]);
      });

      const [stored] = await testingEnvironment.db.getAllFrom('entities');
      expect(stored.metadata.text).toBeUndefined();
      expect(stored.metadata.renamed).toEqual([{ value: 'Text' }]);

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntity = indexed.find(e => e.sharedId === entity.sharedId);

      expect(indexedEntity?.metadata?.text).toBeUndefined();
      expect(indexedEntity?.metadata?.renamed).toEqual([{ value: 'Text' }]);
    });
  });

  describe('bulkUpdateDeprecated', () => {
    it('should update metadata for each translation and reindex', async () => {
      const { sut, transactionManager } = createSut();

      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);
      await transactionManager.run(async () => {
        await sut.bulkInsert([entity]);
      });

      const textProperty = template.properties.find(p => p.name === 'text') as TextProperty;

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Title' }] }),
        textProperty.createPropertyAssignment({ value: [{ value: 'New Text' }] }),
      ]);

      await transactionManager.run(async () => {
        await sut.bulkUpdateDeprecated([entity], [textProperty]);
      });

      const stored = await testingEnvironment.db.getAllFrom('entities');
      stored.forEach(doc => {
        expect(doc.metadata.text).toEqual([{ value: 'New Text' }]);
      });

      await elasticTesting.refresh();
      const indexed = await elasticTesting.getIndexedEntities();
      const indexedEntities = indexed.filter(e => e.sharedId === entity.sharedId);
      indexedEntities.forEach(doc => {
        expect(doc.metadata?.text).toEqual([{ value: 'New Text' }]);
      });
    });
  });

  describe('bulkDelete', () => {
    it('should delete all translations of the given sharedIds from the database', async () => {
      const bulkDeleteBySharedIdSpy = jest
        .spyOn(search, 'bulkDeleteBySharedId')
        .mockResolvedValue(undefined);

      const { sut } = createSut();

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en'], template);
      await sut.bulkInsert([entity1, entity2]);

      await sut.bulkDelete([entity1.sharedId]);

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored.map(e => e.sharedId)).toEqual([entity2.sharedId]);
      expect(bulkDeleteBySharedIdSpy).toHaveBeenCalledWith([entity1.sharedId]);

      bulkDeleteBySharedIdSpy.mockRestore();
    });
  });
});
