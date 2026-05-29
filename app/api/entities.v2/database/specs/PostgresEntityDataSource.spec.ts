/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { Template } from '#api/core/domain/template/Template.js';
import { PostgresEntityDataSource } from '../PostgresEntityDataSource.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';

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
      new TextProperty({ id: 'text', template: new ObjectId().toString(), label: 'Text' }),
      new NumericProperty({ id: 'numeric', template: new ObjectId().toString(), label: 'Numeric' }),
    ])
    .build();

const createTemplateWithId = (id: string, name: string = 'Template') =>
  TemplateBuilder.aTemplate({ id, name })
    .withProperties([
      new TextProperty({ id: 'text', template: id, label: 'Text' }),
      new NumericProperty({ id: 'numeric', template: id, label: 'Numeric' }),
    ])
    .build();

const createEntity = (languages: string[], template: Template, userId?: string) => {
  const entity = Entity.create({ languages: languages as any, template, userId });
  entity.setPropertyAssignmentsInAllLanguages([
    template.createPropertyAssignment('title', { value: [{ value: `Entity ${entity.sharedId}` }] }),
  ]);
  return entity;
};

const createSut = () => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
  const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });
  const pool = testingPG.pool!;

  const sut = new PostgresEntityDataSource({
    pool,
    transactionManager,
    templatesDS,
    mongoDb: db,
  });

  return { sut, transactionManager };
};

/** Commit mongo TM handlers and flush PG buffer. */
const commit = async (transactionManager: MongoTransactionManager) => {
  await transactionManager.executeOnCommitHandlers(undefined);
};

describe('PostgresEntityDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, false);
    await testingEnvironment.setUpPostgres();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await testingPG.clear();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  // -------------------------------------------------------------------------
  // bulkInsert
  // -------------------------------------------------------------------------
  describe('bulkInsert', () => {
    it('should insert multiple entities with all their translations', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2, entity3]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom('entities');
      expect(rows.length).toBe(6);

      const entity1Rows = rows.filter((r: any) => r.sharedId === entity1.sharedId);
      expect(entity1Rows.length).toBe(2);
      expect(entity1Rows.map((r: any) => r.language).sort()).toEqual(['en', 'es']);
    });

    it('should handle entities with different templates', async () => {
      const { sut, transactionManager } = createSut();
      const template1 = createSampleTemplate('T1');
      const template2 = createSampleTemplate('T2');

      const entity1 = createEntity(['en'], template1);
      const entity2 = createEntity(['en'], template2);

      await sut.bulkInsert([entity1, entity2]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows.length).toBe(2);
      expect(rows.find((r: any) => r.sharedId === entity1.sharedId).templateId).toBe(template1.id);
      expect(rows.find((r: any) => r.sharedId === entity2.sharedId).templateId).toBe(template2.id);
    });

    it('should handle entities with different language counts', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();

      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es', 'pt'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2, entity3]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows.length).toBe(6);

      expect(rows.filter((r: any) => r.sharedId === entity1.sharedId).length).toBe(1);
      expect(rows.filter((r: any) => r.sharedId === entity2.sharedId).length).toBe(3);
      expect(rows.filter((r: any) => r.sharedId === entity3.sharedId).length).toBe(2);
    });

    it('should persist all entity data correctly', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const userId = new ObjectId().toHexString();
      const entity = createEntity(['en', 'es'], template, userId);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Test Title' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Some text' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
      ]);

      await sut.bulkInsert([entity]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows.length).toBe(2);

      const enRow = rows.find((r: any) => r.language === 'en');
      expect(enRow.sharedId).toBe(entity.sharedId);
      expect(enRow.userId).toBe(userId);
      expect(enRow.title).toBe('Test Title');
      expect(enRow.templateId).toBe(template.id);
      expect(enRow.metadata.text).toEqual([{ value: 'Some text' }]);
      expect(enRow.metadata.numeric).toEqual([{ value: 42 }]);
    });

    it('should handle empty array gracefully', async () => {
      const { sut, transactionManager } = createSut();
      await sut.bulkInsert([]);
      await commit(transactionManager);
      const rows = await testingPG.getAllFrom('entities');
      expect(rows.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should insert a single entity with all translations', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Created Title' }] }),
      ]);

      await sut.create(entity);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows.length).toBe(2);
      rows.forEach((r: any) => {
        expect(r.sharedId).toBe(entity.sharedId);
        expect(r.title).toBe('Created Title');
      });
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('should update an existing entity', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      await sut.create(entity);
      await commit(transactionManager);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Updated Title' }] }),
      ]);

      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.update(entity);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].title).toBe('Updated Title');
    });

    it('should set preview to null when entity has no preview', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      // Insert with a preview via raw SQL
      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions","preview")
         VALUES ($1,$2,'en',$3,'Title',false,0,0,'{}','[]','[]','old-preview')`,
        [entity.getTranslation('en').id.value, entity.sharedId, template.id]
      );

      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.update(entity);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].preview).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // bulkUpdate
  // -------------------------------------------------------------------------
  describe('bulkUpdate', () => {
    it('should not overwrite published or permissions', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      const existingPermissions = [{ refId: 'user-abc', type: 'user', level: 'write' }];

      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions")
         VALUES ($1,$2,'en',$3,'Original',true,0,0,'{}','[]',$4),
                ($5,$6,'es',$7,'Original',true,0,0,'{}','[]',$8)`,
        [
          entity.getTranslation('en').id.value,
          entity.sharedId,
          template.id,
          JSON.stringify(existingPermissions),
          entity.getTranslation('es').id.value,
          entity.sharedId,
          template.id,
          JSON.stringify(existingPermissions),
        ]
      );

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'New Title' }] }),
      ]);

      await sut.bulkUpdate([entity]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      const entityRows = rows.filter((r: any) => r.sharedId === entity.sharedId);

      entityRows.forEach((r: any) => {
        expect(r.title).toBe('New Title');
        expect(r.published).toBe(true);
        expect(r.permissions).toEqual(existingPermissions);
      });
    });

    it('should unset preview when entity has no preview', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions","preview")
         VALUES ($1,$2,'en',$3,'Title',false,0,0,'{}','[]','[]','old-preview')`,
        [entity.getTranslation('en').id.value, entity.sharedId, template.id]
      );

      await sut.bulkUpdate([entity]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].preview).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getById
  // -------------------------------------------------------------------------
  describe('getById', () => {
    it('should return the entity when it exists', async () => {
      const { sut, transactionManager } = createSut();

      // Insert template into mongo fixtures for the DS to find
      const templateId = fixtures.templates[0]._id.toString();
      const templateObj = createTemplateWithId(templateId, 'Template1');
      const entity = createEntity(['en', 'es'], templateObj);

      await sut.bulkInsert([entity]);
      await commit(transactionManager);

      const { sut: sut2, transactionManager: tm2 } = createSut();
      const result = await testingEnvironment.runWithContext(async () =>
        sut2.getById(entity.sharedId)
      );

      expect(result.isError()).toBe(false);
      const fetched = result.getData()!;
      expect(fetched.sharedId).toBe(entity.sharedId);
    });

    it('should return EntityNotFoundError when entity does not exist', async () => {
      const { sut } = createSut();
      const result = await testingEnvironment.runWithContext(async () =>
        sut.getById('nonexistent-id')
      );
      expect(result.isError()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getAllBySharedId
  // -------------------------------------------------------------------------
  describe('getAllBySharedId', () => {
    it('should return entities for given sharedIds', async () => {
      const { sut, transactionManager } = createSut();
      const templateId = fixtures.templates[0]._id.toString();
      const template = createTemplateWithId(templateId, 'Template1');
      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en'], template);

      await sut.bulkInsert([entity1, entity2]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const result = await testingEnvironment.runWithContext(async () =>
        sut2.getAllBySharedId([entity1.sharedId, entity2.sharedId])
      );

      expect(result.isError()).toBe(false);
      const entities = result.getData()!;
      expect(entities.length).toBe(2);
    });

    it('should return error when none found', async () => {
      const { sut } = createSut();
      const result = await testingEnvironment.runWithContext(async () =>
        sut.getAllBySharedId(['missing'])
      );
      expect(result.isError()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // countByTemplateId
  // -------------------------------------------------------------------------
  describe('countByTemplateId', () => {
    it('should count distinct sharedIds for a template', async () => {
      const { sut, transactionManager } = createSut();
      const template1 = createSampleTemplate('T1');
      const template2 = createSampleTemplate('T2');

      const e1 = createEntity(['en', 'es'], template1);
      const e2 = createEntity(['en'], template1);
      const e3 = createEntity(['en'], template2);

      await sut.bulkInsert([e1, e2, e3]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const count = await sut2.countByTemplateId(template1.id);
      expect(count).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getSharedIdsByTemplateId
  // -------------------------------------------------------------------------
  describe('getSharedIdsByTemplateId', () => {
    it('should return distinct sharedIds for a template', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();

      const e1 = createEntity(['en', 'es'], template);
      const e2 = createEntity(['en'], template);

      await sut.bulkInsert([e1, e2]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const resultSet = await sut2.getSharedIdsByTemplateId(template.id);
      const ids = await resultSet.all();
      expect(ids.sort()).toEqual([e1.sharedId, e2.sharedId].sort());
    });
  });

  // -------------------------------------------------------------------------
  // getEntitiesByTemplateId / getEntitiesBySharedIds
  // -------------------------------------------------------------------------
  describe('getEntitiesByTemplateId', () => {
    it('should return entities belonging to the given template', async () => {
      const { sut, transactionManager } = createSut();
      const templateId = fixtures.templates[0]._id.toString();
      const template = createTemplateWithId(templateId, 'Template1');
      const otherTemplate = createSampleTemplate('Other');

      const e1 = createEntity(['en'], template);
      const e2 = createEntity(['en'], template);
      const e3 = createEntity(['en'], otherTemplate);

      await sut.bulkInsert([e1, e2, e3]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const resultSet = await testingEnvironment.runWithContext(async () =>
        sut2.getEntitiesByTemplateId(templateId)
      );
      const entities = await resultSet.all();
      expect(entities.length).toBe(2);
      entities.forEach(e => expect(e.template.id).toBe(templateId));
    });
  });

  describe('getEntitiesBySharedIds', () => {
    it('should return entities for the given sharedIds', async () => {
      const { sut, transactionManager } = createSut();
      const templateId = fixtures.templates[0]._id.toString();
      const template = createTemplateWithId(templateId, 'Template1');

      const e1 = createEntity(['en'], template);
      const e2 = createEntity(['en'], template);
      const e3 = createEntity(['en'], template);

      await sut.bulkInsert([e1, e2, e3]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const resultSet = await testingEnvironment.runWithContext(async () =>
        sut2.getEntitiesBySharedIds([e1.sharedId, e3.sharedId])
      );
      const entities = await resultSet.all();
      expect(entities.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getSharedIdsByTemplateAndTitles / getSharedIdsByTitles
  // -------------------------------------------------------------------------
  describe('getSharedIdsByTemplateAndTitles', () => {
    it('should return sharedIds for matching titles within the template', async () => {
      const { sut, transactionManager } = createSut();
      const templateId = new ObjectId().toString();
      const otherTemplateId = new ObjectId().toString();
      const template = createTemplateWithId(templateId);
      const other = createTemplateWithId(otherTemplateId);

      const e1 = createEntity(['en'], template);
      e1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);
      const e2 = createEntity(['en'], other);
      e2.setPropertyAssignmentsInAllLanguages([
        other.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);

      await sut.bulkInsert([e1, e2]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const results = await sut2.getSharedIdsByTemplateAndTitles(templateId, ['Alpha']);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ title: 'Alpha', sharedId: e1.sharedId });
    });
  });

  describe('getSharedIdsByTitles', () => {
    it('should return sharedIds across all templates for matching titles', async () => {
      const { sut, transactionManager } = createSut();
      const templateId = new ObjectId().toString();
      const otherTemplateId = new ObjectId().toString();
      const template = createTemplateWithId(templateId);
      const other = createTemplateWithId(otherTemplateId);

      const e1 = createEntity(['en'], template);
      e1.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);
      const e2 = createEntity(['en'], other);
      e2.setPropertyAssignmentsInAllLanguages([
        other.createPropertyAssignment('title', { value: [{ value: 'Alpha' }] }),
      ]);

      await sut.bulkInsert([e1, e2]);
      await commit(transactionManager);

      const { sut: sut2 } = createSut();
      const results = await sut2.getSharedIdsByTitles(['Alpha']);

      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          { title: 'Alpha', sharedId: e1.sharedId, templateId },
          { title: 'Alpha', sharedId: e2.sharedId, templateId: otherTemplateId },
        ])
      );
    });
  });

  // -------------------------------------------------------------------------
  // touchEntitiesBySharedIds
  // -------------------------------------------------------------------------
  describe('touchEntitiesBySharedIds', () => {
    it('should update editDate for given sharedIds', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity]);
      await commit(transactionManager);

      const before = Date.now();
      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.touchEntitiesBySharedIds([entity.sharedId]);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      rows
        .filter((r: any) => r.sharedId === entity.sharedId)
        .forEach((r: any) => {
          expect(Number(r.editDate)).toBeGreaterThanOrEqual(before);
        });
    });
  });

  // -------------------------------------------------------------------------
  // deleteMetadataProperties
  // -------------------------------------------------------------------------
  describe('deleteMetadataProperties', () => {
    it('should remove the specified properties from metadata', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('text', { value: [{ value: 'hello' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 5 }] }),
      ]);

      await sut.bulkInsert([entity]);
      await commit(transactionManager);

      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.deleteMetadataProperties(['text'], [entity.sharedId]);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].metadata.text).toBeUndefined();
      expect(rows[0].metadata.numeric).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // renameMetadataProperties
  // -------------------------------------------------------------------------
  describe('renameMetadataProperties', () => {
    it('should rename a metadata property key', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en'], template);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('text', { value: [{ value: 'hello' }] }),
      ]);

      await sut.bulkInsert([entity]);
      await commit(transactionManager);

      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.renameMetadataProperties({ text: 'newText' }, [entity.sharedId]);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].metadata.text).toBeUndefined();
      expect(rows[0].metadata.newText).toEqual([{ value: 'hello' }]);
    });
  });

  // -------------------------------------------------------------------------
  // deleteReferencesToSharedIds
  // -------------------------------------------------------------------------
  describe('deleteReferencesToSharedIds', () => {
    it('should remove deleted sharedId values from reference metadata', async () => {
      const { sut, transactionManager } = createSut();

      const selectTemplate = factory.template('SelectTemplate', [
        factory.property('ref_prop', 'select', { content: new ObjectId().toHexString() }),
      ]);
      await testingEnvironment.db.getCollection('templates')!.insertOne(selectTemplate);

      const targetSharedId = 'target-shared-id';
      const templateObj = createTemplateWithId(selectTemplate._id.toString(), 'SelectTemplate');

      // Insert an entity that references the target via raw PG
      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions")
         VALUES ($1,$2,'en',$3,'Affected',false,0,0,$4,'[]','[]')`,
        [
          new ObjectId().toHexString(),
          'affected-entity',
          selectTemplate._id.toString(),
          JSON.stringify({ ref_prop: [{ value: targetSharedId }] }),
        ]
      );

      await sut.deleteReferencesToSharedIds([targetSharedId]);
      await commit(transactionManager);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows[0].metadata.ref_prop).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // bulkDelete
  // -------------------------------------------------------------------------
  describe('bulkDelete', () => {
    it('should delete entities by sharedId', async () => {
      const { sut, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en'], template);

      await sut.bulkInsert([entity1, entity2]);
      await commit(transactionManager);

      const { sut: sut2, transactionManager: tm2 } = createSut();
      await sut2.bulkDelete([entity1.sharedId]);
      await commit(tm2);

      const rows = await testingPG.getAllFrom<any>('entities');
      expect(rows.length).toBe(1);
      expect(rows[0].sharedId).toBe(entity2.sharedId);
    });
  });

  // -------------------------------------------------------------------------
  // getSharedIdsUsingThesaurus
  // -------------------------------------------------------------------------
  describe('getSharedIdsUsingThesaurus', () => {
    it('should return sharedIds of entities using the thesaurus via templates', async () => {
      const { sut, transactionManager } = createSut();

      const thesaurusId = new ObjectId().toHexString();
      const selectTemplate = factory.template('ThesaurusTemplate', [
        { ...factory.property('select_prop', 'select'), content: thesaurusId },
      ]);
      await testingEnvironment.db.getCollection('templates')!.insertOne(selectTemplate);

      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions")
         VALUES ($1,$2,'en',$3,'Has Thesaurus',false,0,0,$4,'[]','[]')`,
        [
          new ObjectId().toHexString(),
          'thesaurus-entity',
          selectTemplate._id.toString(),
          JSON.stringify({ select_prop: [{ value: 'some-value' }] }),
        ]
      );

      // Entity with no metadata (should not be returned)
      await testingPG.pool!.query(
        `INSERT INTO entities ("_id","sharedId","language","templateId","title","published","creationDate","editDate","metadata","obsoleteMetadata","permissions")
         VALUES ($1,$2,'en',$3,'No Metadata',false,0,0,'{}','[]','[]')`,
        [new ObjectId().toHexString(), 'empty-entity', selectTemplate._id.toString()]
      );

      const sharedIds = await testingEnvironment.runWithContext(async () =>
        sut.getSharedIdsUsingThesaurus(thesaurusId)
      );
      await commit(transactionManager);

      expect(sharedIds).toContain('thesaurus-entity');
      expect(sharedIds).not.toContain('empty-entity');
    });
  });
});
