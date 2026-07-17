/* eslint-disable max-statements */

import Ajv from 'ajv';

import entitiesModel from '#api/entities/entitiesModel.js';
import relationships from '#api/relationships/index.js';
import { search } from '#api/search/index.js';
import date from '#api/utils/date.js';
import db from '#api/utils/testing_db.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { User } from '#api/users.v2/model/User.js';
import { UserRole } from '#shared/types/userSchema.js';

import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { ProcessRelationshipAfterEntityUpdatedListener } from '#api/core/infrastructure/listeners/ProcessRelationshipAfterEntityUpdatedListener.js';
import entities from '../entities.js';

import { EntityCreatedEvent } from '../events/EntityCreatedEvent.js';
import { EntityUpdatedEvent } from '../events/EntityUpdatedEvent.js';
import fixtures, {
  adminId,
  batmanFinishesId,
  docId1,
  entityGetTestTemplateId,
  fixtureFactory,
  syncPropertiesEntityId,
  templateChangingNames,
  templateId,
  templateWithEntityAsThesauri,
  unpublishedDocId,
} from './fixtures.js';

const toActorFromUser = user =>
  user?._id
    ? User.createFrom({
        _id: user._id,
        role: 'editor',
        groups: [],
        email: 'editor@test.com',
        username: 'editorUser',
      })
    : undefined;

const saveEntity = (doc, options = {}, ...rest) => {
  const actor = toActorFromUser(options.user);
  return testingEnvironment.runWithContext(
    () => entities.save(doc, options, ...rest),
    actor ? { actor } : undefined
  );
};

const saveEntityWithEventing = (doc, options = {}, ...rest) => {
  const actor = toActorFromUser(options.user);
  const jobsDispatcher = new SyncDispatcherForTests({
    [ProcessRelationshipAfterEntityUpdatedListener.asJob().name]: async () =>
      new ProcessRelationshipAfterEntityUpdatedListener({}),
  });
  return testingEnvironment.runWithContext(() => entities.save(doc, options, ...rest), {
    ...(actor ? { actor } : {}),
    factories: {
      eventEmitter: EventEmitterFactory.default,
      jobsDispatcher: () => jobsDispatcher,
    },
  });
};

const denormalizeEntity = (entity, options) =>
  testingEnvironment.runWithContext(() => entities.denormalize(entity, options));

describe('entities', () => {
  const userFactory = new UserInContextMockFactory();
  const saveDoc = async (doc, user) => {
    await saveEntity(doc, { user, language: 'es' });
    const docs = await entities.get({ title: doc.title });
    return {
      createdDocumentEs: docs.find(d => d.language === 'es'),
      createdDocumentEn: docs.find(d => d.language === 'en'),
    };
  };

  beforeEach(async () => {
    jest.spyOn(search, 'delete').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'bulkIndex').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'bulkDelete').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('save', () => {
    it('should create a new entity for each language in settings with a language property, a shared id, and default template', async () => {
      const universalTime = 1;
      jest.spyOn(date, 'currentUTC').mockImplementation(() => universalTime);
      const doc = { title: 'Batman begins' };
      const user = { _id: permissionsContext.getUserInContext()._id };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

      expect(createdDocumentEs.template.toString()).toBe(templateChangingNames.toString());
      expect(createdDocumentEn.template.toString()).toBe(templateChangingNames.toString());

      expect(createdDocumentEs.title).toBe(doc.title);
      expect(createdDocumentEs.user.toString()).toBe(user._id.toString());
      expect(createdDocumentEs.published).toBe(false);
      expect(createdDocumentEs.creationDate).toEqual(universalTime);
      expect(createdDocumentEs.editDate).toEqual(universalTime);

      expect(createdDocumentEn.title).toBe(doc.title);
      expect(createdDocumentEn.user.toString()).toBe(user._id.toString());
      expect(createdDocumentEn.published).toBe(false);
      expect(createdDocumentEn.creationDate).toEqual(universalTime);
    });

    it('should create a new entity, preserving template if passed', async () => {
      const doc = { title: 'The Dark Knight', template: templateId };
      const user = { _id: db.id() };
      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.template.toString()).toBe(templateId.toString());
      expect(createdDocumentEn.template.toString()).toBe(templateId.toString());
    });

    it('should set default template and default metadata', async () => {
      const doc = {
        title: 'the dark knight',
        fullText: { 0: 'the full text!' },
      };
      const user = { _id: permissionsContext.getUserInContext()._id };

      const createdDocument = await saveEntity(doc, { user, language: 'en' });

      expect(createdDocument._id).toBeDefined();
      expect(createdDocument.title).toBe(doc.title);
      expect(createdDocument.user.toString()).toBe(user._id.toString());
      expect(createdDocument.language).toEqual('en');
      expect(createdDocument.fullText).not.toBeDefined();
      expect(createdDocument.metadata).toEqual({
        property1: [],
        property2: [],
        property3: [],
      });
      expect(createdDocument.template).toBeDefined();
    });

    it('should index the newly created documents', async () => {
      jest.mocked(search.indexEntities).mockRestore();
      jest.mocked(search.bulkIndex).mockRestore();
      await testingEnvironment.setUp(fixtures, true);

      testingTenants.changeCurrentTenant({
        featureFlags: {},
      });

      const doc = { title: 'the dark knight', template: templateId };
      const user = { _id: db.id() };

      await saveEntity(doc, { user, language: 'en' });
      await elasticTesting.refresh();
      const allEntities = await elasticTesting.getIndexedEntities();

      expect(
        allEntities.find(e => e.title === 'the dark knight' && e.template === templateId.toString())
      ).toBeDefined();
    });

    describe('save entity without a logged user', () => {
      it('should save the entity with unrestricted access', async () => {
        const user = {};
        userFactory.mock(undefined);
        const entity = { title: 'Batman begins', template: templateId, language: 'es' };
        const createdEntity = await saveEntity(entity, { user, language: 'es' });

        expect(createdEntity._id).not.toBeUndefined();
        expect(createdEntity.title).toEqual(entity.title);
        userFactory.mockEditorUser();
      });
    });

    it('should uniq the values on multiselect and relationship fields', async () => {
      const entity = {
        title: 'Batman begins',
        template: templateId,
        language: 'es',
        metadata: {
          multiselect: [
            { value: 'country_one' },
            { value: 'country_one' },
            { value: 'country_two' },
            { value: 'country_two' },
            { value: 'country_two' },
          ],
          friends: [
            { value: 'id1' },
            { value: 'id2' },
            { value: 'id2' },
            { value: 'id1' },
            { value: 'id3' },
            { value: 'id3' },
          ],
        },
      };
      const user = {};

      const createdEntity = await saveEntity(entity, { user, language: 'es' });

      expect(createdEntity.metadata.multiselect.sort((a, b) => b.value < a.value)).toEqual([
        { value: 'country_one', label: 'Pais1' },
        { value: 'country_two', label: 'Pais2' },
      ]);
      expect(createdEntity.metadata.friends.sort((a, b) => b.value < a.value)).toEqual([
        { value: 'id1', label: 'entity one', type: 'entity' },
        { value: 'id2', label: 'entity two', type: 'entity' },
        { value: 'id3', label: 'entity three', type: 'entity' },
      ]);
    });

    it('should create a new entity for each language when passing an _id', async () => {
      const universalTime = 1;
      jest.spyOn(date, 'currentUTC').mockImplementation(() => universalTime);
      const doc = { _id: unpublishedDocId, title: 'Batman begins', language: 'es' };
      const user = { _id: db.id() };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs._id.toString()).not.toBe(unpublishedDocId.toString());
      expect(createdDocumentEn._id.toString()).not.toBe(unpublishedDocId.toString());
    });

    it('should return updated entity with updated editDate', async () => {
      const updateTime = 2;
      const doc = {
        title: 'the dark knight',
        fullText: { 0: 'the full text!' },
      };

      const user = { _id: db.id() };

      const createdDocument = await saveEntity(doc, { user, language: 'en' });
      jest.spyOn(date, 'currentUTC').mockImplementation(() => updateTime);
      const updatedDocument = await saveEntity(
        { ...createdDocument, title: 'updated title' },
        { user, language: 'en' }
      );
      expect(updatedDocument.title).toBe('updated title');
      expect(updatedDocument.editDate).toEqual(updateTime);
    });

    it('should allow partial saves with correct full indexing (NOTE!: partial update requires sending sharedId)', async () => {
      const partialDoc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        title: 'Updated title',
        language: 'en',
      };
      const savedEntity = await saveEntity(partialDoc, { language: 'en' });
      expect(savedEntity.title).toBe('Updated title');
      expect(savedEntity.metadata.property1).toEqual([{ value: 'value1' }]);
      expect(savedEntity.metadata.friends).toEqual([
        { label: 'shared2title', type: 'entity', value: 'shared2' },
      ]);
      const refetchedEntity = await entities.getById(batmanFinishesId);
      expect(refetchedEntity.title).toBe('Updated title');
      expect(refetchedEntity.metadata.property1).toEqual([{ value: 'value1' }]);
      expect(refetchedEntity.metadata.friends).toEqual([
        { label: 'shared2title', type: 'entity', value: 'shared2' },
      ]);
      expect(search.indexEntities).toHaveBeenCalled();
    });

    describe('when updating translatable metadata and other languages have no metadata (intentional V2 paradigm shift)', () => {
      it('should update only target language metadata without fallback to other languages', async () => {
        const doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: { text: [{ value: 'newMetadata' }] },
          template: templateId,
        };

        const updatedDoc = await saveEntity(doc, { language: 'en' });
        expect(updatedDoc.language).toBe('en');
        const [docES, docEN, docPT] = await Promise.all([
          entities.getById('shared', 'es'),
          entities.getById('shared', 'en'),
          entities.getById('shared', 'pt'),
        ]);
        expect(docEN.published).toBe(true);
        expect(docES.published).toBe(true);
        expect(docPT.published).toBe(true);

        expect(docEN.metadata.text).toEqual([{ value: 'newMetadata' }]);
        expect(docES.metadata.text).toEqual([]);
        expect(docPT.metadata.text).toEqual([{ value: 'test' }]);
      });
    });

    describe('when published/template/generatedToc property changes', () => {
      it('should replicate the change for all the languages and ignore the published field', async () => {
        const doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: {},
          published: false,
          template: templateId,
          generatedToc: true,
        };

        const updatedDoc = await saveEntity(doc, { language: 'en' });
        expect(updatedDoc.language).toBe('en');
        const [docES, docEN] = await Promise.all([
          entities.getById('shared', 'es'),
          entities.getById('shared', 'en'),
        ]);
        expect(docEN.template).toBeDefined();
        expect(docES.template).toBeDefined();

        expect(docES.published).toBe(true);
        expect(docES.generatedToc).toBe(true);
        expect(docES.template.equals(templateId)).toBe(true);
        expect(docEN.published).toBe(true);
        expect(docEN.generatedToc).toBe(true);
        expect(docEN.template.equals(templateId)).toBe(true);
      });
    });

    it('should ignore the permissions parameter', async () => {
      const doc = {
        _id: unpublishedDocId,
        sharedId: 'other',
        metadata: {},
        permissions: [],
      };

      const updatedDoc = await saveEntity(doc, { language: 'en' });

      expect(updatedDoc.permissions).toEqual([
        expect.objectContaining({ refId: 'user1' }),
        expect.objectContaining({ refId: 'user2' }),
      ]);
    });

    describe('when generatedToc is undefined', () => {
      it('should not replicate the value to all languages', async () => {
        const doc = { _id: batmanFinishesId, sharedId: 'shared', generatedToc: true };
        await saveEntity(doc, { language: 'en' });
        await saveEntity({ _id: batmanFinishesId, sharedId: 'shared' }, { language: 'en' });
        const [docES, docEN] = await Promise.all([
          entities.getById('shared', 'es'),
          entities.getById('shared', 'en'),
        ]);

        expect(docES.generatedToc).toBe(true);
        expect(docEN.generatedToc).toBe(true);
      });
    });

    it('should sync select/multiselect/dates/multidate/multidaterange/numeric', async () => {
      const doc = {
        _id: syncPropertiesEntityId,
        sharedId: 'shared1',
        template: templateId,
        language: 'en',
        metadata: {
          text: [{ value: 'changedText' }],
          select: [{ value: 'country_one' }],
          multiselect: [{ value: 'country_two' }],
          date: [{ value: 1234 }],
          multidate: [{ value: 1234 }],
          multidaterange: [{ value: { from: 1, to: 2 } }],
          numeric: [{ value: 100 }],
        },
      };

      const updatedDoc = await saveEntity(doc, { language: 'en' });
      expect(updatedDoc.language).toBe('en');
      const [docEN, docES, docPT] = await Promise.all([
        entities.getById('shared1', 'en'),
        entities.getById('shared1', 'es'),
        entities.getById('shared1', 'pt'),
      ]);
      expect(docEN.metadata.text[0].value).toBe('changedText');
      expect(docEN.metadata.select[0]).toEqual({ value: 'country_one', label: 'Country1' });
      expect(docEN.metadata.multiselect).toEqual([
        {
          value: 'country_two',
          label: 'Country2',
        },
      ]);
      expect(docEN.metadata.date[0].value).toBe(1234);
      expect(docEN.metadata.multidate).toEqual([{ value: 1234 }]);
      expect(docEN.metadata.multidaterange).toEqual([{ value: { from: 1, to: 2 } }]);
      expect(docEN.metadata.numeric[0].value).toEqual(100);

      expect(docES.metadata.property1[0].value).toBe('text');
      expect(docES.metadata.select[0]).toEqual({ value: 'country_one', label: 'Pais1' });
      expect(docES.metadata.multiselect).toEqual([
        {
          value: 'country_two',
          label: 'Pais2',
        },
      ]);
      expect(docES.metadata.date[0].value).toBe(1234);
      expect(docES.metadata.multidate).toEqual([{ value: 1234 }]);
      expect(docES.metadata.multidaterange).toEqual([{ value: { from: 1, to: 2 } }]);
      expect(docES.metadata.numeric[0].value).toEqual(100);

      expect(docPT.metadata.property1[0].value).toBe('text');
      expect(docPT.metadata.select[0]).toEqual({ value: 'country_one', label: 'Pais1_pt' });
      expect(docPT.metadata.multiselect).toEqual([
        {
          value: 'country_two',
          label: 'Pais2_pt',
        },
      ]);
      expect(docPT.metadata.date[0].value).toBe(1234);
      expect(docPT.metadata.multidate).toEqual([{ value: 1234 }]);
      expect(docPT.metadata.multidaterange).toEqual([{ value: { from: 1, to: 2 } }]);
      expect(docPT.metadata.numeric[0].value).toEqual(100);
    });

    describe('saveEntityBasedReferences', () => {
      it('should save references on creation', async () => {
        jest.spyOn(date, 'currentUTC').mockReturnValue(1);
        const entity = {
          title: 'Batman begins',
          template: templateId,
          language: 'es',
          metadata: {
            friends: [{ value: 'id1' }, { value: 'id2' }, { value: 'id3' }],
            enemies: [{ value: 'shared1' }],
          },
        };
        const user = { _id: db.id() };

        const createdEntity = await saveEntity(entity, { user, language: 'es' });

        const createdRelationships = await relationships.getByDocument(
          createdEntity.sharedId,
          'es'
        );

        expect(createdRelationships.length).toBe(6);
        expect(createdRelationships.map(r => r.entityData.title).sort()).toEqual([
          'Batman begins',
          'Batman begins',
          'ES',
          'entity one',
          'entity three',
          'entity two',
        ]);
      });

      it('should add references on update', async () => {
        const user = { _id: adminId };

        const existing = await entities.getById('relSaveTest', 'en');
        const existingRelationships = await relationships.getByDocument('relSaveTest', 'en');
        expect(existingRelationships.length).toBe(4);
        expect(existingRelationships.map(r => r.entityData.title).sort()).toEqual([
          'Batman still not done',
          'Batman still not done',
          'shared2title',
          'shared2title',
        ]);

        existing.metadata.friends.push({ value: 'id1' }, { value: 'id2' });
        existing.metadata.enemies.push({ value: 'shared1' });
        await saveEntityWithEventing(existing, { user, language: 'en' });

        const updatedRelationships = await relationships.getByDocument('relSaveTest', 'en');
        expect(updatedRelationships.map(r => r.entityData.title).sort()).toEqual([
          'Batman still not done',
          'Batman still not done',
          'EN',
          'entity one',
          'entity two',
          'shared2title',
          'shared2title',
        ]);
        expect(updatedRelationships.length).toBe(7);
      });

      it('should delete references on update', async () => {
        const user = { _id: adminId };

        const existing = await entities.getById('relSaveTest', 'en');
        const existingRelationships = await relationships.getByDocument('relSaveTest', 'en');
        expect(existingRelationships.length).toBe(4);
        expect(existingRelationships.map(r => r.entityData.title).sort()).toEqual([
          'Batman still not done',
          'Batman still not done',
          'shared2title',
          'shared2title',
        ]);

        existing.metadata.friends = [];
        existing.metadata.enemies = [];
        await saveEntityWithEventing(existing, { user, language: 'en' });

        const updatedRelationships = await relationships.getByDocument('relSaveTest', 'en');
        expect(updatedRelationships.length).toBe(0);
      });
    });

    it('should not circle back to updateMetdataFromRelationships', async () => {
      jest.spyOn(date, 'currentUTC').mockReturnValue(1);
      jest.spyOn(entities, 'updateMetdataFromRelationships');
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        type: 'entity',
        template: templateId,
        language: 'en',
        title: 'Batman finishes',
        published: true,
        fullText: {
          1: 'page[[1]] 1[[1]]',
          2: 'page[[2]] 2[[2]]',
          3: '',
        },
        metadata: {
          property1: [{ value: 'value1' }],
          friends: [],
        },
        file: {
          filename: '8202c463d6158af8065022d9b5014cc1.pdf',
        },
      };
      const user = { _id: db.id() };

      await saveEntity(doc, { user, language: 'es' }, false);
      expect(entities.updateMetdataFromRelationships).not.toHaveBeenCalled();
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', async () => {
        jest.spyOn(date, 'currentUTC').mockReturnValue(10);
        const modifiedDoc = { _id: batmanFinishesId, sharedId: 'shared' };
        await saveEntity(modifiedDoc, { user: 'another_user', language: 'en' });
        const doc = await entities.getById('shared', 'en');
        expect(doc.user).not.toBe('another_user');
        expect(doc.creationDate).not.toBe(10);
      });

      it('should return the previously saved documents of the entity', async () => {
        const modifiedDoc = { _id: batmanFinishesId, sharedId: 'shared' };
        const doc = await saveEntity(modifiedDoc, {
          language: 'en',
        });
        expect(doc.documents[0].entity).toBe('shared');
      });
    });

    describe('events', () => {
      let emitSpy;

      beforeEach(() => {
        emitSpy = jest.spyOn(applicationEventsBus, 'emit');
        emitSpy.mockClear();
      });

      it('should emit an event when an entity is created', async () => {
        const newEntity = {
          template: templateId,
          title: 'New Super Hero',
          metadata: {
            text: [{ value: 'New Text' }],
            property1: [{ value: 'value1' }],
            property2: [{ value: 'value2' }],
            description: [{ value: 'ew Description' }],
            friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
            enemies: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
            select: [],
          },
        };

        const savedEntity = await saveEntity(newEntity, {
          user: { _id: adminId },
          language: 'en',
        });

        const createdEvent = emitSpy.mock.calls.find(
          ([event]) => event instanceof EntityCreatedEvent
        )?.[0];
        expect(createdEvent).toBeInstanceOf(EntityCreatedEvent);
        expect(createdEvent.data.targetLanguageKey).toBe('en');
        expect(createdEvent.data.entities.map(entity => entity.sharedId)).toEqual(
          expect.arrayContaining([savedEntity.sharedId])
        );
      });

      it('should emit an event when an entity is updated', async () => {
        const before = fixtures.entities.find(e => e._id === batmanFinishesId);
        const after = { ...before, title: 'new title' };

        await saveEntity(after, { language: 'en' });

        const updatedEvent = emitSpy.mock.calls.find(
          ([event]) => event instanceof EntityUpdatedEvent
        )?.[0];
        expect(updatedEvent).toBeInstanceOf(EntityUpdatedEvent);
        expect(updatedEvent.data.targetLanguageKey).toBe('en');
        expect(updatedEvent.data.after.map(entity => entity.title)).toContain('new title');
      });
    });

    describe('when the Template is changed', () => {
      it('should keep existing metadata value if Property are present in previous and next Template', async () => {
        const commonProperty1 = fixtureFactory.property('common_property_1', 'text');
        const commonProperty2 = fixtureFactory.property('common_property_2', 'numeric');
        const commonProperty3 = fixtureFactory.property('common_property_3', 'date');
        const exclusiveTemplateA1 = fixtureFactory.property('exclusive_template_a_1', 'text');
        const exclusiveTemplateA2 = fixtureFactory.property('exclusive_template_a_2', 'numeric');
        const exclusiveTemplateB1 = fixtureFactory.property('exclusive_template_b_1', 'text');

        const templateA = fixtureFactory.template('template_a', [
          commonProperty1,
          commonProperty2,
          commonProperty3,
          exclusiveTemplateA1,
          exclusiveTemplateA2,
        ]);

        const templateB = fixtureFactory.template('template_b', [
          commonProperty1,
          commonProperty2,
          commonProperty3,
          exclusiveTemplateB1,
        ]);

        const [entityEs, entityEn, entityPt] = fixtureFactory.entityInMultipleLanguages(
          ['es', 'en', 'pt'],
          'entity_template_changed',
          templateA.name,
          {
            [commonProperty1.name]: [{ value: 'any_text_spanish_1' }],
            [commonProperty2.name]: [{ value: 0 }],
            [commonProperty3.name]: [{ value: 1234 }],
            [exclusiveTemplateA1.name]: [{ value: 'any_text_spanish_2' }],
            [exclusiveTemplateA2.name]: [{ value: 1 }],
          }
        );

        await testingEnvironment.setFixtures({
          ...fixtures,
          entities: [entityEs, entityEn, entityPt],
          templates: [templateA, templateB],
        });

        const input = {
          _id: entityEn._id,
          sharedId: entityEn.sharedId,
          template: templateB._id,
          metadata: {
            [commonProperty1.name]: [{ value: 'changed_text_english' }],
            [commonProperty2.name]: [{ value: 0 }],
            [commonProperty3.name]: [{ value: 4321 }],
            [exclusiveTemplateB1.name]: [{ value: 'any_text' }],
          },
        };

        const editedEn = await saveEntity(input, { language: 'en' });
        const [editedEs, editedPt] = await Promise.all([
          entities.getById(entityEs.sharedId, 'es'),
          entities.getById(entityEs.sharedId, 'pt'),
        ]);

        expect(editedEn.metadata).toEqual({
          [commonProperty1.name]: [{ value: 'changed_text_english' }],
          [commonProperty2.name]: [{ value: 0 }],
          [commonProperty3.name]: [{ value: 4321 }],
          [exclusiveTemplateB1.name]: [{ value: 'any_text' }],
        });

        expect(editedEs.metadata).toEqual({
          [commonProperty1.name]: [{ value: 'any_text_spanish_1' }],
          [commonProperty2.name]: [{ value: 0 }],
          [commonProperty3.name]: [{ value: 4321 }],
          [exclusiveTemplateB1.name]: [],
        });

        expect(editedPt.metadata).toEqual({
          [commonProperty1.name]: [{ value: 'any_text_spanish_1' }],
          [commonProperty2.name]: [{ value: 0 }],
          [commonProperty3.name]: [{ value: 4321 }],
          [exclusiveTemplateB1.name]: [],
        });
      });
    });
  });

  describe('updateMetdataFromRelationships', () => {
    it('should update the metdata based on the entity relationships', async () => {
      await testingEnvironment.runWithContext(async () =>
        entities.updateMetdataFromRelationships(['shared', 'missingEntity'], 'en')
      );
      const updatedEntity = await entities.getById('shared', 'en');
      expect(updatedEntity.metadata.friends).toEqual([
        { icon: null, type: 'entity', label: 'shared2title', value: 'shared2' },
      ]);
    });

    it('should not fail on newly created documents (without metadata)', async () => {
      const doc = { title: 'Batman begins', template: templateId };
      const user = { _id: db.id() };
      const newEntity = await saveEntity(doc, { user, language: 'es' });

      await testingEnvironment.runWithContext(async () =>
        entities.updateMetdataFromRelationships([newEntity.sharedId], 'en')
      );

      const updatedEntity = await entities.getById(newEntity.sharedId, 'en');
      expect(updatedEntity.metadata).toEqual({
        date: [],
        daterange: [],
        description: [],
        enemies: [],
        field_nested: [],
        friends: [],
        multidate: [],
        multidaterange: [],
        multiselect: [],
        numeric: [],
        property1: [],
        property2: [],
        select: [],
        text: [],
      });
    });

    it('should sanitize the entities', async () => {
      const sanitizationSpy = jest.spyOn(entities, 'sanitize');

      await testingEnvironment.runWithContext(async () =>
        entities.updateMetdataFromRelationships(['shared'], 'en')
      );

      expect(sanitizationSpy.mock.calls).toMatchObject([
        [
          {
            sharedId: 'shared',
            language: 'en',
            title: 'Batman finishes',
          },
          {
            name: 'template_test',
          },
        ],
      ]);
      sanitizationSpy.mockRestore();
    });

    describe('unrestricted for collaborator', () => {
      it('should save the entity with unrestricted access', async () => {
        userFactory.mock({
          _id: 'user1',
          role: UserRole.COLLABORATOR,
          username: 'User 1',
          email: 'col@test.com',
        });

        await testingEnvironment.runWithContext(async () =>
          entities.updateMetdataFromRelationships(['shared'], 'en')
        );
        const updatedEntity = await entities.getById('shared', 'en');
        expect(updatedEntity.metadata.friends).toEqual([
          { icon: null, type: 'entity', label: 'shared2title', value: 'shared2' },
        ]);
        userFactory.mockEditorUser();
      });
    });
  });

  describe('Sanitize', () => {
    it('should sanitize multidates, removing non valid dates', async () => {
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: {
          multidate: [{ value: null }, { value: 1234 }, { value: null }, { value: 5678 }],
        },
        published: false,
        template: templateId,
      };

      const updatedDoc = await saveEntity(doc, { language: 'en' });
      expect(updatedDoc.language).toBe('en');
      const [docES, docEN] = await Promise.all([
        entities.getById('shared', 'es'),
        entities.getById('shared', 'en'),
      ]);
      expect(docES.metadata.multidate).toEqual([{ value: 1234 }, { value: 5678 }]);
      expect(docEN.metadata.multidate).toEqual([{ value: 1234 }, { value: 5678 }]);
    });

    it('should sanitize select, removing empty values', async () => {
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { select: [{ value: '' }] },
        published: false,
        template: templateId,
      };

      const updatedDoc = await saveEntity(doc, { language: 'en' });
      expect(updatedDoc.language).toBe('en');
      const [docES, docEN] = await Promise.all([
        entities.getById('shared', 'es'),
        entities.getById('shared', 'en'),
      ]);
      expect(docES.metadata.select).toEqual([]);
      expect(docEN.metadata.select).toEqual([]);
    });

    it('should sanitize daterange, removing non valid dates', async () => {
      const doc1 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { daterange: [{ value: { from: 1, to: 2 } }] },
        template: templateId,
      };
      const doc2 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { daterange: [{ value: { from: null, to: 2 } }] },
        template: templateId,
      };
      const doc3 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { daterange: [{ value: { from: 2, to: null } }] },
        template: templateId,
      };
      const doc4 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { daterange: [{ value: { from: null, to: null } }] },
        template: templateId,
      };

      await saveEntity(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      expect(doc.metadata.daterange).toEqual(doc1.metadata.daterange);
      await saveEntity(doc2, { language: 'en' });
      const doc1db = await entities.getById('shared', 'en');
      expect(doc1db.metadata.daterange).toEqual(doc2.metadata.daterange);
      await saveEntity(doc3, { language: 'en' });
      const doc2db = await entities.getById('shared', 'en');
      expect(doc2db.metadata.daterange).toEqual(doc3.metadata.daterange);
      await saveEntity(doc4, { language: 'en' });
      const doc3db = await entities.getById('shared', 'en');
      expect(doc3db.metadata.daterange).toEqual([]);
    });

    it('should sanitize multidaterange, removing non valid dates', async () => {
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: {
          multidaterange: [
            { value: { from: 1, to: 2 } },
            { value: { from: null, to: null } },
            { value: { from: null, to: 2 } },
            { value: { from: 2, to: null } },
            { value: { from: null, to: null } },
          ],
        },
        published: false,
        template: templateId,
      };

      const updatedDoc = await saveEntity(doc, { language: 'en' });
      expect(updatedDoc.language).toBe('en');
      const [docES, docEN] = await Promise.all([
        entities.getById('shared', 'es'),
        entities.getById('shared', 'en'),
      ]);
      expect(docES.metadata.multidaterange).toEqual([
        { value: { from: 1, to: 2 } },
        { value: { from: null, to: 2 } },
        { value: { from: 2, to: null } },
      ]);
      expect(docEN.metadata.multidaterange).toEqual([
        { value: { from: 1, to: 2 } },
        { value: { from: null, to: 2 } },
        { value: { from: 2, to: null } },
      ]);
    });

    it('should sanitize numeric, parsing texts into numbers', async () => {
      const doc1 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { numeric: [{ value: '10' }] },
        template: templateId,
      };
      const doc2 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { numeric: [{ value: '10.5' }] },
        template: templateId,
      };

      await saveEntity(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      expect(doc.metadata.numeric).toEqual([{ value: 10 }]);
      await saveEntity(doc2, { language: 'en' });
      const doc1db = await entities.getById('shared', 'en');
      expect(doc1db.metadata.numeric).toEqual([{ value: 10.5 }]);
    });

    it('should sanitize numeric, normalizing empty strings into an empty array', async () => {
      const doc1 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { numeric: [{ value: '' }] },
        template: templateId,
      };

      await saveEntity(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      // Empty metadata values are represented as [] in normalized entity payloads.
      expect(doc.metadata.numeric).toEqual([]);
    });

    it('should supply empty arrays for missing metadata, for all languages', async () => {
      const user = { _id: db.id() };
      const doc1 = {
        title: 'newEntity',
        metadata: { text: [{ value: 'text' }], numeric: [{ value: 1 }] },
        template: templateId,
      };

      await saveEntity(doc1, { user, language: 'en' });
      const docs = await entities.get({ title: 'newEntity' });
      expect(docs.length).toBe(3);
      expect(docs.map(d => d.language).sort()).toEqual(['en', 'es', 'pt']);
      docs.forEach(doc => {
        expect(doc.metadata).toEqual({
          text: [{ value: 'text' }],
          property1: [],
          property2: [],
          description: [],
          select: [],
          multiselect: [],
          date: [],
          multidate: [],
          multidaterange: [],
          daterange: [],
          friends: [],
          enemies: [],
          field_nested: [],
          numeric: [{ value: 1 }],
        });
      });
    });
  });

  describe('get', () => {
    const checkFilenames = (expectedFilenames, entity, property) => {
      if (expectedFilenames !== null) {
        expect(entity[property].length).toBe(expectedFilenames.length);
        entity[property].forEach((element, index) => {
          expect(element.filename).toBe(expectedFilenames[index]);
        });
      } else {
        expect(entity).not.toHaveProperty(property);
      }
    };

    const checkEntityGetResult = (entity, title, documentFilenames, attachmentFilenames) => {
      expect(entity.title).toBe(title);

      checkFilenames(documentFilenames, entity, 'documents');
      checkFilenames(attachmentFilenames, entity, 'attachments');
    };

    it('should return matching entities for the conditions', async () => {
      const sharedId = 'shared1';

      const [enDoc, esDoc] = await Promise.all([
        entities.get({ sharedId, language: 'en' }),
        entities.get({ sharedId, language: 'es' }),
      ]);
      expect(enDoc[0].title).toBe('EN');
      expect(esDoc[0].title).toBe('ES');
    });

    it('should return documents and attachments properly, when requested.', async () => {
      const result = await entities.get({ template: entityGetTestTemplateId });
      checkEntityGetResult(result[0], 'TitleA', ['file2.name'], []);
      checkEntityGetResult(result[1], 'TitleB', [], []);
      checkEntityGetResult(result[2], 'TitleC', ['file3.name'], ['file1.name', 'file4.name']);
    });

    it('should return documents and attachments properly while using a select clause in the query.', async () => {
      const result = await entities.get({ template: entityGetTestTemplateId }, { title: true });
      checkEntityGetResult(result[0], 'TitleA', ['file2.name'], []);
      checkEntityGetResult(result[1], 'TitleB', [], []);
      checkEntityGetResult(result[2], 'TitleC', ['file3.name'], ['file1.name', 'file4.name']);
    });

    it('should not return documents and attachments, when not requested.', async () => {
      const result = await entities.get(
        { template: entityGetTestTemplateId },
        {},
        { withoutDocuments: true }
      );
      checkEntityGetResult(result[0], 'TitleA', null, null);
      checkEntityGetResult(result[1], 'TitleB', null, null);
      checkEntityGetResult(result[2], 'TitleC', null, null);
    });

    it.each([
      [undefined, undefined],
      ['title', 'title sharedId'],
      ['+title', '+title +sharedId'],
      [['title'], ['title', 'sharedId']],
      [{}, {}],
      [{ title: 1 }, { title: 1, sharedId: 1 }],
    ])(
      'should call model.get with a properly extended select: %s -> %s',
      async (select, extended) => {
        const entitesModelGet = jest.spyOn(entitiesModel, 'get');
        await entities.get({ template: entityGetTestTemplateId }, select);
        expect(entitesModelGet).toBeCalledWith({ template: entityGetTestTemplateId }, extended, {});
        entitesModelGet.mockRestore();
      }
    );
  });

  describe('getWithRelationships', () => {
    it('should return the entities with its permitted relationships when no user', async () => {
      userFactory.mock(undefined);
      const [result] = await entities.getWithRelationships({ sharedId: 'getWithRelRoot' });
      expect(result.relations).toEqual([
        expect.objectContaining({ entity: 'getWithRelRoot' }),
        expect.objectContaining({ entity: 'getWithRelPublic' }),
      ]);
      userFactory.mockEditorUser();
    });

    it('should return the entities with its permitted relationships when the user has permissions', async () => {
      userFactory.mockEditorUser();
      const [result] = await entities.getWithRelationships({ sharedId: 'getWithRelRoot' });
      expect(result.relations).toEqual([
        expect.objectContaining({ entity: 'getWithRelRoot' }),
        expect.objectContaining({ entity: 'getWithRelPublic' }),
        expect.objectContaining({ entity: 'getWithRelPrivate' }),
      ]);
    });
  });

  describe('denormalize', () => {
    it('should denormalize entity with missing metadata labels', async () => {
      userFactory.mock({
        _id: 'user1',
        username: 'collaborator',
        role: UserRole.COLLABORATOR,
      });
      const entity = (await entities.get({ sharedId: 'shared', language: 'en' }))[0];
      entity.metadata.friends[0].label = '';
      const denormalized = await denormalizeEntity(entity, { user: 'dummy', language: 'en' });
      expect(denormalized.metadata.friends[0].label).toBe('shared2title');
    });

    it('should denormalize inherited metadata', async () => {
      const entity = (await entities.get({ sharedId: 'shared', language: 'en' }))[0];

      const denormalized = await denormalizeEntity(entity, { user: 'dummy', language: 'en' });
      expect(denormalized.metadata.enemies[0].inheritedValue).toEqual([
        { value: 'something to be inherited' },
      ]);
      expect(denormalized.metadata.enemies[0].inheritedType).toBe('text');
    });

    it('should denormalize thesauri categories as parents', async () => {
      const entity = {
        template: templateId,
        title: 'Thesauri categories test',
        language: 'en',
        metadata: {
          select: [{ value: 'town1' }],
          multiselect: [{ value: 'country_one' }, { value: 'town2' }],
        },
      };
      const denormalized = await denormalizeEntity(entity, { user: 'dummy', language: 'en' });
      expect(denormalized.metadata.select[0].parent).toEqual({ value: 'towns', label: 'Towns' });
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', async () => {
      const count = await entities.countByTemplate(templateId);
      expect(count).toBe(10);
    });

    it('should return 0 when no count found', done => {
      entities
        .countByTemplate(db.id())
        .then(count => {
          expect(count).toBe(0);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('getByTemplate', () => {
    it('should return only published entities with passed template and language', done => {
      entities
        .getByTemplate(templateId, 'en')
        .then(docs => {
          expect(docs.length).toBe(3);
          expect(docs[0].title).toBe('Batman finishes');
          expect(docs[1].title).toBe('Batman still not done');
          expect(docs[2].title).toBe('EN');
          done();
        })
        .catch(done.fail);
    });

    it('should return all entities (including unpublished) if required', async () => {
      const docs = await entities.getByTemplate(templateId, 'en', null, false);
      expect(docs.length).toBe(7);
      expect(docs.sort((a, b) => a.title.localeCompare(b.title)).map(d => d.title)).toEqual([
        'Batman finishes',
        'Batman still not done',
        'EN',
        'shared2title',
        'Unpublished entity',
        'value0',
        'value2',
      ]);
    });

    it('should return all entities (including unpublished) if required and user is a collaborator', async () => {
      userFactory.mock({
        _id: 'user1',
        role: 'collaborator',
        groups: [],
      });
      const docs = (await entities.getByTemplate(templateId, 'en', null, false)).sort((a, b) =>
        b.title.localeCompare(a.title)
      );
      expect(docs.length).toBe(4);
      expect(docs[0].title).toBe('Unpublished entity');
      expect(docs[1].title).toBe('EN');
      expect(docs[2].title).toBe('Batman still not done');
      expect(docs[3].title).toBe('Batman finishes');
    });
  });
  describe('removeValuesFromEntities', () => {
    it('should remove values of properties passed on all entities having that property', async () => {
      await entities.removeValuesFromEntities(['multiselect'], templateWithEntityAsThesauri);
      const _entities = await entities.get({ template: templateWithEntityAsThesauri });
      expect(_entities[0].metadata.multiselect).toEqual([]);
      expect(search.indexEntities).toHaveBeenCalled();
    });
  });

  describe('addLanguage()', () => {
    let createThumbnailSpy;

    beforeAll(async () => {
      createThumbnailSpy = jest.spyOn(entities, 'createThumbnail').mockImplementation(entity => {
        if (!entity.file) {
          return Promise.reject(
            new Error('entities without file should not try to create thumbnail')
          );
        }
        return Promise.resolve();
      });
    });

    afterAll(() => {
      createThumbnailSpy.mockRestore();
    });

    it('should duplicate all the entities from the default language to the new one', async () => {
      await entitiesModel.save({ _id: docId1, file: {} });

      await entities.addLanguage('ab', 2);
      const newEntities = await entities.get({ language: 'ab' }, '+permissions');
      expect(newEntities.length).toBe(16);

      const fromCheckPermissions = fixtures.entities.find(e => e.title === 'Unpublished entity ES');
      const toCheckPermissions = newEntities.find(e => e.title === 'Unpublished entity ES');
      expect(toCheckPermissions.permissions).toEqual(fromCheckPermissions.permissions);
    });

    it('should not try to add already existing languages', async () => {
      const oldCount = (await entities.get({ language: 'en' })).length;
      await entities.addLanguage('en');
      const newCount = (await entities.get({ language: 'en' })).length;
      expect(newCount).toBe(oldCount);
    });
  });

  describe('removeLanguage()', () => {
    it('should delete all entities from the language', async () => {
      jest.spyOn(search, 'deleteLanguage').mockImplementation(async () => Promise.resolve());
      jest.spyOn(entities, 'createThumbnail').mockImplementation(async () => Promise.resolve());
      await entities.addLanguage('ab');
      await entities.removeLanguage('ab');
      const newEntities = await entities.get({ language: 'ab' });

      expect(search.deleteLanguage).toHaveBeenCalledWith('ab');
      expect(newEntities.length).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate on save', async () => {
      const entity = {
        title: 'Test',
        template: templateId,
        metadata: { date: [{ value: 'invalid date' }] },
      };
      const options = { user: { _id: db.id() }, language: 'en' };

      try {
        await saveEntity(entity, options);
        fail('should throw validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Ajv.ValidationError);
      }
    });
  });
});
