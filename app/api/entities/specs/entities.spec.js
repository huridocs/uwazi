/* eslint-disable max-lines */
/* eslint-disable max-nested-callbacks,max-statements */

import Ajv from 'ajv';

import entitiesModel from 'api/entities/entitiesModel';
import { spyOnEmit } from 'api/eventsbus/eventTesting';
import { uploadsPath, storage } from 'api/files';
import relationships from 'api/relationships';
import { search } from 'api/search';
import date from 'api/utils/date.js';
import db from 'api/utils/testing_db';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { UserRole } from 'shared/types/userSchema';

import fixtures, {
  adminId,
  batmanFinishesId,
  templateId,
  templateChangingNames,
  templateChangingNamesProps,
  syncPropertiesEntityId,
  templateWithEntityAsThesauri,
  docId1,
  uploadId1,
  uploadId2,
  unpublishedDocId,
  entityGetTestTemplateId,
} from './fixtures.js';
import entities from '../entities.js';
import { EntityUpdatedEvent } from '../events/EntityUpdatedEvent';
import { EntityDeletedEvent } from '../events/EntityDeletedEvent';

describe('entities', () => {
  const userFactory = new UserInContextMockFactory();

  beforeEach(async () => {
    jest.spyOn(search, 'delete').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'bulkIndex').mockImplementation(async () => Promise.resolve());
    jest.spyOn(search, 'bulkDelete').mockImplementation(async () => Promise.resolve());
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save', () => {
    const saveDoc = async (doc, user) => {
      await entities.save(doc, { user, language: 'es' });
      const docs = await entities.get({ title: doc.title });
      return {
        createdDocumentEs: docs.find(d => d.language === 'es'),
        createdDocumentEn: docs.find(d => d.language === 'en'),
      };
    };

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

      const createdEntity = await entities.save(entity, { user, language: 'es' });

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

    it('should create a new entity for each language in settings with a language property, a shared id, and default template', async () => {
      const universalTime = 1;
      jest.spyOn(date, 'currentUTC').mockImplementation(() => universalTime);
      const doc = { title: 'Batman begins' };
      const user = { _id: db.id() };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

      expect(createdDocumentEs.template.toString()).toBe(templateChangingNames.toString());
      expect(createdDocumentEn.template.toString()).toBe(templateChangingNames.toString());

      expect(createdDocumentEs.title).toBe(doc.title);
      expect(createdDocumentEs.user.equals(user._id)).toBe(true);
      expect(createdDocumentEs.published).toBe(false);
      expect(createdDocumentEs.creationDate).toEqual(universalTime);
      expect(createdDocumentEs.editDate).toEqual(universalTime);

      expect(createdDocumentEn.title).toBe(doc.title);
      expect(createdDocumentEn.user.equals(user._id)).toBe(true);
      expect(createdDocumentEn.published).toBe(false);
      expect(createdDocumentEn.creationDate).toEqual(universalTime);
    });

    it('should create a new entity for each language when passing an _id', async () => {
      const universalTime = 1;
      jest.spyOn(date, 'currentUTC').mockImplementation(() => universalTime);
      const doc = { _id: unpublishedDocId, title: 'Batman begins', language: 'es' };
      const user = { _id: db.id() };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs._id.toString()).toBe(unpublishedDocId.toString());
      expect(createdDocumentEn._id.toString()).not.toBe(unpublishedDocId.toString());
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
      const user = { _id: db.id() };

      const createdDocument = await entities.save(doc, { user, language: 'en' });

      expect(createdDocument._id).toBeDefined();
      expect(createdDocument.title).toBe(doc.title);
      expect(createdDocument.user.equals(user._id)).toBe(true);
      expect(createdDocument.language).toEqual('en');
      expect(createdDocument.fullText).not.toBeDefined();
      expect(createdDocument.metadata).toEqual({});
      expect(createdDocument.template).toBeDefined();
    });

    it('should return updated entity with updated editDate', async () => {
      const updateTime = 2;
      const doc = {
        title: 'the dark knight',
        fullText: { 0: 'the full text!' },
      };

      const user = { _id: db.id() };

      const createdDocument = await entities.save(doc, { user, language: 'en' });
      jest.spyOn(date, 'currentUTC').mockImplementation(() => updateTime);
      const updatedDocument = await entities.save(
        { ...createdDocument, title: 'updated title' },
        { user, language: 'en' }
      );
      expect(updatedDocument.title).toBe('updated title');
      expect(updatedDocument.editDate).toEqual(updateTime);
    });

    it('should index the newly created documents', async () => {
      const doc = { title: 'the dark knight', template: templateId };
      const user = { _id: db.id() };

      await entities.save(doc, { user, language: 'en' });
      expect(search.indexEntities).toHaveBeenCalled();
    });

    it('should allow partial saves with correct full indexing (NOTE!: partial update requires sending sharedId)', async () => {
      const partialDoc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        title: 'Updated title',
        language: 'en',
      };
      const savedEntity = await entities.save(partialDoc, { language: 'en' });
      expect(savedEntity.title).toBe('Updated title');
      expect(savedEntity.metadata.property1).toEqual([{ value: 'value1' }]);
      expect(savedEntity.metadata.friends).toEqual([
        { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
      ]);
      const refetchedEntity = await entities.getById(batmanFinishesId);
      expect(refetchedEntity.title).toBe('Updated title');
      expect(refetchedEntity.metadata.property1).toEqual([{ value: 'value1' }]);
      expect(refetchedEntity.metadata.friends).toEqual([
        { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
      ]);
      expect(search.indexEntities).toHaveBeenCalled();
    });

    describe('when other languages have no metadata', () => {
      it('should replicate metadata being saved', async () => {
        const doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: { text: [{ value: 'newMetadata' }] },
          template: templateId,
        };

        const updatedDoc = await entities.save(doc, { language: 'en' });
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
        expect(docES.metadata.text).toEqual([{ value: 'newMetadata' }]);
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

        const updatedDoc = await entities.save(doc, { language: 'en' });
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

      const updatedDoc = await entities.save(doc, { language: 'en' });

      expect(updatedDoc.permissions).toEqual([
        expect.objectContaining({ refId: 'user1' }),
        expect.objectContaining({ refId: 'user2' }),
      ]);
    });

    describe('when generatedToc is undefined', () => {
      it('should not replicate the value to all languages', async () => {
        const doc = { _id: batmanFinishesId, sharedId: 'shared', generatedToc: true };
        await entities.save(doc, { language: 'en' });
        await entities.save({ _id: batmanFinishesId, sharedId: 'shared' }, { language: 'en' });
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

      const updatedDoc = await entities.save(doc, { language: 'en' });
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

        const createdEntity = await entities.save(entity, { user, language: 'es' });

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
        await entities.save(existing, { user, language: 'en' });

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
        await entities.save(existing, { user, language: 'en' });

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

      await entities.save(doc, { user, language: 'es' }, false);
      expect(entities.updateMetdataFromRelationships).not.toHaveBeenCalled();
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', async () => {
        jest.spyOn(date, 'currentUTC').mockReturnValue(10);
        const modifiedDoc = { _id: batmanFinishesId, sharedId: 'shared' };
        await entities.save(modifiedDoc, { user: 'another_user', language: 'en' });
        const doc = await entities.getById('shared', 'en');
        expect(doc.user).not.toBe('another_user');
        expect(doc.creationDate).not.toBe(10);
      });

      it('should return the previously saved documents of the entity', async () => {
        const modifiedDoc = { _id: batmanFinishesId, sharedId: 'shared' };
        const doc = await entities.save(modifiedDoc, {
          language: 'en',
        });
        expect(doc.documents[0].entity).toBe('shared');
      });
    });

    describe('save entity without a logged user', () => {
      it('should save the entity with unrestricted access', async () => {
        const user = {};
        userFactory.mock(undefined);
        const entity = { title: 'Batman begins', template: templateId, language: 'es' };
        const createdEntity = await entities.save(entity, { user, language: 'es' });
        expect(createdEntity._id).not.toBeUndefined();
        expect(createdEntity.title).toEqual(entity.title);
        userFactory.mockEditorUser();
      });
    });

    describe('events', () => {
      it('should emit an event when an entity is updated', async () => {
        const emitSpy = spyOnEmit();
        const before = fixtures.entities.find(e => e._id === batmanFinishesId);
        const beforeAllLanguages = fixtures.entities.filter(e => e.sharedId === before.sharedId);
        const after = { ...before, title: 'new title' };

        await entities.save(after, { language: 'en' });

        const afterAllLanguages = await entities.getAllLanguages(before.sharedId);

        emitSpy.expectToEmitEvent(EntityUpdatedEvent, {
          before: beforeAllLanguages,
          after: afterAllLanguages,
          targetLanguageKey: 'en',
        });
        emitSpy.restore();
      });
    });
  });

  describe('updateMetdataFromRelationships', () => {
    it('should update the metdata based on the entity relationships', async () => {
      await entities.updateMetdataFromRelationships(['shared', 'missingEntity'], 'en');
      const updatedEntity = await entities.getById('shared', 'en');
      expect(updatedEntity.metadata.friends).toEqual([
        { icon: null, type: 'entity', label: 'shared2title', value: 'shared2' },
      ]);
    });

    it('should not fail on newly created documents (without metadata)', async () => {
      const doc = { title: 'Batman begins', template: templateId };
      const user = { _id: db.id() };
      const newEntity = await entities.save(doc, { user, language: 'es' });

      await entities.updateMetdataFromRelationships([newEntity.sharedId], 'es');
      const updatedEntity = await entities.getById(newEntity.sharedId, 'en');
      expect(updatedEntity.metadata).toEqual({
        date: [],
        daterange: [],
        enemies: [],
        field_nested: [],
        friends: [],
        multidate: [],
        multidaterange: [],
        multiselect: [],
        select: [],
        numeric: [],
      });
    });

    describe('unrestricted for collaborator', () => {
      it('should save the entity with unrestricted access', async () => {
        userFactory.mock({
          _id: 'user1',
          role: UserRole.COLLABORATOR,
          username: 'User 1',
          email: 'col@test.com',
        });

        await entities.updateMetdataFromRelationships(['shared'], 'en');
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

      const updatedDoc = await entities.save(doc, { language: 'en' });
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

      const updatedDoc = await entities.save(doc, { language: 'en' });
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

      await entities.save(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      expect(doc.metadata.daterange).toEqual(doc1.metadata.daterange);
      await entities.save(doc2, { language: 'en' });
      const doc1db = await entities.getById('shared', 'en');
      expect(doc1db.metadata.daterange).toEqual(doc2.metadata.daterange);
      await entities.save(doc3, { language: 'en' });
      const doc2db = await entities.getById('shared', 'en');
      expect(doc2db.metadata.daterange).toEqual(doc3.metadata.daterange);
      await entities.save(doc4, { language: 'en' });
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

      const updatedDoc = await entities.save(doc, { language: 'en' });
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

      await entities.save(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      expect(doc.metadata.numeric).toEqual([{ value: 10 }]);
      await entities.save(doc2, { language: 'en' });
      const doc1db = await entities.getById('shared', 'en');
      expect(doc1db.metadata.numeric).toEqual([{ value: 10.5 }]);
    });

    it('should sanitize numeric, parsing empty strings into no value', async () => {
      const doc1 = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { numeric: [{ value: '' }] },
        template: templateId,
      };

      await entities.save(doc1, { language: 'en' });
      const doc = await entities.getById('shared', 'en');
      expect(doc.metadata.numeric).toEqual(undefined);
    });

    it('should supply empty arrays for missing metadata, for all languages', async () => {
      const user = { _id: db.id() };
      const doc1 = {
        title: 'newEntity',
        metadata: { text: [{ value: 'text' }], numeric: [{ value: 1 }] },
        template: templateId,
      };

      await entities.save(doc1, { user, language: 'en' });
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
      const denormalized = await entities.denormalize(entity, { user: 'dummy', language: 'en' });
      expect(denormalized.metadata.friends[0].label).toBe('shared2title');
    });

    it('should denormalize inherited metadata', async () => {
      const entity = (await entities.get({ sharedId: 'shared', language: 'en' }))[0];

      const denormalized = await entities.denormalize(entity, { user: 'dummy', language: 'en' });
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
      const denormalized = await entities.denormalize(entity, { user: 'dummy', language: 'en' });
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

  describe('multipleUpdate()', () => {
    it('should save() all the entities with the new metadata', async () => {
      const metadata = {
        property1: [{ value: 'new text' }],
        description: [{ value: 'yeah!' }],
        friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
      };

      const updatedEntities = await entities.multipleUpdate(
        ['shared', 'shared1', 'non_existent'],
        { icon: { label: 'test' }, published: false, metadata },
        { language: 'en' }
      );

      expect(updatedEntities.length).toBe(2);

      const sharedEntity = updatedEntities.find(e => e.sharedId === 'shared');
      expect(sharedEntity).toEqual(
        expect.objectContaining({
          sharedId: 'shared',
          language: 'en',
          icon: { label: 'test' },
          published: true,
          metadata: expect.objectContaining(metadata),
        })
      );

      const shared1Entity = updatedEntities.find(e => e.sharedId === 'shared1');
      expect(shared1Entity).toEqual(
        expect.objectContaining({
          sharedId: 'shared1',
          language: 'en',
          icon: { label: 'test' },
          published: true,
          metadata: expect.objectContaining(metadata),
        })
      );
    });

    it('should save() all the entities with the diffMetadata', async () => {
      const updatedEntities1 = await entities.multipleUpdate(
        ['shared', 'other', 'non_existent'],
        {
          icon: { label: 'test' },
          published: false,
          diffMetadata: {
            multiselect: {
              added: [{ value: 'country_one' }],
              removed: [{ value: 'country_two' }],
            },
          },
        },
        { language: 'en' }
      );

      const updatedEntities2 = await entities.multipleUpdate(
        ['shared'],
        {
          diffMetadata: {
            multiselect: {
              added: [{ value: 'country_two' }],
              removed: [{ value: 'country_one' }],
            },
          },
        },
        { language: 'en' }
      );

      expect(updatedEntities1.length).toBe(2);
      expect(updatedEntities2.length).toBe(1);

      const sharedEntity = updatedEntities2.find(e => e.sharedId === 'shared');
      expect(sharedEntity).toEqual(
        expect.objectContaining({
          sharedId: 'shared',
          language: 'en',
          icon: { label: 'test' },
          published: true,
          metadata: expect.objectContaining({
            multiselect: [
              {
                label: 'Country2',
                value: 'country_two',
              },
            ],
          }),
        })
      );

      const shared1Entity = updatedEntities1.find(e => e.sharedId === 'other');
      expect(shared1Entity).toEqual(
        expect.objectContaining({
          sharedId: 'other',
          language: 'en',
          icon: { label: 'test' },
          published: false,
          metadata: expect.objectContaining({
            multiselect: [
              {
                label: 'Country1',
                value: 'country_one',
              },
            ],
          }),
        })
      );
    });

    it('should return error if user does not have write permissions over entities', async () => {
      userFactory.mock({
        _id: 'user1',
        role: 'collaborator',
        groups: [],
      });
      try {
        await entities.multipleUpdate(
          ['shared1', 'other'],
          {
            published: false,
          },
          { language: 'en' }
        );
        fail('Should throw error');
      } catch (e) {
        expect(e.message).toContain('permissions');
      }
    });

    it('should update entities if user has permissions on them', async () => {
      userFactory.mock({
        _id: 'user2',
        role: 'collaborator',
        groups: [{ _id: 'group1' }],
      });

      const updated = await entities.multipleUpdate(
        ['shared1', 'other'],
        {
          title: 'test title',
        },
        { language: 'en' }
      );

      expect(updated.find(e => e.title !== 'test title')).toBeUndefined();
    });
  });

  describe('saveMultiple()', () => {
    it('should allow partial saveMultiple with correct full indexing', done => {
      const partialDoc = { _id: batmanFinishesId, sharedId: 'shared', title: 'Updated title' };
      const partialDoc2 = {
        _id: syncPropertiesEntityId,
        sharedId: 'shared',
        title: 'Updated title 2',
      };
      entities
        .saveMultiple([partialDoc, partialDoc2])
        .then(response => Promise.all([response, entities.getById(batmanFinishesId)]))
        .then(([response, savedEntity]) => {
          const expectedQuery = {
            _id: { $in: [batmanFinishesId, syncPropertiesEntityId] },
          };

          expect(response[0]._id.toString()).toBe(batmanFinishesId.toString());
          expect(savedEntity.title).toBe('Updated title');
          expect(savedEntity.metadata).toEqual(
            expect.objectContaining({
              property1: [{ value: 'value1' }],
              friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
            })
          );
          expect(search.indexEntities).toHaveBeenCalledWith(expectedQuery, '+fullText');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('updateMetadataProperties', () => {
    let currentTemplate;
    beforeEach(() => {
      currentTemplate = {
        _id: templateChangingNames,
        properties: [
          { _id: templateChangingNamesProps.prop1id, type: 'text', name: 'property1' },
          { _id: templateChangingNamesProps.prop2id, type: 'text', name: 'property2' },
          { _id: templateChangingNamesProps.prop3id, type: 'text', name: 'property3' },
        ],
      };
    });

    it('should do nothing when there is no changed or deleted properties', async () => {
      jest.spyOn(entitiesModel, 'updateMany');

      await entities.updateMetadataProperties(currentTemplate, currentTemplate);
      expect(entitiesModel.updateMany).not.toHaveBeenCalled();
    });

    it('should update property names on entities based on the changes to the template', async () => {
      const template = {
        _id: templateChangingNames,
        properties: [
          {
            _id: templateChangingNamesProps.prop1id,
            type: 'text',
            name: 'property1',
            label: 'new name1',
          },
          {
            _id: templateChangingNamesProps.prop2id,
            type: 'text',
            name: 'property2',
            label: 'new name2',
          },
          {
            _id: templateChangingNamesProps.prop3id,
            type: 'text',
            name: 'property3',
            label: 'property3',
          },
        ],
      };

      await entities.updateMetadataProperties(template, currentTemplate);
      const [docs, docDiferentTemplate] = await Promise.all([
        entities.get({ template: templateChangingNames }),
        entities.getById('shared', 'en'),
      ]);
      expect(docs[0].metadata.new_name1).toEqual([{ value: 'value1' }]);
      expect(docs[0].metadata.new_name2).toEqual([{ value: 'value2' }]);
      expect(docs[0].metadata.property3).toEqual([{ value: 'value3' }]);
      expect(docs[1].metadata.new_name1).toEqual([{ value: 'value1' }]);
      expect(docs[1].metadata.new_name2).toEqual([{ value: 'value2' }]);
      expect(docs[1].metadata.property3).toEqual([{ value: 'value3' }]);
      expect(docDiferentTemplate.metadata.property1).toEqual([{ value: 'value1' }]);
      expect(search.indexEntities).toHaveBeenCalledWith({ template: template._id });
    });

    it('should delete and rename properties passed', async () => {
      const template = {
        _id: templateChangingNames,
        properties: [
          {
            _id: templateChangingNamesProps.prop2id,
            type: 'text',
            name: 'property2',
            label: 'new name',
          },
        ],
      };

      await entities.updateMetadataProperties(template, currentTemplate);
      const docs = await entities.get({ template: templateChangingNames });
      expect(docs[0].metadata.property1).not.toBeDefined();
      expect(docs[0].metadata.new_name).toEqual([{ value: 'value2' }]);
      expect(docs[0].metadata.property2).not.toBeDefined();
      expect(docs[0].metadata.property3).not.toBeDefined();
      expect(docs[1].metadata.property1).not.toBeDefined();
      expect(docs[1].metadata.new_name).toEqual([{ value: 'value2' }]);
      expect(docs[1].metadata.property2).not.toBeDefined();
      expect(docs[1].metadata.property3).not.toBeDefined();
    });

    it('should delete missing properties', async () => {
      const template = {
        _id: templateChangingNames,
        properties: [
          {
            _id: templateChangingNamesProps.prop2id,
            type: 'text',
            name: 'property2',
            label: 'property2',
          },
        ],
      };

      await entities.updateMetadataProperties(template, currentTemplate);
      const docs = await entities.get({ template: templateChangingNames });
      expect(docs[0].metadata.property1).not.toBeDefined();
      expect(docs[0].metadata.property2).toBeDefined();
      expect(docs[0].metadata.property3).not.toBeDefined();
      expect(docs[1].metadata.property1).not.toBeDefined();
      expect(docs[1].metadata.property2).toBeDefined();
      expect(docs[1].metadata.property3).not.toBeDefined();
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

  describe('delete', () => {
    describe('when the original file does not exist', () => {
      it('should delete the entity and not throw an error', async () => {
        await entities.delete('shared1');
        const response = await entities.get({ sharedId: 'shared1' });
        expect(response.length).toBe(0);
      });
    });

    describe('when database deletion throws an error', () => {
      it('should reindex the documents', async () => {
        jest
          .spyOn(entitiesModel, 'delete')
          .mockImplementation(() => Promise.reject(new Error('error')));

        let error;
        try {
          await entities.delete('shared');
        } catch (_error) {
          error = _error;
          expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'shared' }, '+fullText');
        }
        expect(error).toBeDefined();
        jest.mocked(entitiesModel.delete).mockRestore();
      });
    });

    it('should delete the document in the database', async () => {
      await entities.delete('shared');
      const response = await entities.get({ sharedId: 'shared' });
      expect(response.length).toBe(0);
    });

    it('should delete the document from the search', async () => {
      jest.mocked(search.delete).mockReset();
      await entities.delete('shared');
      const args = jest.mocked(search.delete).mock.calls;
      expect(search.delete).toHaveBeenCalled();
      expect(args[0][0]._id.toString()).toBe(batmanFinishesId.toString());
    });

    it('should delete the document relationships', async () => {
      await entities.delete('shared');
      const refs = await relationships.get({ entity: 'shared' });
      expect(refs.length).toBe(0);
    });

    it('should delete the original file', async () => {
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'), '');
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'), '');
      await fs.writeFile(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'), '');
      await fs.writeFile(uploadsPath(`${uploadId1}.jpg`), '');
      await fs.writeFile(uploadsPath(`${uploadId2}.jpg`), '');

      expect(await storage.fileExists('8202c463d6158af8065022d9b5014ccb.pdf', 'document')).toBe(
        true
      );
      expect(await storage.fileExists('8202c463d6158af8065022d9b5014cc1.pdf', 'document')).toBe(
        true
      );
      expect(await storage.fileExists('8202c463d6158af8065022d9b5014ccc.pdf', 'document')).toBe(
        true
      );
      expect(await storage.fileExists(`${uploadId1}.jpg`, 'document')).toBe(true);
      expect(await storage.fileExists(`${uploadId2}.jpg`, 'document')).toBe(true);

      await entities.delete('shared');

      expect(await storage.fileExists('8202c463d6158af8065022d9b5014ccb.pdf', 'document')).toBe(
        false
      );
      expect(await storage.fileExists('8202c463d6158af8065022d9b5014cc1.pdf', 'document')).toBe(
        false
      );
      expect(await storage.fileExists('8202c463d6158af8065022d9b5014ccc.pdf', 'document')).toBe(
        false
      );

      expect(await storage.fileExists(`${uploadId1}.jpg`, 'document')).toBe(false);
      expect(await storage.fileExists(`${uploadId2}.jpg`, 'document')).toBe(false);
    });

    describe('when entity is being used as thesauri', () => {
      it('should delete the entity id on all entities using it from select/multiselect values', async () => {
        jest.mocked(search.indexEntities).mockRestore();
        await entities.delete('shared');

        const documentsToIndex = jest.mocked(search.bulkIndex).mock.calls[0][0];

        expect(documentsToIndex[0].metadata.multiselect).toEqual([{ value: 'value0' }]);
        expect(documentsToIndex[1].metadata.multiselect2).toEqual([{ value: 'value2' }]);
        expect(documentsToIndex[2].metadata.select).toEqual([]);
        expect(documentsToIndex[3].metadata.select2).toEqual([]);
      });

      describe('when there is no multiselects but there is selects', () => {
        it('should only delete selects and not throw an error', async () => {
          jest.mocked(search.indexEntities).mockRestore();
          jest.mocked(search.bulkIndex).mockReset();

          await entities.delete('shared10');

          const documentsToIndex = jest.mocked(search.bulkIndex).mock.calls[0][0];
          expect(documentsToIndex[0].metadata.select).toEqual([]);
        });
      });

      describe('when there is no selects but there is multiselects', () => {
        it('should only delete multiselects and not throw an error', async () => {
          jest.mocked(search.indexEntities).mockRestore();
          jest.mocked(search.bulkIndex).mockReset();
          await entities.delete('multiselect');
          const documentsToIndex = jest.mocked(search.bulkIndex).mock.calls[0][0];
          expect(documentsToIndex[0].metadata.multiselect).toEqual([{ value: 'value1' }]);
        });
      });
    });

    it('should delete the suggestions with the entity sharedId', async () => {
      const emitSpy = spyOnEmit();
      await entities.delete('shared');
      emitSpy.expectToEmitEvent(EntityDeletedEvent, {
        entity: fixtures.entities
          .filter(entity => entity.sharedId === 'shared')
          .map(entity => expect.objectContaining({ _id: entity._id })),
      });
      emitSpy.restore();
    });

    it('should remove the entity from the relationship metadata of related entities', async () => {
      await entities.delete('shared2');
      const [related] = await db.mongodb
        .collection('entities')
        .find({ sharedId: 'shared', title: 'Batman finishes' })
        .toArray();
      expect(related.metadata).toMatchObject({
        friends: [],
        enemies: [],
      });
      const [related2] = await db.mongodb
        .collection('entities')
        .find({ sharedId: 'entityWithOnlyAnyRelationship' })
        .toArray();
      expect(related2.metadata).toMatchObject({
        relationship_to_any_template: [],
      });
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
      await entities.saveMultiple([{ _id: docId1, file: {} }]);

      await entities.addLanguage('ab', 2);
      const newEntities = await entities.get({ language: 'ab' }, '+permissions');
      expect(newEntities.length).toBe(15);

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
        await entities.save(entity, options);
        fail('should throw validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Ajv.ValidationError);
      }
    });
  });
});
