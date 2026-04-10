/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { Template } from '#api/core/domain/template/Template.js';
import { MongoMultiLanguageEntityDataSource } from '../MongoMultiLanguageEntityDataSource.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EntityIndexerService } from '#api/core/infrastructure/elasticSearch/entities/EntityIndexerService.js';
import { search } from '#api/search/index.js';

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

const createSut = () => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();
  const entityIndexerService = TestUtils.mockClass<EntityIndexerService>({
    index: jest.fn().mockResolvedValue(undefined),
    deleteBySharedIds: jest.fn().mockResolvedValue(undefined),
  });

  const sut = new MongoMultiLanguageEntityDataSource({
    db,
    transactionManager,
    entityIndexerService,
  });

  return { sut, entityIndexerService, transactionManager };
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

    it('should add all sharedIds to modifiedSharedIds for search indexing', async () => {
      const { sut } = createSut();

      const template = createSampleTemplate();
      const entity1 = createEntity(['en', 'es'], template);
      const entity2 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2]);

      const modifiedSharedIds = (sut as any).modifiedSharedIds as Set<string>;

      expect(modifiedSharedIds.has(entity1.sharedId)).toBe(true);
      expect(modifiedSharedIds.has(entity2.sharedId)).toBe(true);
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

  describe('indexing on transaction commit', () => {
    let searchIndexSpy: jest.SpyInstance;

    beforeEach(() => {
      searchIndexSpy = jest.spyOn(search, 'indexEntities').mockResolvedValue(undefined as any);
    });

    afterEach(() => {
      searchIndexSpy.mockRestore();
    });

    it('indexes created entity DBOs on commit', async () => {
      const { sut, entityIndexerService, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      await sut.create(entity);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes bulk inserted entity DBOs on commit', async () => {
      const { sut, entityIndexerService, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es'], template);

      await sut.bulkInsert([entity1, entity2]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity1.sharedId }),
          expect.objectContaining({ sharedId: entity2.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity2.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes updated entity DBOs on commit', async () => {
      const { sut, entityIndexerService, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      await sut.update(entity);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes bulk updated entity DBOs on commit', async () => {
      const { sut, entityIndexerService, transactionManager } = createSut();
      const template = createSampleTemplate();
      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es'], template);

      await sut.bulkUpdate([entity1, entity2]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity1.sharedId }),
          expect.objectContaining({ sharedId: entity2.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity2.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes entities with deleted metadata properties on commit', async () => {
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      const { sut: setupSut, transactionManager: setupTm } = createSut();
      await setupSut.bulkInsert([entity]);
      await setupTm.executeOnCommitHandlers(undefined);

      const { sut, entityIndexerService, transactionManager } = createSut();
      await sut.deleteMetadataProperties(['text'], [entity.sharedId]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes entities with renamed metadata properties on commit', async () => {
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      const { sut: setupSut, transactionManager: setupTm } = createSut();
      await setupSut.bulkInsert([entity]);
      await setupTm.executeOnCommitHandlers(undefined);

      const { sut, entityIndexerService, transactionManager } = createSut();
      await sut.renameMetadataProperties({ text: 'newText' }, [entity.sharedId]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity.sharedId, language: 'es' }),
        ])
      );
    });

    it('indexes affected entities after deleting references on commit', async () => {
      const selectTemplate = factory.template('SelectTemplate', [
        factory.property('ref_prop', 'select'),
      ]);
      const targetSharedId = 'target-shared-id';
      const affectedSharedId = factory.idString('affected-entity');

      await testingEnvironment.db.getCollection('templates')!.insertOne(selectTemplate);
      await testingEnvironment.db.getCollection('entities')!.insertOne({
        _id: new ObjectId(),
        sharedId: affectedSharedId,
        language: 'en',
        template: selectTemplate._id,
        title: 'Affected Entity',
        metadata: { ref_prop: [{ value: targetSharedId }] },
        obsoleteMetadata: [],
        published: true,
        creationDate: Date.now(),
        editDate: Date.now(),
        permissions: [],
      });

      const { sut, entityIndexerService, transactionManager } = createSut();
      await sut.deleteReferencesToSharedIds([targetSharedId]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ sharedId: affectedSharedId })])
      );
    });

    it('indexes entities via bulkUpdateDeprecated on commit', async () => {
      const template = createSampleTemplate();
      const entity = createEntity(['en', 'es'], template);

      const { sut: setupSut, transactionManager: setupTm } = createSut();
      await setupSut.bulkInsert([entity]);
      await setupTm.executeOnCommitHandlers(undefined);

      const { sut, entityIndexerService, transactionManager } = createSut();
      await sut.bulkUpdateDeprecated([entity]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.index).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.index).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ sharedId: entity.sharedId, language: 'en' }),
          expect.objectContaining({ sharedId: entity.sharedId, language: 'es' }),
        ])
      );
    });

    it('deletes indexed entities on bulk delete commit', async () => {
      const template = createSampleTemplate();
      const entity1 = createEntity(['en'], template);
      const entity2 = createEntity(['en', 'es'], template);

      const { sut: setupSut, transactionManager: setupTm } = createSut();
      await setupSut.bulkInsert([entity1, entity2]);
      await setupTm.executeOnCommitHandlers(undefined);

      const { sut, entityIndexerService, transactionManager } = createSut();
      await sut.bulkDelete([entity1.sharedId, entity2.sharedId]);
      await transactionManager.executeOnCommitHandlers(undefined);

      expect(entityIndexerService.deleteBySharedIds).toHaveBeenCalledTimes(1);
      expect(entityIndexerService.deleteBySharedIds).toHaveBeenCalledWith(
        expect.arrayContaining([entity1.sharedId, entity2.sharedId])
      );
    });
  });
});
