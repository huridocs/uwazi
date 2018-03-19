/* eslint-disable max-nested-callbacks */
import {catchErrors} from 'api/utils/jasmineHelpers';
import date from 'api/utils/date.js';
import db from 'api/utils/testing_db';
import entitiesModel from 'api/entities/entitiesModel';
import fs from 'fs';
import relationships from 'api/relationships';
import search from 'api/search/search';

import entities from '../entities.js';
import fixtures, {batmanFinishesId, templateId, templateChangingNames, syncPropertiesEntityId, templateWithEntityAsThesauri} from './fixtures.js';

describe('entities', () => {
  beforeEach((done) => {
    spyOn(relationships, 'saveEntityBasedReferences').and.returnValue(Promise.resolve());
    spyOn(search, 'index').and.returnValue(Promise.resolve());
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    spyOn(search, 'bulkIndex').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('save', () => {
    it('should uniq the values on multiselect and relationship fields', (done) => {
      const entity = {
        title: 'Batman begins',
        template: templateId,
        metadata: {
          multiselect: ['id1', 'id2', 'id2', 'id1', 'id3'],
          friends: ['id1', 'id2', 'id2', 'id1', 'id3', 'id3']
        }
      };
      const user = {};

      entities.save(entity, {user, language: 'es'})
      .then((e) => entities.getById(e._id))
      .then((createdEntity) => {
        expect(createdEntity.metadata.multiselect).toEqual(['id1', 'id2', 'id3']);
        expect(createdEntity.metadata.friends).toEqual(['id1', 'id2', 'id3']);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a new entity for each language in settings with a language property and a shared id', (done) => {
      const universalTime = 1;
      spyOn(date, 'currentUTC').and.returnValue(universalTime);
      let doc = {title: 'Batman begins', template: templateId};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'es'})
      .then(() => entities.get())
      .then((docs) => {
        let createdDocumentEs = docs.find((d) => d.title === 'Batman begins' && d.language === 'es');
        let createdDocumentEn = docs.find((d) => d.title === 'Batman begins' && d.language === 'en');

        expect(createdDocumentEs.sharedId).toBe(createdDocumentEn.sharedId);

        expect(createdDocumentEs.title).toBe(doc.title);
        expect(createdDocumentEs.user.equals(user._id)).toBe(true);
        expect(createdDocumentEs.type).toBe('entity');
        expect(createdDocumentEs.published).toBe(false);
        expect(createdDocumentEs.creationDate).toEqual(universalTime);

        expect(createdDocumentEn.title).toBe(doc.title);
        expect(createdDocumentEn.user.equals(user._id)).toBe(true);
        expect(createdDocumentEn.type).toBe('entity');
        expect(createdDocumentEn.published).toBe(false);
        expect(createdDocumentEn.creationDate).toEqual(universalTime);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return the newly created document for the passed language', (done) => {
      let doc = {title: 'the dark knight', fullText: 'the full text!', metadata: {data: 'should not be here'}};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'en'})
      .then((createdDocument) => {
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

    it('should return updated entity', (done) => {
      let doc = {title: 'the dark knight', fullText: 'the full text!', metadata: {data: 'should not be here'}};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'en'})
      .then((createdDocument) => {
        createdDocument.title = 'updated title';
        return entities.save(createdDocument, {user, language: 'en'});
      })
      .then((updatedDocument) => {
        expect(updatedDocument.title).toBe('updated title');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should index the newly created documents', (done) => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
      let doc = {title: 'the dark knight', template: templateId};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'en'})
      .then(() => {
        expect(entities.indexEntities).toHaveBeenCalled();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow partial saves with correct full indexing (NOTE!: partial update requires sending sharedId)', (done) => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
      let partialDoc = {_id: batmanFinishesId, sharedId: 'shared', title: 'Updated title'};
      entities.save(partialDoc, {language: 'en'})
      .then(() => {
        return entities.getById(batmanFinishesId);
      })
      .then(savedEntity => {
        expect(savedEntity.title).toBe('Updated title');
        expect(savedEntity.metadata).toEqual({property1: 'value1'});
        expect(entities.indexEntities).toHaveBeenCalled();
        done();
      })
      .catch(done.fail);
    });

    describe('when other languages have no metadata', () => {
      it('should replicate metadata being saved', (done) => {
        let doc = {_id: batmanFinishesId, sharedId: 'shared', metadata: {text: 'newMetadata'}, template: templateId};

        entities.save(doc, {language: 'en'})
        .then((updatedDoc) => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared', 'es'),
            entities.getById('shared', 'en'),
            entities.getById('shared', 'pt')
          ]);
        })
        .then(([docES, docEN, docPT]) => {
          expect(docEN.published).toBe(true);
          expect(docES.published).toBe(true);
          expect(docPT.published).toBe(true);

          expect(docEN.metadata.text).toBe('newMetadata');
          expect(docES.metadata.text).toBe('newMetadata');
          expect(docPT.metadata.text).toBe('test');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when other languages have the same file', () => {
      it('should replicate the toc being saved', (done) => {
        let doc = {
          _id: batmanFinishesId,
          sharedId: 'shared',
          metadata: {text: 'newMetadata'},
          template: templateId,
          toc: [{label: 'entry1'}],
          file: {filename: '8202c463d6158af8065022d9b5014cc1.pdf'}
        };

        entities.save(doc, {language: 'en'})
        .then((updatedDoc) => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared', 'es'),
            entities.getById('shared', 'en'),
            entities.getById('shared', 'pt')
          ]);
        })
        .then(([docES, docEN, docPT]) => {
          expect(docEN.published).toBe(true);
          expect(docES.published).toBe(true);
          expect(docPT.published).toBe(true);

          expect(docEN.toc[0].label).toBe(doc.toc[0].label);
          expect(docES.toc).toBeUndefined();
          expect(docPT.toc[0].label).toBe(doc.toc[0].label);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when published/template property changes', () => {
      it('should replicate the change for all the languages', (done) => {
        let doc = {_id: batmanFinishesId, sharedId: 'shared', metadata: {}, published: false, template: templateId};

        entities.save(doc, {language: 'en'})
        .then((updatedDoc) => {
          expect(updatedDoc.language).toBe('en');
          return Promise.all([
            entities.getById('shared', 'es'),
            entities.getById('shared', 'en')
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

    it('should sync select/multiselect/dates/multidate/multidaterange', (done) => {
      let doc = {_id: syncPropertiesEntityId, sharedId: 'shared1', template: templateId,
        metadata: {
          text: 'changedText',
          select: 'select',
          multiselect: 'multiselect',
          date: 'date',
          multidate: [1234],
          multidaterange: [{from: 1, to: 2}]
        }
      };

      entities.save(doc, {language: 'en'})
      .then((updatedDoc) => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
          entities.getById('shared1', 'en'),
          entities.getById('shared1', 'es'),
          entities.getById('shared1', 'pt')
        ]);
      })
      .then(([docEN, docES, docPT]) => {
        expect(docEN.metadata.text).toBe('changedText');
        expect(docEN.metadata.select).toBe('select');
        expect(docEN.metadata.multiselect).toBe('multiselect');
        expect(docEN.metadata.date).toBe('date');
        expect(docEN.metadata.multidate).toEqual([1234]);
        expect(docEN.metadata.multidaterange).toEqual([{from: 1, to: 2}]);

        expect(docES.metadata.property1).toBe('text');
        expect(docES.metadata.select).toBe('select');
        expect(docES.metadata.multiselect).toBe('multiselect');
        expect(docES.metadata.date).toBe('date');
        expect(docES.metadata.multidate).toEqual([1234]);
        expect(docES.metadata.multidaterange).toEqual([{from: 1, to: 2}]);

        expect(docPT.metadata.property1).toBe('text');
        expect(docPT.metadata.select).toBe('select');
        expect(docPT.metadata.multiselect).toBe('multiselect');
        expect(docPT.metadata.date).toBe('date');
        expect(docPT.metadata.multidate).toEqual([1234]);
        expect(docPT.metadata.multidaterange).toEqual([{from: 1, to: 2}]);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should saveEntityBasedReferences', (done) => {
      spyOn(date, 'currentUTC').and.returnValue(1);
      let doc = {title: 'Batman begins', template: templateId};
      let user = {_id: db.id()};

      entities.save(doc, {user, language: 'es'})
      .then(() => {
        expect(relationships.saveEntityBasedReferences.calls.argsFor(0)[0].title).toBe('Batman begins');
        expect(relationships.saveEntityBasedReferences.calls.argsFor(0)[0]._id).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when document have _id', () => {
      it('should not assign again user and creation date', (done) => {
        spyOn(date, 'currentUTC').and.returnValue(10);
        let modifiedDoc = {_id: batmanFinishesId, sharedId: 'shared'};
        return entities.save(modifiedDoc, {user: 'another_user', language: 'en'})
        .then(() => entities.getById('shared', 'en'))
        .then((doc) => {
          expect(doc.user).not.toBe('another_user');
          expect(doc.creationDate).not.toBe(10);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('updateMetdataFromRelationships', () => {
    it('should update the metdata based on the entity relationships', (done) => {
      entities.updateMetdataFromRelationships(['shared'], 'en')
      .then(() => entities.getById('shared', 'en'))
      .then((updatedEntity) => {
        expect(updatedEntity.metadata.friends).toEqual(['shared2']);
        done();
      });
    });
  });

  describe('Sanitize', () => {
    it('should sanitize multidates, removing non valid dates', (done) => {
      let doc = {
        _id: batmanFinishesId, sharedId: 'shared',
        metadata: {multidate: [null, 1234, null, 5678]},
        published: false, template: templateId
      };

      entities.save(doc, {language: 'en'})
      .then((updatedDoc) => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
          entities.getById('shared', 'es'),
          entities.getById('shared', 'en')
        ]);
      })
      .then(([docES, docEN]) => {
        expect(docES.metadata.multidate).toEqual([1234, 5678]);
        expect(docEN.metadata.multidate).toEqual([1234, 5678]);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should sanitize daterange, removing non valid dates', (done) => {
      let doc1 = {_id: batmanFinishesId, sharedId: 'shared', metadata: {daterange: {from: 1, to: 2}}, template: templateId};
      let doc2 = {_id: batmanFinishesId, sharedId: 'shared', metadata: {daterange: {from: null, to: 2}}, template: templateId};
      let doc3 = {_id: batmanFinishesId, sharedId: 'shared', metadata: {daterange: {from: 2, to: null}}, template: templateId};
      let doc4 = {_id: batmanFinishesId, sharedId: 'shared', metadata: {daterange: {from: null, to: null}}, template: templateId};

      entities.save(doc1, {language: 'en'}).then(() => entities.getById('shared', 'en'))
      .then((doc) => {
        expect(doc.metadata.daterange).toEqual(doc1.metadata.daterange);
        return entities.save(doc2, {language: 'en'}).then(() => entities.getById('shared', 'en'));
      })
      .then((doc) => {
        expect(doc.metadata.daterange).toEqual(doc2.metadata.daterange);
        return entities.save(doc3, {language: 'en'}).then(() => entities.getById('shared', 'en'));
      })
      .then((doc) => {
        expect(doc.metadata.daterange).toEqual(doc3.metadata.daterange);
        return entities.save(doc4, {language: 'en'}).then(() => entities.getById('shared', 'en'));
      })
      .then((doc) => {
        expect(doc.metadata.daterange).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should sanitize multidaterange, removing non valid dates', (done) => {
      let doc = {_id: batmanFinishesId, sharedId: 'shared', metadata: {multidaterange: [
        {from: 1, to: 2},
        {from: null, to: null},
        {from: null, to: 2},
        {from: 2, to: null},
        {from: null, to: null}
      ]}, published: false, template: templateId};

      entities.save(doc, {language: 'en'})
      .then((updatedDoc) => {
        expect(updatedDoc.language).toBe('en');
        return Promise.all([
          entities.getById('shared', 'es'),
          entities.getById('shared', 'en')
        ]);
      })
      .then(([docES, docEN]) => {
        expect(docES.metadata.multidaterange).toEqual([{from: 1, to: 2}, {from: null, to: 2}, {from: 2, to: null}]);
        expect(docEN.metadata.multidaterange).toEqual([{from: 1, to: 2}, {from: null, to: 2}, {from: 2, to: null}]);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('indexEntities', () => {
    it('should index entities based on query params passed', (done) => {
      entities.indexEntities({sharedId: 'shared'}, {title: 1})
      .then(() => {
        const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
        expect(documentsToIndex[0].title).toBeDefined();
        expect(documentsToIndex[0].metadata).not.toBeDefined();
        expect(documentsToIndex[1].title).toBeDefined();
        expect(documentsToIndex[1].metadata).not.toBeDefined();
        expect(documentsToIndex[2].title).toBeDefined();
        expect(documentsToIndex[2].metadata).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('get', () => {
    it('should return matching entities for the conditions', (done) => {
      let sharedId = 'shared1';

      Promise.all([
        entities.get({sharedId, language: 'en'}),
        entities.get({sharedId, language: 'es'})
      ])
      .then(([enDoc, esDoc]) => {
        expect(enDoc[0].title).toBe('EN');
        expect(esDoc[0].title).toBe('ES');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('countByTemplate', () => {
    it('should return how many entities using the template passed', (done) => {
      entities.countByTemplate(templateId)
      .then((count) => {
        expect(count).toBe(4);
        done();
      })
      .catch(done.fail);
    });

    it('should return 0 when no count found', (done) => {
      entities.countByTemplate(db.id())
      .then((count) => {
        expect(count).toBe(0);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getByTemplate', () => {
    it('should return all entities with passed template and language', (done) => {
      entities.getByTemplate(templateId, 'en')
      .then((docs) => {
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('Batman finishes');
        expect(docs[1].title).toBe('EN');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('multipleUpdate()', () => {
    it('should save() all the entities with the new metadata', (done) => {
      spyOn(entities, 'save').and.returnValue(Promise.resolve());
      const metadata = {property1: 'new text', description: 'yeah!'};
      entities.multipleUpdate(['shared', 'shared1'], {metadata}, {language: 'en'})
      .then(() => {
        expect(entities.save).toHaveBeenCalled();
        expect(entities.save).toHaveBeenCalled();
        expect(entities.save.calls.argsFor(0)[0].metadata).toEqual(metadata);
        expect(entities.save.calls.argsFor(1)[0].metadata).toEqual(metadata);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('saveMultiple()', () => {
    it('should allow partial saves with correct full indexing', (done) => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
      let partialDoc = {_id: batmanFinishesId, sharedId: 'shared', title: 'Updated title'};
      let partialDoc2 = {_id: syncPropertiesEntityId, sharedId: 'shared', title: 'Updated title 2'};
      entities.saveMultiple([partialDoc, partialDoc2])
      .then(response => {
        return Promise.all([response, entities.getById(batmanFinishesId)]);
      })
      .then(([response, savedEntity]) => {
        const expectedQuery = {
          _id: {$in: [batmanFinishesId, syncPropertiesEntityId]}
        };

        expect(response[0]._id.toString()).toBe(batmanFinishesId.toString());
        expect(savedEntity.title).toBe('Updated title');
        expect(savedEntity.metadata).toEqual({property1: 'value1'});
        expect(entities.indexEntities).toHaveBeenCalledWith(expectedQuery, '+fullText');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('updateMetadataProperties', () => {
    it('should do nothing when there is no changed or deleted properties', (done) => {
      spyOn(entitiesModel.db, 'updateMany');
      const template = {_id: templateChangingNames, properties: [
        {id: '1', type: 'text', name: 'property1'},
        {id: '2', type: 'text', name: 'property2'},
        {id: '3', type: 'text', name: 'property3'},
        {type: 'text', label: 'new property'}
      ]};

      entities.updateMetadataProperties(template)
      .then(() => {
        expect(entitiesModel.db.updateMany).not.toHaveBeenCalled();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should update property names on entities based on the changes to the template', (done) => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
      const template = {_id: templateChangingNames, properties: [
        {id: '1', type: 'text', name: 'property1', label: 'new name1'},
        {id: '2', type: 'text', name: 'property2', label: 'new name2'},
        {id: '3', type: 'text', name: 'property3', label: 'property3'}
      ]};

      entities.updateMetadataProperties(template)
      .then(() => Promise.all([
        entities.get({template: templateChangingNames}),
        entities.getById('shared', 'en')
      ]))
      .then(([docs, docDiferentTemplate]) => {
        expect(docs[0].metadata.new_name1).toBe('value1');
        expect(docs[0].metadata.new_name2).toBe('value2');
        expect(docs[0].metadata.property3).toBe('value3');

        expect(docs[1].metadata.new_name1).toBe('value1');
        expect(docs[1].metadata.new_name2).toBe('value2');
        expect(docs[1].metadata.property3).toBe('value3');

        expect(docDiferentTemplate.metadata.property1).toBe('value1');
        expect(entities.indexEntities).toHaveBeenCalledWith({template: template._id}, null, 1000);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete and rename properties passed', (done) => {
      const template = {_id: templateChangingNames, properties: [
        {id: '2', type: 'text', name: 'property2', label: 'new name'}
      ]};

      entities.updateMetadataProperties(template)
      .then(() => entities.get({template: templateChangingNames}))
      .then((docs) => {
        expect(docs[0].metadata.property1).not.toBeDefined();
        expect(docs[0].metadata.new_name).toBe('value2');
        expect(docs[0].metadata.property2).not.toBeDefined();
        expect(docs[0].metadata.property3).not.toBeDefined();

        expect(docs[1].metadata.property1).not.toBeDefined();
        expect(docs[1].metadata.new_name).toBe('value2');
        expect(docs[1].metadata.property2).not.toBeDefined();
        expect(docs[1].metadata.property3).not.toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete missing properties', (done) => {
      const template = {_id: templateChangingNames, properties: [
        {id: '2', type: 'text', name: 'property2', label: 'property2'}
      ]};

      entities.updateMetadataProperties(template)
      .then(() => entities.get({template: templateChangingNames}))
      .then((docs) => {
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
    it('should remove values of properties passed on all entities having that property', (done) => {
      spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
      entities.removeValuesFromEntities({multiselect: []}, templateWithEntityAsThesauri)
      .then(() => {
        return entities.get({template: templateWithEntityAsThesauri});
      })
      .then((_entities) => {
        expect(_entities[0].metadata.multiselect).toEqual([]);
        expect(entities.indexEntities).toHaveBeenCalled();
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('delete', () => {
    describe('when the original file does not exist', () => {
      it('should delete the entity and not throw an error', (done) => {
        entities.delete('shared1')
        .then(() => entities.get({sharedId: 'shared1'}))
        .then((response) => {
          expect(response.length).toBe(0);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('when database deletion throws an error', () => {
      it('should reindex the documents', (done) => {
        spyOn(entitiesModel, 'delete').and.callFake(() => Promise.reject('error'));
        spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());

        entities.delete('shared')
        .catch(() => {
          expect(entities.indexEntities).toHaveBeenCalledWith({sharedId: 'shared'}, '+fullText');
          done();
        });
      });
    });

    it('should delete the document in the database', (done) => {
      entities.delete('shared')
      .then(() => entities.get({sharedId: 'shared'}))
      .then((response) => {
        expect(response.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the document from the search', (done) => {
      return entities.delete('shared')
      .then(() => {
        const argumnets = search.delete.calls.allArgs();
        expect(search.delete).toHaveBeenCalled();
        expect(argumnets[0][0]._id.toString()).toBe(batmanFinishesId.toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the document relationships', (done) => {
      return entities.delete('shared')
      .then(() => relationships.get({entity: 'shared'}))
      .then((refs) => {
        expect(refs.length).toBe(0);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the original file', (done) => {
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf');
      fs.writeFileSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf');

      expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf')).toBe(true);
      expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf')).toBe(true);

      entities.delete('shared')
      .then(() => {
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014ccb.pdf')).toBe(false);
        expect(fs.existsSync('./uploaded_documents/8202c463d6158af8065022d9b5014cc1.pdf')).toBe(false);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when entity is being used as thesauri', () => {
      it('should delete the entity id on all entities using it from select/multiselect values', (done) => {
        entities.delete('shared')
        .then(() => {
          const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
          expect(documentsToIndex[0].metadata.multiselect).toEqual(['value1']);
          expect(documentsToIndex[1].metadata.multiselect2).toEqual(['value2']);
          expect(documentsToIndex[2].metadata.select).toBe('');
          expect(documentsToIndex[3].metadata.select2).toBe('');
          done();
        })
        .catch(catchErrors(done));
      });

      describe('when there is no multiselects but there is selects', () => {
        it('should only delete selects and not throw an error', (done) => {
          entities.delete('shared10')
          .then(() => {
            const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
            expect(documentsToIndex[0].metadata.select).toBe('');
            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('when there is no selects but there is multiselects', () => {
        it('should only delete multiselects and not throw an error', (done) => {
          entities.delete('multiselect')
          .then(() => {
            const documentsToIndex = search.bulkIndex.calls.argsFor(0)[0];
            expect(documentsToIndex[0].metadata.multiselect).toEqual(['value1']);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete() all the given entities', (done) => {
      spyOn(entities, 'delete').and.returnValue(Promise.resolve());
      entities.deleteMultiple(['id1', 'id2'])
      .then(() => {
        expect(entities.delete).toHaveBeenCalledWith('id1');
        expect(entities.delete).toHaveBeenCalledWith('id2');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
