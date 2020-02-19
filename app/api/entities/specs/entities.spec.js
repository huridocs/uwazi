/* eslint-disable max-nested-callbacks,max-statements */

import Ajv from 'ajv';
import { catchErrors } from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import db from 'api/utils/testing_db';
import entitiesModel from 'api/entities/entitiesModel';
import fs from 'fs';
import relationships from 'api/relationships';
import search from 'api/search/search';
import { uploadsPath } from 'api/files/filesystem';

import entities from '../entities.js';
import fixtures, {
  batmanFinishesId,
  shared2,
  templateId,
  templateChangingNames,
  syncPropertiesEntityId,
  templateWithEntityAsThesauri,
  docId1,
  uploadId1,
  uploadId2,
} from './fixtures.js';

describe('entities', () => {
  beforeEach(async () => {
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(search, 'bulkIndex').and.returnValue(Promise.resolve());
    spyOn(search, 'bulkDelete').and.returnValue(Promise.resolve());
    await db.clearAllAndLoad(fixtures);
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
      spyOn(date, 'currentUTC').and.returnValue(universalTime);
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

      expect(createdDocumentEn.title).toBe(doc.title);
      expect(createdDocumentEn.user.equals(user._id)).toBe(true);
      expect(createdDocumentEn.published).toBe(false);
      expect(createdDocumentEn.creationDate).toEqual(universalTime);
    });

    it('should create a new entity for each language when passing an _id', async () => {
      const universalTime = 1;
      spyOn(date, 'currentUTC').and.returnValue(universalTime);
      const doc = { _id: '123456789012345678901234', title: 'Batman begins', language: 'es' };
      const user = { _id: db.id() };

      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs._id.toString()).toBe('123456789012345678901234');
      expect(createdDocumentEn._id.toString()).not.toBe('123456789012345678901234');
    });

    it('should create a new entity, preserving template if passed', async () => {
      const doc = { title: 'The Dark Knight', template: templateId };
      const user = { _id: db.id() };
      const { createdDocumentEs, createdDocumentEn } = await saveDoc(doc, user);

      expect(createdDocumentEs.template.toString()).toBe(templateId.toString());
      expect(createdDocumentEn.template.toString()).toBe(templateId.toString());
    });

    it('should return the newly created document for the passed language', done => {
      const doc = {
        title: 'the dark knight',
        fullText: { 0: 'the full text!' },
        metadata: { data: [{ value: 'should not be here' }] },
      };
      const user = { _id: db.id() };

      entities
        .save(doc, { user, language: 'en' })
        .then(createdDocument => {
          expect(createdDocument._id).toBeDefined();
          expect(createdDocument.title).toBe(doc.title);
          expect(createdDocument.user.equals(user._id)).toBe(true);
          expect(createdDocument.language).toEqual('en');
          expect(createdDocument.fullText).not.toBeDefined();
          expect(createdDocument.metadata).not.toBeDefined();
          done();
        })
        .catch(catchErrors(done));
    });

    it('should return updated entity', done => {
      const doc = {
        title: 'the dark knight',
        fullText: { 0: 'the full text!' },
        metadata: { data: [{ value: 'should not be here' }] },
      };
      const user = { _id: db.id() };

      entities
        .save(doc, { user, language: 'en' })
        .then(createdDocument =>
          entities.save({ ...createdDocument, title: 'updated title' }, { user, language: 'en' })
        )
        .then(updatedDocument => {
          expect(updatedDocument.title).toBe('updated title');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should index the newly created documents', done => {
      const doc = { title: 'the dark knight', template: templateId };
      const user = { _id: db.id() };

      entities
        .save(doc, { user, language: 'en' })
        .then(() => {
          expect(search.indexEntities).toHaveBeenCalled();
          done();
        })
        .catch(catchErrors(done));
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
      it('should replicate metadata being saved', done => {
        const doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: { text: [{ value: 'newMetadata' }] },
          template: templateId,
        };

        entities
          .save(doc, { language: 'en' })
          .then(updatedDoc => {
            expect(updatedDoc.language).toBe('en');
            return Promise.all([
              entities.getById('shared', 'es'),
              entities.getById('shared', 'en'),
              entities.getById('shared', 'pt'),
            ]);
          })
          .then(([docES, docEN, docPT]) => {
            expect(docEN.published).toBe(true);
            expect(docES.published).toBe(true);
            expect(docPT.published).toBe(true);

            expect(docEN.metadata.text).toEqual([{ value: 'newMetadata' }]);
            expect(docES.metadata.text).toEqual([{ value: 'newMetadata' }]);
            expect(docPT.metadata.text).toEqual([{ value: 'test' }]);
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('when icon changes', () => {
      it('should update icon on entities with the entity as relationship', async () => {
        const doc = {
          _id: shared2,
          sharedId: 'shared2',
          icon: {
            _id: 'changedIcon',
          },
        };

        await entities.save(doc, { language: 'en' });
        let relatedEntity = await entities.getById('shared', 'en');
        expect(relatedEntity.metadata.enemies[0].icon._id).toBe('changedIcon');

        relatedEntity = await entities.getById('other', 'en');
        expect(relatedEntity.metadata.enemies[1].icon._id).toBe('changedIcon');
        expect(relatedEntity.metadata.enemies[0].icon).toBe(null);
        expect(relatedEntity.metadata.enemies[2].icon).toBe(null);

        const updatedDoc = {
          _id: shared2,
          sharedId: 'shared2',
          icon: {
            _id: 'changedIconAgain',
          },
        };

        await entities.save(updatedDoc, { language: 'en' });
        relatedEntity = await entities.getById('shared', 'en');
        expect(relatedEntity.metadata.enemies[0].icon._id).toBe('changedIconAgain');
      });
    });

    describe('when title changes', () => {
      it('should update title on entities with the entity as relationship', async () => {
        const doc = {
          _id: shared2,
          sharedId: 'shared2',
          title: 'changedTitle',
        };

        await entities.save(doc, { language: 'en' });
        let relatedEntity = await entities.getById('shared', 'en');
        expect(relatedEntity.metadata.enemies[0].label).toBe('changedTitle');

        relatedEntity = await entities.getById('other', 'en');
        expect(relatedEntity.metadata.enemies[1].label).toBe('changedTitle');
        expect(relatedEntity.metadata.enemies[0].label).toBe('shouldNotChange');
        expect(relatedEntity.metadata.enemies[2].label).toBe('shouldNotChange1');
      });

      it('should not change related labels on other languages', async () => {
        const doc = {
          _id: shared2,
          sharedId: 'shared2',
          title: 'changedTitle',
        };

        await entities.save(doc, { language: 'en' });

        const relatedEntity = await entities.getById('other', 'es');

        expect(relatedEntity.metadata.enemies[0].label).toBe('translated1');
        expect(relatedEntity.metadata.enemies[1].label).toBe('translated2');
      });

      it('should index entities changed after propagating label change', async () => {
        const doc = {
          _id: shared2,
          sharedId: 'shared2',
          title: 'changedTitle',
        };

        search.indexEntities.and.callThrough();

        await entities.save(doc, { language: 'en' });

        const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];

        expect(documentsToIndex).toEqual([
          expect.objectContaining({
            sharedId: 'shared',
            language: 'en',
          }),
          expect.objectContaining({
            sharedId: 'other',
            language: 'en',
          }),
        ]);
      });
    });

    describe('when published/template property changes', () => {
      it('should replicate the change for all the languages', done => {
        const doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: {},
          published: false,
          template: templateId,
        };

        entities
          .save(doc, { language: 'en' })
          .then(updatedDoc => {
            expect(updatedDoc.language).toBe('en');
            return Promise.all([
              entities.getById('shared', 'es'),
              entities.getById('shared', 'en'),
            ]);
          })
          .then(([docES, docEN]) => {
            expect(docEN.template).toBeDefined();
            expect(docES.template).toBeDefined();

            expect(docES.published).toBe(false);
            expect(docES.template.equals(templateId)).toBe(true);
            expect(docEN.published).toBe(false);
            expect(docEN.template.equals(templateId)).toBe(true);
            done();
          })
          .catch(catchErrors(done));
      });
    });

    it('should sync select/multiselect/dates/multidate/multidaterange/numeric', done => {
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

      entities
        .save(doc, { language: 'en' })
        .then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared1', 'en'),
            entities.getById('shared1', 'es'),
            entities.getById('shared1', 'pt'),
          ]);
        })
        .then(([docEN, docES, docPT]) => {
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
          done();
        })
        .catch(catchErrors(done));
    });

    it('should saveEntityBasedReferences', async () => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      const entity = {
        title: 'Batman begins',
        template: templateId,
        language: 'es',
        metadata: {
          friends: [{ value: 'id1' }, { value: 'id2' }, { value: 'id3' }],
        },
      };
      const user = { _id: db.id() };

      const createdEntity = await entities.save(entity, { user, language: 'es' });
      const createdRelationships = await relationships.getByDocument(createdEntity.sharedId, 'es');
      expect(createdRelationships.length).toBe(4);
      expect(createdRelationships.map(r => r.entityData.title).sort()).toEqual([
        'Batman begins',
        'entity one',
        'entity three',
        'entity two',
      ]);
    });

    it('should not cirlce back to updateMetdataFromRelationships', async () => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      spyOn(entities, 'updateMetdataFromRelationships');
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

      await entities.save(doc, { user, language: 'es' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      expect(entities.updateMetdataFromRelationships).not.toHaveBeenCalled();
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', done => {
        spyOn(date, 'currentUTC').and.returnValue(10);
        const modifiedDoc = { _id: batmanFinishesId, sharedId: 'shared' };
        return entities
          .save(modifiedDoc, { user: 'another_user', language: 'en' })
          .then(() => entities.getById('shared', 'en'))
          .then(doc => {
            expect(doc.user).not.toBe('another_user');
            expect(doc.creationDate).not.toBe(10);
            done();
          })
          .catch(catchErrors(done));
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
  });

  describe('Sanitize', () => {
    it('should sanitize multidates, removing non valid dates', done => {
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: {
          multidate: [{ value: null }, { value: 1234 }, { value: null }, { value: 5678 }],
        },
        published: false,
        template: templateId,
      };

      entities
        .save(doc, { language: 'en' })
        .then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([entities.getById('shared', 'es'), entities.getById('shared', 'en')]);
        })
        .then(([docES, docEN]) => {
          expect(docES.metadata.multidate).toEqual([{ value: 1234 }, { value: 5678 }]);
          expect(docEN.metadata.multidate).toEqual([{ value: 1234 }, { value: 5678 }]);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should sanitize select, removing empty values', done => {
      const doc = {
        _id: batmanFinishesId,
        sharedId: 'shared',
        metadata: { select: [{ value: '' }] },
        published: false,
        template: templateId,
      };

      entities
        .save(doc, { language: 'en' })
        .then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([entities.getById('shared', 'es'), entities.getById('shared', 'en')]);
        })
        .then(([docES, docEN]) => {
          expect(docES.metadata.select).toEqual([]);
          expect(docEN.metadata.select).toEqual([]);
          done();
        })
        .catch(catchErrors(done));
    });
    it('should sanitize daterange, removing non valid dates', done => {
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

      entities
        .save(doc1, { language: 'en' })
        .then(() => entities.getById('shared', 'en'))
        .then(doc => {
          expect(doc.metadata.daterange).toEqual(doc1.metadata.daterange);
          return entities
            .save(doc2, { language: 'en' })
            .then(() => entities.getById('shared', 'en'));
        })
        .then(doc => {
          expect(doc.metadata.daterange).toEqual(doc2.metadata.daterange);
          return entities
            .save(doc3, { language: 'en' })
            .then(() => entities.getById('shared', 'en'));
        })
        .then(doc => {
          expect(doc.metadata.daterange).toEqual(doc3.metadata.daterange);
          return entities
            .save(doc4, { language: 'en' })
            .then(() => entities.getById('shared', 'en'));
        })
        .then(doc => {
          expect(doc.metadata.daterange).toEqual([]);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should sanitize multidaterange, removing non valid dates', done => {
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

      entities
        .save(doc, { language: 'en' })
        .then(updatedDoc => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([entities.getById('shared', 'es'), entities.getById('shared', 'en')]);
        })
        .then(([docES, docEN]) => {
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
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('get', () => {
    it('should return matching entities for the conditions', done => {
      const sharedId = 'shared1';

      Promise.all([
        entities.get({ sharedId, language: 'en' }),
        entities.get({ sharedId, language: 'es' }),
      ])
        .then(([enDoc, esDoc]) => {
          expect(enDoc[0].title).toBe('EN');
          expect(esDoc[0].title).toBe('ES');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('denormalize', () => {
    it('should denormalize entity with missing metadata labels', async () => {
      const entity = (await entities.get({ sharedId: 'shared', language: 'en' }))[0];
      entity.metadata.friends[0].label = '';
      const denormalized = await entities.denormalize(entity, { user: 'dummy', language: 'en' });
      expect(denormalized.metadata.friends[0].label).toBe('shared2title');
    });
  });
  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', async () => {
      const count = await entities.countByTemplate(templateId);
      expect(count).toBe(7);
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
          expect(docs.length).toBe(2);
          expect(docs[0].title).toBe('Batman finishes');
          expect(docs[1].title).toBe('EN');
          done();
        })
        .catch(done.fail);
    });

    it('should return all entities (including unpublished) if required', async () => {
      const docs = await entities.getByTemplate(templateId, 'en', false);
      expect(docs.length).toBe(4);
      expect(docs[0].title).toBe('Batman finishes');
      expect(docs[1].title).toBe('Unpublished entity');
      expect(docs[2].title).toBe('EN');
      expect(docs[3].title).toBe('shared2title');
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
          published: false,
          metadata: expect.objectContaining(metadata),
        })
      );

      const shared1Entity = updatedEntities.find(e => e.sharedId === 'shared1');
      expect(shared1Entity).toEqual(
        expect.objectContaining({
          sharedId: 'shared1',
          language: 'en',
          icon: { label: 'test' },
          published: false,
          metadata: expect.objectContaining(metadata),
        })
      );
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
          { id: '1', type: 'text', name: 'property1' },
          { id: '2', type: 'text', name: 'property2' },
          { id: '3', type: 'text', name: 'property3' },
          { type: 'text', label: 'new property' },
        ],
      };
    });

    it('should do nothing when there is no changed or deleted properties', done => {
      spyOn(entitiesModel.db, 'updateMany');

      entities
        .updateMetadataProperties(currentTemplate, currentTemplate)
        .then(() => {
          expect(entitiesModel.db.updateMany).not.toHaveBeenCalled();
          done();
        })
        .catch(catchErrors(done));
    });

    it('should update property names on entities based on the changes to the template', done => {
      const template = {
        _id: templateChangingNames,
        properties: [
          { id: '1', type: 'text', name: 'property1', label: 'new name1' },
          { id: '2', type: 'text', name: 'property2', label: 'new name2' },
          { id: '3', type: 'text', name: 'property3', label: 'property3' },
        ],
      };

      entities
        .updateMetadataProperties(template, currentTemplate)
        .then(() =>
          Promise.all([
            entities.get({ template: templateChangingNames }),
            entities.getById('shared', 'en'),
          ])
        )
        .then(([docs, docDiferentTemplate]) => {
          expect(docs[0].metadata.new_name1).toEqual([{ value: 'value1' }]);
          expect(docs[0].metadata.new_name2).toEqual([{ value: 'value2' }]);
          expect(docs[0].metadata.property3).toEqual([{ value: 'value3' }]);

          expect(docs[1].metadata.new_name1).toEqual([{ value: 'value1' }]);
          expect(docs[1].metadata.new_name2).toEqual([{ value: 'value2' }]);
          expect(docs[1].metadata.property3).toEqual([{ value: 'value3' }]);

          expect(docDiferentTemplate.metadata.property1).toEqual([{ value: 'value1' }]);
          expect(search.indexEntities).toHaveBeenCalledWith({ template: template._id }, null, 1000);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should delete and rename properties passed', done => {
      const template = {
        _id: templateChangingNames,
        properties: [{ id: '2', type: 'text', name: 'property2', label: 'new name' }],
      };

      entities
        .updateMetadataProperties(template, currentTemplate)
        .then(() => entities.get({ template: templateChangingNames }))
        .then(docs => {
          expect(docs[0].metadata.property1).not.toBeDefined();
          expect(docs[0].metadata.new_name).toEqual([{ value: 'value2' }]);
          expect(docs[0].metadata.property2).not.toBeDefined();
          expect(docs[0].metadata.property3).not.toBeDefined();

          expect(docs[1].metadata.property1).not.toBeDefined();
          expect(docs[1].metadata.new_name).toEqual([{ value: 'value2' }]);
          expect(docs[1].metadata.property2).not.toBeDefined();
          expect(docs[1].metadata.property3).not.toBeDefined();
          done();
        })
        .catch(catchErrors(done));
    });

    it('should delete missing properties', done => {
      const template = {
        _id: templateChangingNames,
        properties: [{ id: '2', type: 'text', name: 'property2', label: 'property2' }],
      };

      entities
        .updateMetadataProperties(template, currentTemplate)
        .then(() => entities.get({ template: templateChangingNames }))
        .then(docs => {
          expect(docs[0].metadata.property1).not.toBeDefined();
          expect(docs[0].metadata.property2).toBeDefined();
          expect(docs[0].metadata.property3).not.toBeDefined();

          expect(docs[1].metadata.property1).not.toBeDefined();
          expect(docs[1].metadata.property2).toBeDefined();
          expect(docs[1].metadata.property3).not.toBeDefined();
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('removeValuesFromEntities', () => {
    it('should remove values of properties passed on all entities having that property', done => {
      entities
        .removeValuesFromEntities({ multiselect: [] }, templateWithEntityAsThesauri)
        .then(() => entities.get({ template: templateWithEntityAsThesauri }))
        .then(_entities => {
          expect(_entities[0].metadata.multiselect).toEqual([]);
          expect(search.indexEntities).toHaveBeenCalled();
          done();
        })
        .catch(catchErrors(done));
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
        spyOn(entitiesModel, 'delete').and.callFake(() => Promise.reject('error'));
        let error;
        try {
          await entities.delete('shared');
        } catch (_error) {
          error = _error;
          expect(search.indexEntities).toHaveBeenCalledWith({ sharedId: 'shared' }, '+fullText');
        }
        expect(error).toBeDefined();
      });
    });

    it('should delete the document in the database', done => {
      entities
        .delete('shared')
        .then(() => entities.get({ sharedId: 'shared' }))
        .then(response => {
          expect(response.length).toBe(0);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should delete the document from the search', done =>
      entities
        .delete('shared')
        .then(() => {
          const argumnets = search.delete.calls.allArgs();
          expect(search.delete).toHaveBeenCalled();
          expect(argumnets[0][0]._id.toString()).toBe(batmanFinishesId.toString());
          done();
        })
        .catch(catchErrors(done)));

    it('should delete the document relationships', done =>
      entities
        .delete('shared')
        .then(() => relationships.get({ entity: 'shared' }))
        .then(refs => {
          expect(refs.length).toBe(0);
          done();
        })
        .catch(catchErrors(done)));

    it('should delete the original file', async () => {
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'));
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'));
      fs.writeFileSync(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'));
      fs.writeFileSync(uploadsPath(`${uploadId1}.jpg`));
      fs.writeFileSync(uploadsPath(`${uploadId2}.jpg`));

      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(true);
      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(true);
      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(true);
      expect(fs.existsSync(uploadsPath(`${uploadId1}.jpg`))).toBe(true);
      expect(fs.existsSync(uploadsPath(`${uploadId2}.jpg`))).toBe(true);

      await entities.delete('shared');

      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014ccb.pdf'))).toBe(false);
      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014cc1.pdf'))).toBe(false);
      expect(fs.existsSync(uploadsPath('8202c463d6158af8065022d9b5014ccc.pdf'))).toBe(false);

      expect(fs.existsSync(uploadsPath(`${uploadId1}.jpg`))).toBe(false);
      expect(fs.existsSync(uploadsPath(`${uploadId2}.jpg`))).toBe(false);
    });

    describe('when entity is being used as thesauri', () => {
      it('should delete the entity id on all entities using it from select/multiselect values', async () => {
        search.indexEntities.and.callThrough();
        await entities.delete('shared');
        const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
        expect(documentsToIndex[0].metadata.multiselect).toEqual([{ value: 'value1' }]);
        expect(documentsToIndex[1].metadata.multiselect2).toEqual([{ value: 'value2' }]);
        expect(documentsToIndex[2].metadata.select).toEqual([]);
        expect(documentsToIndex[3].metadata.select2).toEqual([]);
      });

      describe('when there is no multiselects but there is selects', () => {
        it('should only delete selects and not throw an error', async () => {
          search.indexEntities.and.callThrough();
          await entities.delete('shared10');
          const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
          expect(documentsToIndex[0].metadata.select).toEqual([]);
        });
      });

      describe('when there is no selects but there is multiselects', () => {
        it('should only delete multiselects and not throw an error', async () => {
          search.indexEntities.and.callThrough();
          await entities.delete('multiselect');
          const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
          expect(documentsToIndex[0].metadata.multiselect).toEqual([{ value: 'value1' }]);
        });
      });
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete() all the given entities', done => {
      spyOn(entities, 'delete').and.returnValue(Promise.resolve());
      entities
        .deleteMultiple(['id1', 'id2'])
        .then(() => {
          expect(entities.delete).toHaveBeenCalledWith('id1', false);
          expect(entities.delete).toHaveBeenCalledWith('id2', false);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('addLanguage()', () => {
    it('should duplicate all the entities from the default language to the new one', async () => {
      spyOn(entities, 'createThumbnail').and.callFake(entity => {
        if (!entity.file) {
          return Promise.reject(
            new Error('entities without file should not try to create thumbnail')
          );
        }
        return Promise.resolve();
      });

      await entities.saveMultiple([{ _id: docId1, file: {} }]);
      await entities.addLanguage('ab', 2);
      const newEntities = await entities.get({ language: 'ab' });

      expect(newEntities.length).toBe(11);
    });
  });

  describe('removeLanguage()', () => {
    it('should delete all entities from the language', async () => {
      spyOn(search, 'deleteLanguage');
      spyOn(entities, 'createThumbnail').and.returnValue(Promise.resolve());
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
