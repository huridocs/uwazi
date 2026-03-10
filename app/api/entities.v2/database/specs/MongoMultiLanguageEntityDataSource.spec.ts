import { Entity } from 'api/core/domain/entity/Entity';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { MongoMultiLanguageEntityDataSource } from '../MongoMultiLanguageEntityDataSource';
import { Template } from 'api/core/domain/template/Template';

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

const createEntity = (languages: string[], template: Template, userId?: string) => {
  const entity = Entity.create({ languages: languages as any, template, userId });
  entity.setPropertyAssignmentsInAllLanguages([
    template.createPropertyAssignment('title', { value: [{ value: `Entity ${entity.sharedId}` }] }),
  ]);
  return entity;
};

describe('MongoMultiLanguageEntityDataSource', () => {
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
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await ds.bulkInsert([entity1, entity2, entity3]);

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

    it('should add all sharedIds to modifiedSharedIds for search indexing', async () => {
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);

      await ds.bulkInsert([entity1, entity2]);

      const modifiedSharedIds = (ds as any).modifiedSharedIds as Set<string>;

      expect(modifiedSharedIds.has(entity1.sharedId)).toBe(true);
      expect(modifiedSharedIds.has(entity2.sharedId)).toBe(true);
    });

    it('should handle entities with different templates', async () => {
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      const template1 = createSampleTemplate('Template1');
      const template2 = createSampleTemplate('Template2');

      const entity1 = createEntity(['en', 'es'], template1);
      const entity2 = createEntity(['en', 'es'], template2);

      await ds.bulkInsert([entity1, entity2]);

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
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      const template = createSampleTemplate();

      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es', 'pt'], template);
      const entity3 = createEntity(['en', 'es'], template);

      await ds.bulkInsert([entity1, entity2, entity3]);

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
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      const template = createSampleTemplate();
      const userId = new ObjectId().toHexString();
      const entity = createEntity(['en', 'es'], template, userId);

      entity.setPropertyAssignmentsInAllLanguages([
        template.createPropertyAssignment('title', { value: [{ value: 'Test Entity Title' }] }),
        template.createPropertyAssignment('text', { value: [{ value: 'Test Text Value' }] }),
        template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
      ]);

      await ds.bulkInsert([entity]);

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
      const db = getConnection();
      const transactionManager = TransactionManagerFactory.default();
      const ds = new MongoMultiLanguageEntityDataSource(db, transactionManager);

      await ds.bulkInsert([]);

      const dbEntities = await testingEnvironment.db.getAllFrom('entities');
      expect(dbEntities.length).toBe(0);
    });
  });
});
